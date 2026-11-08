import {
    ComputeBudgetProgram,
    PublicKey,
    TransactionMessage,
    VersionedTransaction,
} from "@solana/web3.js";
import {
    HEADERS,
    decodeHeader,
    describeFailure,
    encodeHeader,
    payIx,
    tokenAccountFor,
    type Failure,
    type PaymentPayload,
    type PaymentRequired,
    type PaymentRequirement,
    type SettleResponse,
} from "@allowance/shared";
import { Buffer } from "node:buffer";
import type { AgentContext } from "./context";

const COMPUTE_UNIT_LIMIT = 80_000;

function payInstruction(ctx: AgentContext, requirement: PaymentRequirement) {
    const mint = new PublicKey(requirement.asset);
    return payIx({
        programId: ctx.programId,
        agent: ctx.agent.publicKey,
        mint,
        merchantToken: tokenAccountFor(new PublicKey(requirement.payTo), mint),
        amount: BigInt(requirement.amount),
        reference: Buffer.from(requirement.extra.reference, "hex"),
    });
}

async function buildTransaction(ctx: AgentContext, requirement: PaymentRequirement, feePayer: PublicKey) {
    const { blockhash } = await ctx.connection.getLatestBlockhash("confirmed");
    const message = new TransactionMessage({
        payerKey: feePayer,
        recentBlockhash: blockhash,
        instructions: [
            ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
            payInstruction(ctx, requirement),
        ],
    }).compileToV0Message();
    const transaction = new VersionedTransaction(message);
    transaction.sign([ctx.agent]);
    return transaction;
}

export async function buildPaymentTransaction(ctx: AgentContext, requirement: PaymentRequirement): Promise<string> {
    const transaction = await buildTransaction(ctx, requirement, new PublicKey(requirement.extra.feePayer));
    return Buffer.from(transaction.serialize()).toString("base64");
}

export type PayingFetchResult = {
    status: number;
    body: string;
    paid: boolean;
    amount: string | null;
    payTo: string | null;
    signature: string | null;
    error: string | null;
};

function readChallenge(response: Response, body: string): PaymentRequired | null {
    const header = response.headers.get(HEADERS.required);
    try {
        return header ? decodeHeader<PaymentRequired>(header) : (JSON.parse(body) as PaymentRequired);
    } catch {
        return null;
    }
}

export async function fetchRequirement(ctx: AgentContext, url: string): Promise<PaymentRequirement> {
    const response = await fetch(url);
    const challenge = readChallenge(response, await response.text());
    const requirement = challenge?.accepts.find((entry) => entry.scheme === "exact" && entry.network === ctx.caip2);
    if (response.status !== 402 || !requirement) {
        throw new Error(`${url} did not return a payable x402 challenge`);
    }
    return requirement;
}

export async function payingFetch(ctx: AgentContext, url: string, init?: RequestInit): Promise<PayingFetchResult> {
    const first = await fetch(url, init);
    const firstBody = await first.text();
    if (first.status !== 402) {
        return { status: first.status, body: firstBody, paid: false, amount: null, payTo: null, signature: null, error: null };
    }

    const challenge = readChallenge(first, firstBody);
    const requirement = challenge?.accepts.find((entry) => entry.scheme === "exact" && entry.network === ctx.caip2);
    if (!requirement) {
        return { status: 402, body: firstBody, paid: false, amount: null, payTo: null, signature: null, error: "no_compatible_payment_option" };
    }

    const payload: PaymentPayload = {
        x402Version: 2,
        accepted: requirement,
        payload: { transaction: await buildPaymentTransaction(ctx, requirement) },
    };
    const second = await fetch(url, {
        ...init,
        headers: { ...(init?.headers as Record<string, string> | undefined), [HEADERS.signature]: encodeHeader(payload) },
    });
    const secondBody = await second.text();
    const settlementHeader = second.headers.get(HEADERS.response);
    const settlement = settlementHeader ? decodeHeader<SettleResponse>(settlementHeader) : null;
    const rejection = second.status === 402 ? readChallenge(second, secondBody)?.error ?? "payment_rejected" : null;

    return {
        status: second.status,
        body: secondBody,
        paid: second.ok && settlement?.success === true,
        amount: requirement.amount,
        payTo: requirement.payTo,
        signature: settlement?.transaction ?? null,
        error: rejection,
    };
}

export type DirectResult = {
    signature: string;
    failure: Failure | null;
    logs: string[];
};

async function waitForStatus(ctx: AgentContext, signature: string): Promise<unknown> {
    for (let attempt = 0; attempt < 40; attempt += 1) {
        const { value } = await ctx.connection.getSignatureStatuses([signature]);
        const status = value[0];
        if (status?.err) return status.err;
        if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") return null;
        await new Promise((resolve) => setTimeout(resolve, 750));
    }
    return "confirmation_timeout";
}

export async function submitDirect(ctx: AgentContext, requirement: PaymentRequirement): Promise<DirectResult> {
    const transaction = await buildTransaction(ctx, requirement, ctx.agent.publicKey);
    const signature = await ctx.connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true });
    const err = await waitForStatus(ctx, signature);
    const details = await ctx.connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
    });
    const logs = details?.meta?.logMessages ?? [];
    return { signature, failure: err ? describeFailure(err, logs) : null, logs };
}
