import { useCallback, useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { fetchPolicy, policyAddress, vaultAddress, type PolicyState } from "@allowance/shared";
import { useKeys } from "@/components/Providers";

type PolicyView = {
    loading: boolean;
    policy: PolicyState | null;
    address: string | null;
    vaultBalance: bigint;
};

export function usePolicy() {
    const { connection } = useConnection();
    const { programId, agent, mint } = useKeys();
    const [view, setView] = useState<PolicyView>({ loading: true, policy: null, address: null, vaultBalance: 0n });

    const refresh = useCallback(async () => {
        try {
            const found = await fetchPolicy(connection, agent, programId);
            if (!found) {
                setView({ loading: false, policy: null, address: null, vaultBalance: 0n });
                return;
            }
            const vault = vaultAddress(policyAddress(agent, programId)[0], mint);
            const balance = await connection.getTokenAccountBalance(vault).catch(() => null);
            setView({
                loading: false,
                policy: found.state,
                address: found.address.toBase58(),
                vaultBalance: BigInt(balance?.value.amount ?? "0"),
            });
        } catch {
            setView((current) => ({ ...current, loading: false }));
        }
    }, [connection, agent, programId, mint]);

    useEffect(() => {
        refresh();
        const timer = setInterval(refresh, 5000);
        return () => clearInterval(timer);
    }, [refresh]);

    return { ...view, refresh };
}
