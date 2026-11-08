import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { describeFailure, initPolicyIx, depositIx, toBaseUnits, type Failure } from "@allowance/shared";
import { keypairFromFile } from "@allowance/shared/node";

export type TestContext = {
    connection: Connection;
    payer: Keypair;
    programId: PublicKey;
};

export type Scenario = {
    ctx: TestContext;
    owner: Keypair;
    agent: Keypair;
    merchantOwner: Keypair;
    outsider: Keypair;
    mint: PublicKey;
    merchantToken: PublicKey;
    outsiderToken: PublicKey;
};

export function createContext(): TestContext {
    const connection = new Connection(process.env.ANCHOR_PROVIDER_URL ?? "http://127.0.0.1:8899", "confirmed");
    const payer = keypairFromFile(process.env.ANCHOR_WALLET ?? "~/.config/solana/id.json");
    const keypairPath = path.resolve(import.meta.dirname, "../target/deploy/allowance-keypair.json");
    const secret = JSON.parse(readFileSync(keypairPath, "utf8")) as number[];
    return { connection, payer, programId: Keypair.fromSecretKey(Uint8Array.from(secret)).publicKey };
}

export async function send(ctx: TestContext, instructions: TransactionInstruction[], signers: Keypair[]): Promise<string> {
    const transaction = new Transaction().add(...instructions);
    return sendAndConfirmTransaction(ctx.connection, transaction, signers);
}

export async function expectRejection(
    ctx: TestContext,
    instructions: TransactionInstruction[],
    signers: Keypair[],
): Promise<Failure> {
    const transaction = new Transaction().add(...instructions);
    transaction.feePayer = signers[0]?.publicKey;
    const simulation = await ctx.connection.simulateTransaction(transaction, signers);
    assert.ok(simulation.value.err, "the transaction was expected to fail");
    return describeFailure(simulation.value.err, simulation.value.logs);
}

async function fundWithSol(ctx: TestContext, recipient: PublicKey, sol: number): Promise<void> {
    await send(
        ctx,
        [SystemProgram.transfer({ fromPubkey: ctx.payer.publicKey, toPubkey: recipient, lamports: sol * LAMPORTS_PER_SOL })],
        [ctx.payer],
    );
}

export async function createScenario(): Promise<Scenario> {
    const ctx = createContext();
    const owner = Keypair.generate();
    const agent = Keypair.generate();
    const merchantOwner = Keypair.generate();
    const outsider = Keypair.generate();
    const thief = Keypair.generate();

    for (const keypair of [owner, agent, thief]) await fundWithSol(ctx, keypair.publicKey, 1);

    const mint = await createMint(ctx.connection, ctx.payer, ctx.payer.publicKey, null, 6);
    const ownerToken = await getOrCreateAssociatedTokenAccount(ctx.connection, ctx.payer, mint, owner.publicKey);
    await mintTo(ctx.connection, ctx.payer, mint, ownerToken.address, ctx.payer, toBaseUnits("100"));
    const merchantToken = await getOrCreateAssociatedTokenAccount(ctx.connection, ctx.payer, mint, merchantOwner.publicKey);
    const outsiderToken = await getOrCreateAssociatedTokenAccount(ctx.connection, ctx.payer, mint, outsider.publicKey);

    await send(
        ctx,
        [
            initPolicyIx({
                programId: ctx.programId,
                owner: owner.publicKey,
                agent: agent.publicKey,
                mint,
                perCallCap: toBaseUnits("0.5"),
                dailyCap: toBaseUnits("1"),
                merchants: [merchantOwner.publicKey],
            }),
            depositIx({
                programId: ctx.programId,
                signer: owner.publicKey,
                agent: agent.publicKey,
                mint,
                amount: toBaseUnits("5"),
            }),
        ],
        [owner],
    );

    return {
        ctx,
        owner,
        agent,
        merchantOwner,
        outsider,
        mint,
        merchantToken: merchantToken.address,
        outsiderToken: outsiderToken.address,
    };
}
