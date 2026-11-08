import type { VersionedTransaction } from "@solana/web3.js";
import { describeFailure } from "@allowance/shared";
import type { ServerConfig } from "../config";

export type Settlement = { ok: true; signature: string } | { ok: false; reason: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function settleTransaction(config: ServerConfig, transaction: VersionedTransaction): Promise<Settlement> {
    const signature = await config.connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: true,
        maxRetries: 3,
    });

    for (let attempt = 0; attempt < 40; attempt += 1) {
        const { value } = await config.connection.getSignatureStatuses([signature]);
        const status = value[0];
        if (status?.err) {
            const failure = describeFailure(status.err);
            return { ok: false, reason: `settlement_failed:${failure.name}:${failure.message}` };
        }
        if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
            return { ok: true, signature };
        }
        await sleep(600);
    }
    return { ok: false, reason: "settlement_failed:Timeout:The transaction was not confirmed in time" };
}
