import { Connection } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { loadEnv, keypairFromFile } from "@allowance/shared/node";
import { USDC_DECIMALS, toBaseUnits } from "@allowance/shared";

async function main() {
    const env = loadEnv();
    const connection = new Connection(env.rpcUrl, "confirmed");
    const owner = keypairFromFile(process.env.OWNER_KEYPAIR_PATH ?? "~/.config/solana/id.json");
    const amount = process.argv[2] ?? "1000";

    const mint = await createMint(connection, owner, owner.publicKey, null, USDC_DECIMALS);
    const account = await getOrCreateAssociatedTokenAccount(connection, owner, mint, owner.publicKey);
    await mintTo(connection, owner, mint, account.address, owner, toBaseUnits(amount));

    console.log(`USDC_MINT=${mint.toBase58()}`);
    console.error(`Minted ${amount} test tokens to ${owner.publicKey.toBase58()}`);
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
