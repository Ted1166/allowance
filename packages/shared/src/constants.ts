export type NetworkName = "devnet" | "mainnet";

export const NETWORKS: Record<NetworkName, { caip2: string; rpcUrl: string; explorerSuffix: string }> = {
    devnet: {
        caip2: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
        rpcUrl: "https://api.devnet.solana.com",
        explorerSuffix: "?cluster=devnet",
    },
    mainnet: {
        caip2: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
        rpcUrl: "https://api.mainnet-beta.solana.com",
        explorerSuffix: "",
    },
};

export const DEFAULT_MINTS: Record<NetworkName, string> = {
    devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    mainnet: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};

export const USDC_DECIMALS = 6;
export const POLICY_SEED = "policy";
export const MAX_MERCHANTS = 16;
export const SECONDS_PER_DAY = 86_400;

export const ALLOWANCE_ERRORS: Record<number, { name: string; message: string }> = {
    6000: { name: "Frozen", message: "The policy is frozen" },
    6001: { name: "OverPerCallCap", message: "Amount exceeds the per call cap" },
    6002: { name: "OverDailyCap", message: "Amount exceeds the daily cap" },
    6003: { name: "UnknownMerchant", message: "Merchant is not on the allowlist" },
    6004: { name: "ZeroAmount", message: "Amount must be greater than zero" },
    6005: { name: "TooManyMerchants", message: "Too many merchants on the allowlist" },
    6006: { name: "InvalidLimits", message: "Daily cap must be at least the per call cap" },
    6007: { name: "Overflow", message: "Arithmetic overflow" },
};

export function explorerTx(signature: string, network: NetworkName): string {
    return `https://explorer.solana.com/tx/${signature}${NETWORKS[network].explorerSuffix}`;
}

export function explorerAddress(address: string, network: NetworkName): string {
    return `https://explorer.solana.com/address/${address}${NETWORKS[network].explorerSuffix}`;
}
