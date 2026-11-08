# How Solana powers Allowance

Allowance uses Solana for the three things an agent spending account needs and a web2 backend cannot give it.

**Enforcement that does not depend on the agent or the server.** The spending rules are an Anchor program, and the funds sit in a token account owned by that program's PDA. The agent key can ask for a payment but cannot move money by any other path. A backend limit can be bypassed by anyone who gets the key, an on-chain one cannot.

**Settlement fast and cheap enough for pay-per-request.** Each API call settles as its own transaction, confirms in about a second and costs a fraction of a cent. That is what makes paying a few cents per request practical.

**Open, verifiable receipts.** Every payment emits a `PaymentSettled` event and every refusal is a failed transaction with a named program error. Anyone can check them on a block explorer, so the owner does not have to trust the dashboard.

Other Solana pieces used: SPL token transfers with `transfer_checked`, associated token accounts for the vault and merchants, program derived addresses for the policy and its signing authority, compute budget instructions, and gasless payments where the facilitator pays the network fee.

## Program accounts

| Account | Seeds | Purpose |
| --- | --- | --- |
| Policy | `"policy"`, agent public key | Limits, spend counter, allowlist, frozen flag |
| Vault | Associated token account of the policy PDA | Holds the USDC the agent may spend |

## Instructions

`init_policy`, `set_limits`, `set_merchants`, `set_frozen`, `deposit`, `pay`, `withdraw`.
