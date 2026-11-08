import { Keypair } from "@solana/web3.js";
import { encodeSecretKey } from "@allowance/shared/node";

const agent = Keypair.generate();
const facilitator = Keypair.generate();
const merchant = Keypair.generate();
const attacker = Keypair.generate();

console.log(`AGENT_SECRET_KEY=${encodeSecretKey(agent)}`);
console.log(`FACILITATOR_SECRET_KEY=${encodeSecretKey(facilitator)}`);
console.log(`MERCHANT_ADDRESS=${merchant.publicKey.toBase58()}`);
console.log(`ATTACKER_ADDRESS=${attacker.publicKey.toBase58()}`);
console.error("");
console.error("Fund these two with devnet SOL before running the demo:");
console.error(`  agent        ${agent.publicKey.toBase58()}`);
console.error(`  facilitator  ${facilitator.publicKey.toBase58()}`);
