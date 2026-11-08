import { randomBytes } from "node:crypto";
import type { PublicKey } from "@solana/web3.js";
import { HEADERS, encodeHeader, type PaymentRequired, type PaymentRequirement, type PaymentResource } from "@allowance/shared";
import type { Response } from "express";
import type { X402Context } from "./context";

export type PaywallOptions = {
    price: bigint;
    payTo: PublicKey;
    description: string;
};

export function createRequirement(ctx: X402Context, options: PaywallOptions): PaymentRequirement {
    const { config } = ctx;
    return {
        scheme: "exact",
        network: config.caip2,
        asset: config.mint.toBase58(),
        amount: options.price.toString(),
        payTo: options.payTo.toBase58(),
        maxTimeoutSeconds: 60,
        extra: {
            feePayer: config.feePayer.publicKey.toBase58(),
            programId: config.programId.toBase58(),
            reference: randomBytes(32).toString("hex"),
        },
    };
}

export function sendChallenge(
    res: Response,
    ctx: X402Context,
    options: PaywallOptions,
    resource: PaymentResource,
    error?: string,
): void {
    const requirement = createRequirement(ctx, options);
    ctx.challenges.issue(requirement, resource);
    const body: PaymentRequired = { x402Version: 2, error, resource, accepts: [requirement] };
    res.status(402).set(HEADERS.required, encodeHeader(body)).json(body);
}
