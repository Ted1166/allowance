import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createAssociatedTokenAccountIdempotent } from "@solana/spl-token";
import { keypairFromEnv, loadEnv, publicKeyFromEnv } from "@allowance/shared/node";

async function main() {
    const env = loadEnv();
    const connection = new Connection(env.rpcUrl, "confirmed");
    const facilitator = keypairFromEnv("FACILITATOR_SECRET_KEY");
    const agent = keypairFromEnv("AGENT_SECRET_KEY");
    const merchant = publicKeyFromEnv("MERCHANT_ADDRESS");
    const attacker = publicKeyFromEnv("ATTACKER_ADDRESS");

    const merchantToken = await createAssociatedTokenAccountIdempotent(connection, facilitator, env.mint, merchant);
    const attackerToken = await createAssociatedTokenAccountIdempotent(connection, facilitator, env.mint, attacker);

    const facilitatorBalance = await connection.getBalance(facilitator.publicKey);
    const agentBalance = await connection.getBalance(agent.publicKey);

    console.log(`merchant token account  ${merchantToken.toBase58()}`);
    console.log(`attacker token account  ${attackerToken.toBase58()}`);
    console.log(`facilitator SOL         ${facilitatorBalance / LAMPORTS_PER_SOL}`);
    console.log(`agent SOL               ${agentBalance / LAMPORTS_PER_SOL}`);
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
