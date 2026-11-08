import { PublicKey } from "@solana/web3.js";
import { sha256 } from "@noble/hashes/sha256";
import { Buffer } from "buffer";

export type PaymentSettledEvent = {
    policy: PublicKey;
    agent: PublicKey;
    merchant: PublicKey;
    amount: bigint;
    spentToday: bigint;
    reference: Buffer;
    timestamp: number;
};

const PAYMENT_SETTLED = Buffer.from(sha256("event:PaymentSettled")).subarray(0, 8);
const LOG_PREFIX = "Program data: ";
const EVENT_LENGTH = 8 + 32 * 3 + 8 + 8 + 32 + 8;

export function decodePaymentEvents(logs: string[]): PaymentSettledEvent[] {
    const events: PaymentSettledEvent[] = [];
    for (const line of logs) {
        if (!line.startsWith(LOG_PREFIX)) continue;
        const data = Buffer.from(line.slice(LOG_PREFIX.length), "base64");
        if (data.length !== EVENT_LENGTH || !data.subarray(0, 8).equals(PAYMENT_SETTLED)) continue;
        events.push({
            policy: new PublicKey(data.subarray(8, 40)),
            agent: new PublicKey(data.subarray(40, 72)),
            merchant: new PublicKey(data.subarray(72, 104)),
            amount: data.readBigUInt64LE(104),
            spentToday: data.readBigUInt64LE(112),
            reference: Buffer.from(data.subarray(120, 152)),
            timestamp: Number(data.readBigInt64LE(152)),
        });
    }
    return events;
}
