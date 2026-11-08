import { config as loadDotenv } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { DEFAULT_MINTS, NETWORKS, type NetworkName } from "./constants";

export type CoreEnv = {
    root: string;
    network: NetworkName;
    rpcUrl: string;
    programId: PublicKey;
    mint: PublicKey;
};

export function findRoot(start: string = process.cwd()): string {
    let current = path.resolve(start);
    while (true) {
        if (existsSync(path.join(current, "pnpm-workspace.yaml"))) return current;
        const parent = path.dirname(current);
        if (parent === current) return path.resolve(start);
        current = parent;
    }
}

export function loadEnv(): CoreEnv {
    const root = findRoot();
    loadDotenv({ path: path.join(root, ".env") });
    const network = (process.env.SOLANA_NETWORK ?? "devnet") as NetworkName;
    if (!(network in NETWORKS)) throw new Error(`Unknown SOLANA_NETWORK: ${network}`);
    const programId = process.env.ALLOWANCE_PROGRAM_ID;
    if (!programId) throw new Error("ALLOWANCE_PROGRAM_ID is not set");
    return {
        root,
        network,
        rpcUrl: process.env.RPC_URL ?? NETWORKS[network].rpcUrl,
        programId: new PublicKey(programId),
        mint: new PublicKey(process.env.USDC_MINT ?? DEFAULT_MINTS[network]),
    };
}

export function readEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is not set`);
    return value;
}

export function publicKeyFromEnv(name: string): PublicKey {
    return new PublicKey(readEnv(name));
}

export function parseSecretKey(value: string): Keypair {
    const trimmed = value.trim();
    if (trimmed.startsWith("[")) {
        return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(trimmed) as number[]));
    }
    return Keypair.fromSecretKey(bs58.decode(trimmed));
}

export function keypairFromEnv(name: string): Keypair {
    return parseSecretKey(readEnv(name));
}

export function keypairFromFile(filePath: string): Keypair {
    const resolved = filePath.startsWith("~") ? path.join(os.homedir(), filePath.slice(1)) : filePath;
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(resolved, "utf8")) as number[]));
}

export function encodeSecretKey(keypair: Keypair): string {
    return bs58.encode(keypair.secretKey);
}
