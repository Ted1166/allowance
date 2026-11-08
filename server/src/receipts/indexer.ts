import { describeFailure, decodePaymentEvents, type ReceiptView } from "@allowance/shared";
import type { ServerConfig } from "../config";
import type { ReceiptStore } from "./store";

function fromEvent(signature: string, event: ReturnType<typeof decodePaymentEvents>[number]): ReceiptView {
    return {
        id: signature,
        status: "settled",
        signature,
        merchant: event.merchant.toBase58(),
        amount: event.amount.toString(),
        spentToday: event.spentToday.toString(),
        resource: null,
        reason: null,
        timestamp: event.timestamp * 1000,
    };
}

export async function backfillReceipts(config: ServerConfig, store: ReceiptStore): Promise<void> {
    const signatures = await config.connection.getSignaturesForAddress(config.programId, { limit: 50 }, "confirmed");
    const settled = signatures.filter((entry) => !entry.err).map((entry) => entry.signature);
    if (settled.length === 0) return;
    const transactions = await config.connection.getTransactions(settled, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
    });
    transactions.forEach((transaction, index) => {
        const signature = settled[index];
        if (!transaction || !signature) return;
        for (const event of decodePaymentEvents(transaction.meta?.logMessages ?? [])) {
            store.add(fromEvent(signature, event));
        }
    });
}

export function watchReceipts(config: ServerConfig, store: ReceiptStore): number {
    return config.connection.onLogs(
        config.programId,
        (entry) => {
            if (entry.err) {
                if (store.has(entry.signature)) return;
                const failure = describeFailure(entry.err, entry.logs);
                store.add({
                    id: entry.signature,
                    status: "rejected",
                    signature: entry.signature,
                    merchant: null,
                    amount: null,
                    spentToday: null,
                    resource: null,
                    reason: `${failure.name}: ${failure.message}`,
                    timestamp: Date.now(),
                });
                return;
            }
            for (const event of decodePaymentEvents(entry.logs)) {
                store.add(fromEvent(entry.signature, event));
            }
        },
        "confirmed",
    );
}
