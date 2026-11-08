# Security notes

## What the program enforces

For every `pay` call the program requires all of the following, in this order: the policy is not frozen, the amount is above zero and no larger than the per call cap, the destination token account belongs to a merchant on the allowlist, and the amount added to what was already spent in the current 24 hour window stays within the daily cap. The transfer is made by the program, signed by the policy PDA.

Owner-only instructions (`set_limits`, `set_merchants`, `set_frozen`, `withdraw`) use `has_one = owner`. The agent key cannot raise its own limits, edit the allowlist or unfreeze itself.

## Threat model

| Threat | Result |
| --- | --- |
| The model is tricked into paying more than intended | Refused with OverPerCallCap or OverDailyCap |
| The model is tricked into paying an attacker | Refused with UnknownMerchant |
| The agent key is stolen | The thief is bound by the same limits and the owner can freeze at once |
| Someone else signs against the agent's policy | Refused by the PDA seed check |
| A payment is replayed | Each challenge carries a one time reference that the server consumes, and the blockhash expires |
| A cheap challenge is reused to pay for an expensive resource | The server checks the challenge was issued for that URL, price and merchant |

## What it does not do

The limits bound the damage, they do not decide whether a purchase is wise. An agent can still spend its whole daily cap on allowed merchants.

The daily window starts at the first payment after the previous window ended and lasts 24 hours. It is a rolling window, not a calendar day.

The facilitator in this repository trusts its own RPC node for simulation results. In production, run it against a node you control.

The demo server holds the fee payer key and the agent key in environment variables. Treat both as hot keys holding small balances, and keep the owner key in a wallet.

## Before real money

Get the program audited, add an upgrade authority policy, and replace the in-memory challenge book with shared storage if you run more than one server instance.
