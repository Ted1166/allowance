#!/usr/bin/env bash
set -euo pipefail

cluster="${1:-devnet}"

anchor build
anchor keys sync
anchor build
anchor deploy --provider.cluster "$cluster"

echo
echo "Program id: $(solana address -k target/deploy/allowance-keypair.json)"
echo "Copy it into ALLOWANCE_PROGRAM_ID in .env"
