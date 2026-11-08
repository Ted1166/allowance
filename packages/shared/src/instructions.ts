import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { sha256 } from "@noble/hashes/sha256";
import { Buffer } from "buffer";
import { policyAddress, tokenAccountFor, vaultAddress } from "./pda";

export function instructionDiscriminator(name: string): Buffer {
    return Buffer.from(sha256(`global:${name}`)).subarray(0, 8);
}

export const PAY_DISCRIMINATOR = instructionDiscriminator("pay");
export const PAY_DATA_LENGTH = 8 + 8 + 32;

function u64(value: bigint): Buffer {
    const out = Buffer.alloc(8);
    out.writeBigUInt64LE(value);
    return out;
}

function u32(value: number): Buffer {
    const out = Buffer.alloc(4);
    out.writeUInt32LE(value);
    return out;
}

function pubkeyVec(keys: PublicKey[]): Buffer {
    return Buffer.concat([u32(keys.length), ...keys.map((key) => key.toBuffer())]);
}

type Meta = { pubkey: PublicKey; isSigner: boolean; isWritable: boolean };

const meta = (pubkey: PublicKey, isSigner: boolean, isWritable: boolean): Meta => ({ pubkey, isSigner, isWritable });

export type InitPolicyParams = {
    programId: PublicKey;
    owner: PublicKey;
    agent: PublicKey;
    mint: PublicKey;
    perCallCap: bigint;
    dailyCap: bigint;
    merchants: PublicKey[];
    tokenProgram?: PublicKey;
};

export function initPolicyIx(params: InitPolicyParams): TransactionInstruction {
    const tokenProgram = params.tokenProgram ?? TOKEN_PROGRAM_ID;
    const [policy] = policyAddress(params.agent, params.programId);
    const vault = vaultAddress(policy, params.mint, tokenProgram);
    const data = Buffer.concat([
        instructionDiscriminator("init_policy"),
        params.agent.toBuffer(),
        u64(params.perCallCap),
        u64(params.dailyCap),
        pubkeyVec(params.merchants),
    ]);
    return new TransactionInstruction({
        programId: params.programId,
        keys: [
            meta(params.owner, true, true),
            meta(params.mint, false, false),
            meta(policy, false, true),
            meta(vault, false, true),
            meta(tokenProgram, false, false),
            meta(ASSOCIATED_TOKEN_PROGRAM_ID, false, false),
            meta(SystemProgram.programId, false, false),
        ],
        data,
    });
}

export type OwnerParams = { programId: PublicKey; owner: PublicKey; agent: PublicKey };

export function setLimitsIx(params: OwnerParams & { perCallCap: bigint; dailyCap: bigint }): TransactionInstruction {
    const [policy] = policyAddress(params.agent, params.programId);
    return new TransactionInstruction({
        programId: params.programId,
        keys: [meta(params.owner, true, false), meta(policy, false, true)],
        data: Buffer.concat([instructionDiscriminator("set_limits"), u64(params.perCallCap), u64(params.dailyCap)]),
    });
}

export function setMerchantsIx(params: OwnerParams & { merchants: PublicKey[] }): TransactionInstruction {
    const [policy] = policyAddress(params.agent, params.programId);
    return new TransactionInstruction({
        programId: params.programId,
        keys: [meta(params.owner, true, false), meta(policy, false, true)],
        data: Buffer.concat([instructionDiscriminator("set_merchants"), pubkeyVec(params.merchants)]),
    });
}

export function setFrozenIx(params: OwnerParams & { frozen: boolean }): TransactionInstruction {
    const [policy] = policyAddress(params.agent, params.programId);
    return new TransactionInstruction({
        programId: params.programId,
        keys: [meta(params.owner, true, false), meta(policy, false, true)],
        data: Buffer.concat([instructionDiscriminator("set_frozen"), Buffer.from([params.frozen ? 1 : 0])]),
    });
}

export type MoveFundsParams = {
    programId: PublicKey;
    signer: PublicKey;
    agent: PublicKey;
    mint: PublicKey;
    amount: bigint;
    tokenProgram?: PublicKey;
};

export function depositIx(params: MoveFundsParams): TransactionInstruction {
    const tokenProgram = params.tokenProgram ?? TOKEN_PROGRAM_ID;
    const [policy] = policyAddress(params.agent, params.programId);
    return new TransactionInstruction({
        programId: params.programId,
        keys: [
            meta(params.signer, true, false),
            meta(policy, false, false),
            meta(params.mint, false, false),
            meta(tokenAccountFor(params.signer, params.mint, tokenProgram), false, true),
            meta(vaultAddress(policy, params.mint, tokenProgram), false, true),
            meta(tokenProgram, false, false),
        ],
        data: Buffer.concat([instructionDiscriminator("deposit"), u64(params.amount)]),
    });
}

export function withdrawIx(params: MoveFundsParams): TransactionInstruction {
    const tokenProgram = params.tokenProgram ?? TOKEN_PROGRAM_ID;
    const [policy] = policyAddress(params.agent, params.programId);
    return new TransactionInstruction({
        programId: params.programId,
        keys: [
            meta(params.signer, true, false),
            meta(policy, false, false),
            meta(params.mint, false, false),
            meta(tokenAccountFor(params.signer, params.mint, tokenProgram), false, true),
            meta(vaultAddress(policy, params.mint, tokenProgram), false, true),
            meta(tokenProgram, false, false),
        ],
        data: Buffer.concat([instructionDiscriminator("withdraw"), u64(params.amount)]),
    });
}

export type PayParams = {
    programId: PublicKey;
    agent: PublicKey;
    mint: PublicKey;
    merchantToken: PublicKey;
    amount: bigint;
    reference: Buffer;
    tokenProgram?: PublicKey;
};

export function payIx(params: PayParams): TransactionInstruction {
    if (params.reference.length !== 32) throw new Error("Reference must be 32 bytes");
    const tokenProgram = params.tokenProgram ?? TOKEN_PROGRAM_ID;
    const [policy] = policyAddress(params.agent, params.programId);
    return new TransactionInstruction({
        programId: params.programId,
        keys: [
            meta(params.agent, true, false),
            meta(policy, false, true),
            meta(params.mint, false, false),
            meta(vaultAddress(policy, params.mint, tokenProgram), false, true),
            meta(params.merchantToken, false, true),
            meta(tokenProgram, false, false),
        ],
        data: Buffer.concat([PAY_DISCRIMINATOR, u64(params.amount), params.reference]),
    });
}

export function decodePayData(data: Uint8Array): { amount: bigint; reference: Buffer } | null {
    const buffer = Buffer.from(data);
    if (buffer.length !== PAY_DATA_LENGTH) return null;
    if (!buffer.subarray(0, 8).equals(PAY_DISCRIMINATOR)) return null;
    return { amount: buffer.readBigUInt64LE(8), reference: Buffer.from(buffer.subarray(16, 48)) };
}
