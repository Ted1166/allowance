#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "Usage: scripts/airdrop.sh <address> [address...]"
  exit 1
fi

for address in "$@"; do
  solana airdrop 2 "$address" --url devnet
done
