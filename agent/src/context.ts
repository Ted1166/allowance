import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { NETWORKS, type NetworkName } from "@allowance/shared";
import { keypairFromEnv, loadEnv, publicKeyFromEnv } from "@allowance/shared/node";

export type AgentContext = {
    connection: Connection;
    network: NetworkName;
    caip2: string;
    programId: PublicKey;
    mint: PublicKey;
    agent: Keypair;
    merchant: PublicKey;
    attacker: PublicKey;
    serverUrl: string;
};

export function createAgentContext(): AgentContext {
    const env = loadEnv();
    const port = process.env.SERVER_PORT ?? "4021";
    return {
        connection: new Connection(env.rpcUrl, "confirmed"),
        network: env.network,
        caip2: NETWORKS[env.network].caip2,
        programId: env.programId,
        mint: env.mint,
        agent: keypairFromEnv("AGENT_SECRET_KEY"),
        merchant: publicKeyFromEnv("MERCHANT_ADDRESS"),
        attacker: publicKeyFromEnv("ATTACKER_ADDRESS"),
        serverUrl: process.env.PUBLIC_SERVER_URL ?? `http://localhost:${port}`,
    };
}
