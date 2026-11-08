import { ComputeBudgetProgram, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    ALLOWANCE_ERRORS,
    decodePayData,
    describeFailure,
    policyAddress,
    tokenAccountFor,
    vaultAddress,
    type PaymentPayload,
    type PaymentRequirement,
} from "@allowance/shared";
import { Buffer } from "node:buffer";
import type { ServerConfig } from "../config";
import type { PendingChallenge } from "./replayGuard";

const MAX_COMPUTE_UNITS = 200_000;
const MAX_UNIT_PRICE_MICRO_LAMPORTS = 1_000_000n;
const SET_COMPUTE_UNIT_LIMIT = 2;
const SET_COMPUTE_UNIT_PRICE = 3;

export type Verification =
    | { ok: true; transaction: VersionedTransaction; agent: PublicKey }
    | { ok: false; reason: string };

const reject = (reason: string): Verification => ({ ok: false, reason });

function sameRequirement(a: PaymentRequirement, b: PaymentRequirement): boolean {
    return (
        a.scheme === b.scheme &&
        a.network === b.network &&
        a.asset === b.asset &&
        a.amount === b.amount &&
        a.payTo === b.payTo &&
        a.extra?.feePayer === b.extra.feePayer &&
        a.extra?.programId === b.extra.programId &&
        a.extra?.reference === b.extra.reference
    );
}

function computeBudgetAllowed(data: Uint8Array): boolean {
    const buffer = Buffer.from(data);
    if (buffer[0] === SET_COMPUTE_UNIT_LIMIT) return buffer.length === 5 && buffer.readUInt32LE(1) <= MAX_COMPUTE_UNITS;
    if (buffer[0] === SET_COMPUTE_UNIT_PRICE) {
        return buffer.length === 9 && buffer.readBigUInt64LE(1) <= MAX_UNIT_PRICE_MICRO_LAMPORTS;
    }
    return false;
}

export function formatReason(reason: string): string {
    const [kind, name, message] = reason.split(":");
    if ((kind === "policy_rejected" || kind === "simulation_failed") && name) {
        return message ? `${name}: ${message}` : name;
    }
    return reason.replace(/_/g, " ");
}

export async function verifyPayment(
    config: ServerConfig,
    payload: PaymentPayload,
    pending: PendingChallenge,
): Promise<Verification> {
    const { requirement } = pending;
    if (payload.x402Version !== 2) return reject("unsupported_version");
    if (!payload.accepted || !sameRequirement(payload.accepted, requirement)) return reject("requirement_mismatch");

    let transaction: VersionedTransaction;
    try {
        transaction = VersionedTransaction.deserialize(Buffer.from(payload.payload.transaction, "base64"));
    } catch {
        return reject("invalid_transaction");
    }

    const message = transaction.message;
    if (message.addressTableLookups.length > 0) return reject("lookup_tables_not_allowed");
    const keys = message.staticAccountKeys;
    if (!keys[0]?.equals(config.feePayer.publicKey)) return reject("wrong_fee_payer");

    const instructions = message.compiledInstructions;
    if (instructions.length === 0 || instructions.length > 3) return reject("unexpected_instruction_count");

    let payment: { accountIndexes: number[]; data: Uint8Array } | null = null;
    for (const instruction of instructions) {
        const program = keys[instruction.programIdIndex];
        if (!program) return reject("invalid_transaction");
        if (instruction.accountKeyIndexes.includes(0)) return reject("fee_payer_used_in_instruction");

        if (program.equals(ComputeBudgetProgram.programId)) {
            if (!computeBudgetAllowed(instruction.data)) return reject("compute_budget_not_allowed");
            continue;
        }
        if (program.equals(config.programId)) {
            if (payment) return reject("multiple_payment_instructions");
            payment = { accountIndexes: instruction.accountKeyIndexes, data: instruction.data };
            continue;
        }
        return reject("unexpected_program");
    }
    if (!payment) return reject("missing_payment_instruction");

    const decoded = decodePayData(payment.data);
    if (!decoded) return reject("invalid_payment_instruction");
    if (decoded.amount !== BigInt(requirement.amount)) return reject("amount_mismatch");
    if (decoded.reference.toString("hex") !== requirement.extra.reference) return reject("reference_mismatch");

    const accounts = payment.accountIndexes.map((index) => keys[index]);
    const [agent, policy, mint, vault, merchantToken, tokenProgram] = accounts;
    if (accounts.length !== 6 || !agent || !policy || !mint || !vault || !merchantToken || !tokenProgram) {
        return reject("invalid_payment_accounts");
    }
    if (!message.isAccountSigner(payment.accountIndexes[0] as number)) return reject("agent_did_not_sign");

    const asset = new PublicKey(requirement.asset);
    const [expectedPolicy] = policyAddress(agent, config.programId);
    if (!mint.equals(asset)) return reject("wrong_mint");
    if (!policy.equals(expectedPolicy)) return reject("wrong_policy");
    if (!vault.equals(vaultAddress(policy, asset))) return reject("wrong_vault");
    if (!merchantToken.equals(tokenAccountFor(new PublicKey(requirement.payTo), asset))) return reject("wrong_recipient");
    if (!tokenProgram.equals(TOKEN_PROGRAM_ID)) return reject("wrong_token_program");

    transaction.sign([config.feePayer]);

    const simulation = await config.connection.simulateTransaction(transaction, {
        sigVerify: true,
        commitment: "confirmed",
    });
    if (simulation.value.err) {
        const failure = describeFailure(simulation.value.err, simulation.value.logs);
        const kind = failure.code !== null && ALLOWANCE_ERRORS[failure.code] ? "policy_rejected" : "simulation_failed";
        return reject(`${kind}:${failure.name}:${failure.message}`);
    }

    return { ok: true, transaction, agent };
}
