import { Buffer } from "buffer";

export const HEADERS = {
    required: "PAYMENT-REQUIRED",
    signature: "PAYMENT-SIGNATURE",
    response: "PAYMENT-RESPONSE",
} as const;

export type PaymentRequirement = {
    scheme: "exact";
    network: string;
    asset: string;
    amount: string;
    payTo: string;
    maxTimeoutSeconds: number;
    extra: {
        feePayer: string;
        programId: string;
        reference: string;
    };
};

export type PaymentResource = {
    url: string;
    description: string;
    mimeType: string;
};

export type PaymentRequired = {
    x402Version: 2;
    error?: string;
    resource: PaymentResource;
    accepts: PaymentRequirement[];
};

export type PaymentPayload = {
    x402Version: 2;
    accepted: PaymentRequirement;
    payload: { transaction: string };
};

export type SettleResponse = {
    success: boolean;
    network: string;
    transaction?: string;
    payer?: string;
    errorReason?: string;
};

export function encodeHeader(value: unknown): string {
    return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

export function decodeHeader<T>(value: string): T {
    return JSON.parse(Buffer.from(value, "base64").toString("utf8")) as T;
}
