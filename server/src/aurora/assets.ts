import type { AuroraToken } from "./client";

export function findSolanaUsdc(tokens: AuroraToken[]): AuroraToken | undefined {
    return tokens.find((token) => token.blockchain === "sol" && token.symbol === "USDC");
}

export function findToken(tokens: AuroraToken[], assetId: string): AuroraToken | undefined {
    return tokens.find((token) => token.assetId === assetId);
}
