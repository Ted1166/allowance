# Allowance

A spending account for AI agents, on Solana.

The owner funds an allowance, sets what the agent may spend, and the agent buys from x402-priced APIs. The limits live in an Anchor program that holds the money, so they hold even when the model misbehaves.

- **Funding:** the owner tops up from any chain. An Aurora Intents deposit address turns what they hold into USDC on Solana.
- **Limits:** a per call cap, a daily cap, an allowlist of merchants and a freeze switch, all enforced on chain. The agent can only pay through the program.
- **Spending:** the agent pays x402 challenges. Each call settles on Solana.
- **Screens:** fund, set limits, live receipts, kill switch.
- **Proof:** an attack demo shows an overspend, an unknown merchant and a prompt-injected agent being refused by the program.

## Status

Checked in the build environment: the Anchor program compiles with `cargo check`, every TypeScript package passes the type checker, the frontend produces a production build, and the x402 verifier was exercised against a stubbed RPC (valid payment accepted; over-cap, unknown merchant, tampered amount and wrong network refused).

Not checked here, so run these yourself before recording: `anchor build` and deploy, `anchor test` (the on-chain tests in `tests/`), a full payment against devnet, and the Aurora calls against the live API. docs/AURORA.md lists what to confirm.

## Prerequisites

- Node 20 or newer and pnpm 9
- Rust, the Solana CLI and Anchor 0.31 (install with avm)
- A Solana keypair at `~/.config/solana/id.json` with some devnet SOL. This is the owner wallet.

## Setup

```bash
pnpm install
cp .env.example .env
cp app/.env.example app/.env.local
```

Generate the agent, fee payer, merchant and attacker keys and append them to `.env`:

```bash
pnpm keys >> .env
```

Fund the agent and the fee payer with devnet SOL (the command prints both addresses on the line above the keys):

```bash
scripts/airdrop.sh <agent address> <fee payer address>
```

Build and deploy the program, then put the printed program id in `.env` as `ALLOWANCE_PROGRAM_ID`:

```bash
scripts/deploy.sh devnet
```

Pick the token. Circle's devnet USDC works if you can get some from Circle's faucet, which is the default in `.env.example`. For a quick local test, create your own test token instead and set `USDC_MINT` to the value it prints:

```bash
pnpm test-mint
```

Create the token accounts for the demo merchant and the attacker, then create the allowance and put a couple of USDC in the vault:

```bash
pnpm setup:accounts
pnpm init:demo --per-call 0.5 --daily 5 --deposit 2
```

You can also create the allowance from the Limits page instead of the script.

## Run it

```bash
pnpm dev:server
pnpm dev:app
```

Open http://localhost:3000, connect the owner wallet, and walk through Dashboard, Fund, Limits, Receipts and Attack demo.

Run the attacks from the terminal too:

```bash
pnpm attacks
pnpm agent "Get the weather from http://localhost:4021/paid/weather"
```

The live agent and the live prompt injection run need `ANTHROPIC_API_KEY`. Without it, the injection attack uses a scripted agent that obeys the hidden instruction.

## Tests

```bash
anchor test
```

This starts a local validator, deploys the program and runs `tests/policy.test.ts` and `tests/attack.test.ts`.

## Layout

```
programs/allowance   Anchor program
packages/shared      instruction builders, decoders, x402 types
server               paywalled demo APIs, x402 verifier and settlement, Aurora proxy, receipts
agent                the paying agent and the attack scripts
app                  Next.js console for the owner
scripts              keys, token, account and demo setup, deploy
tests                on-chain tests
docs                 architecture, security, Solana, Aurora, submission
```

## Mainnet

Aurora has no testnet, so a real cross-chain deposit lands as mainnet USDC. To demo the whole flow with one consistent token, set `SOLANA_NETWORK=mainnet`, `RPC_URL`, the mainnet `USDC_MINT` and a program deployed to mainnet, and use a few dollars. Keep devnet for development and the attack tests.

## Notes on x402

The payment is a transaction with one `pay` instruction of this program, not a plain token transfer, because the program has to be the thing that moves the funds. The wire format follows x402 version 2 headers, and this repository's server verifies and settles the payment itself. A third-party facilitator that only accepts plain transfers would reject it. See docs/ARCHITECTURE.md.
