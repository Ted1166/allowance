import { useWallet } from "@solana/wallet-adapter-react";
import type { PolicyState } from "@allowance/shared";

export function useIsOwner(policy: PolicyState | null): boolean {
    const { publicKey } = useWallet();
    return Boolean(publicKey && policy && policy.owner.equals(publicKey));
}
