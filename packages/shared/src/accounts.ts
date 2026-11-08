import { Connection, PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import { SECONDS_PER_DAY } from "./constants";
import { policyAddress } from "./pda";

export type PolicyState = {
    owner: PublicKey;
    agent: PublicKey;
    mint: PublicKey;
    perCallCap: bigint;
    dailyCap: bigint;
    spentToday: bigint;
    windowStart: bigint;
    frozen: boolean;
    merchants: PublicKey[];
    bump: number;
};

export function decodePolicy(data: Uint8Array): PolicyState {
    const buffer = Buffer.from(data);
    let offset = 8;
    const readKey = () => {
        const key = new PublicKey(buffer.subarray(offset, offset + 32));
        offset += 32;
        return key;
    };
    const owner = readKey();
    const agent = readKey();
    const mint = readKey();
    const perCallCap = buffer.readBigUInt64LE(offset);
    const dailyCap = buffer.readBigUInt64LE(offset + 8);
    const spentToday = buffer.readBigUInt64LE(offset + 16);
    const windowStart = buffer.readBigInt64LE(offset + 24);
    offset += 32;
    const frozen = buffer.readUInt8(offset) === 1;
    offset += 1;
    const count = buffer.readUInt32LE(offset);
    offset += 4;
    const merchants: PublicKey[] = [];
    for (let i = 0; i < count; i += 1) merchants.push(readKey());
    const bump = buffer.readUInt8(offset);
    return { owner, agent, mint, perCallCap, dailyCap, spentToday, windowStart, frozen, merchants, bump };
}

export async function fetchPolicy(
    connection: Connection,
    agent: PublicKey,
    programId: PublicKey,
): Promise<{ address: PublicKey; state: PolicyState } | null> {
    const [address] = policyAddress(agent, programId);
    const info = await connection.getAccountInfo(address, "confirmed");
    if (!info || !info.owner.equals(programId)) return null;
    return { address, state: decodePolicy(info.data) };
}

export function spentInWindow(state: PolicyState, nowSeconds: number): bigint {
    const elapsed = BigInt(nowSeconds) - state.windowStart;
    return elapsed >= BigInt(SECONDS_PER_DAY) ? 0n : state.spentToday;
}

export function remainingToday(state: PolicyState, nowSeconds: number): bigint {
    const spent = spentInWindow(state, nowSeconds);
    return state.dailyCap > spent ? state.dailyCap - spent : 0n;
}
