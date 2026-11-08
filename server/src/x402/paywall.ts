import { randomUUID } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { HEADERS, decodeHeader, encodeHeader, type PaymentPayload, type PaymentResource, type SettleResponse } from "@allowance/shared";
import type { X402Context } from "./context";
import { sendChallenge, type PaywallOptions } from "./paymentRequired";
import { settleTransaction } from "./settle";
import { formatReason, verifyPayment } from "./verifier";

export function paywall(ctx: X402Context, options: PaywallOptions): RequestHandler {
    const handler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const resource: PaymentResource = {
            url: `${ctx.config.publicUrl}${req.originalUrl}`,
            description: options.description,
            mimeType: "application/json",
        };

        const header = req.header(HEADERS.signature);
        if (!header) {
            sendChallenge(res, ctx, options, resource);
            return;
        }

        let payload: PaymentPayload;
        try {
            payload = decodeHeader<PaymentPayload>(header);
        } catch {
            sendChallenge(res, ctx, options, resource, "invalid_payment_header");
            return;
        }

        const reference = payload.accepted?.extra?.reference;
        const pending = reference ? ctx.challenges.take(reference) : null;
        const matchesRoute =
            pending &&
            pending.resource.url === resource.url &&
            pending.requirement.amount === options.price.toString() &&
            pending.requirement.payTo === options.payTo.toBase58();
        if (!pending || !matchesRoute) {
            sendChallenge(res, ctx, options, resource, "unknown_or_expired_challenge");
            return;
        }

        const rejectWith = (reason: string) => {
            ctx.receipts.add({
                id: randomUUID(),
                status: "rejected",
                signature: null,
                merchant: options.payTo.toBase58(),
                amount: options.price.toString(),
                spentToday: null,
                resource: resource.url,
                reason: formatReason(reason),
                timestamp: Date.now(),
            });
            sendChallenge(res, ctx, options, resource, reason);
        };

        const verified = await verifyPayment(ctx.config, payload, pending);
        if (!verified.ok) {
            rejectWith(verified.reason);
            return;
        }

        const settled = await settleTransaction(ctx.config, verified.transaction);
        if (!settled.ok) {
            rejectWith(settled.reason);
            return;
        }

        ctx.receipts.add({
            id: settled.signature,
            status: "settled",
            signature: settled.signature,
            merchant: options.payTo.toBase58(),
            amount: options.price.toString(),
            spentToday: null,
            resource: resource.url,
            reason: null,
            timestamp: Date.now(),
        });

        const response: SettleResponse = {
            success: true,
            network: ctx.config.caip2,
            transaction: settled.signature,
            payer: verified.agent.toBase58(),
        };
        res.set(HEADERS.response, encodeHeader(response));
        next();
    };

    return (req, res, next) => {
        handler(req, res, next).catch(next);
    };
}
