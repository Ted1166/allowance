import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { NETWORKS, type NetworkName } from "@allowance/shared";
import { keypairFromEnv, loadEnv, publicKeyFromEnv } from "@allowance/shared/node";

export type ServerConfig = {
    network: NetworkName;
    caip2: string;
    rpcUrl: string;
    programId: PublicKey;
    mint: PublicKey;
    feePayer: Keypair;
    merchant: PublicKey;
    attacker: PublicKey;
    agent: PublicKey;
    port: number;
    publicUrl: string;
    auroraUrl: string;
    auroraKey: string | null;
    connection: Connection;
};

export function loadConfig(): ServerConfig {
    const env = loadEnv();
    const port = Number(process.env.SERVER_PORT ?? 4021);
    return {
        network: env.network,
        caip2: NETWORKS[env.network].caip2,
        rpcUrl: env.rpcUrl,
        programId: env.programId,
        mint: env.mint,
        feePayer: keypairFromEnv("FACILITATOR_SECRET_KEY"),
        merchant: publicKeyFromEnv("MERCHANT_ADDRESS"),
        attacker: publicKeyFromEnv("ATTACKER_ADDRESS"),
        agent: keypairFromEnv("AGENT_SECRET_KEY").publicKey,
        port,
        publicUrl: process.env.PUBLIC_SERVER_URL ?? `http://localhost:${port}`,
        auroraUrl: process.env.AURORA_API_URL ?? "https://intents-api.aurora.dev",
        auroraKey: process.env.AURORA_API_KEY || null,
        connection: new Connection(env.rpcUrl, "confirmed"),
    };
}
