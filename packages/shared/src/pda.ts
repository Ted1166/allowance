import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Buffer } from "buffer";
import { POLICY_SEED } from "./constants";

export function policyAddress(agent: PublicKey, programId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from(POLICY_SEED), agent.toBuffer()], programId);
}

export function vaultAddress(policy: PublicKey, mint: PublicKey, tokenProgram: PublicKey = TOKEN_PROGRAM_ID): PublicKey {
    return getAssociatedTokenAddressSync(mint, policy, true, tokenProgram);
}

export function tokenAccountFor(owner: PublicKey, mint: PublicKey, tokenProgram: PublicKey = TOKEN_PROGRAM_ID): PublicKey {
    return getAssociatedTokenAddressSync(mint, owner, true, tokenProgram);
}
