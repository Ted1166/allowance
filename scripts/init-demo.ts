import { Connection, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { depositIx, explorerTx, initPolicyIx, toBaseUnits } from "@allowance/shared";
import { keypairFromEnv, keypairFromFile, loadEnv, publicKeyFromEnv } from "@allowance/shared/node";

function option(name: string, fallback: string): string {
    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 && process.argv[index + 1] ? (process.argv[index + 1] as string) : fallback;
}

async function main() {
    const env = loadEnv();
    const connection = new Connection(env.rpcUrl, "confirmed");
    const owner = keypairFromFile(process.env.OWNER_KEYPAIR_PATH ?? "~/.config/solana/id.json");
    const agent = keypairFromEnv("AGENT_SECRET_KEY").publicKey;
    const merchant = publicKeyFromEnv("MERCHANT_ADDRESS");

    const perCallCap = toBaseUnits(option("per-call", "0.5"));
    const dailyCap = toBaseUnits(option("daily", "5"));
    const deposit = toBaseUnits(option("deposit", "0"));

    const transaction = new Transaction().add(
        initPolicyIx({
            programId: env.programId,
            owner: owner.publicKey,
            agent,
            mint: env.mint,
            perCallCap,
            dailyCap,
            merchants: [merchant],
        }),
    );
    if (deposit > 0n) {
        transaction.add(depositIx({ programId: env.programId, signer: owner.publicKey, agent, mint: env.mint, amount: deposit }));
    }

    const signature = await sendAndConfirmTransaction(connection, transaction, [owner]);
    console.log(`Allowance created: ${explorerTx(signature, env.network)}`);
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
