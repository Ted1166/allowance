# Aurora Intents integration

Allowance uses the Aurora Intents Swap API to let an owner fund the allowance with whatever they hold on another chain.

## Flow

1. The app loads the supported assets through `GET /api/fund/tokens`, which the server forwards to Aurora's token list.
2. The owner picks a chain, an asset and an amount, and enters a refund address on that chain.
3. The server requests a quote from Aurora with the origin asset, Solana USDC as the destination asset, the owner's Solana wallet as the recipient and the refund address as `refundTo`. The response contains a one time deposit address.
4. The owner sends the asset to that address. The app polls the swap status until it reads success.
5. USDC arrives in the owner's wallet on Solana. The owner then adds it to the allowance with the `deposit` instruction.

Refunds are handled by Aurora: if the swap cannot complete, the origin asset returns to the refund address, and the app shows that state.

## Why the recipient is the wallet, not the vault

The vault is owned by a program derived address. Delivering straight to it depends on how Aurora handles off-curve recipients, so the first version delivers to the owner's wallet and uses an explicit second step. Once you have confirmed that Aurora can deliver to the vault's token account, set the quote recipient to the policy address and the second step disappears.

## Running it

Create an API key in the Aurora widget studio and put it in `AURORA_API_KEY`. Aurora has no testnet, so test with small amounts on mainnet. The recommended minimum deposit is about one dollar, and smaller amounts can get stuck. The quote request supports a dry run (`dry: true`) that returns pricing without creating a deposit address, which is a good way to test the wiring for free.

## Worth confirming before you record

The request and response field names in `server/src/aurora` follow Aurora's public documentation, but they have not been exercised against the live API from this repository. Run one dry quote first and adjust `server/src/aurora/routes.ts` if a field differs.

## Going further

Aurora's Intents Connect can call a Solana program as part of a deposit. Pointing it at the `deposit` instruction would fund the vault in one step and qualify for the contract-level composability bonus.
