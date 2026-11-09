"use client";

import { useState } from "react";
import { setFrozenIx, type PolicyState } from "@allowance/shared";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSend } from "@/hooks/useSend";
import { useKeys } from "./Providers";

type Props = {
    policy: PolicyState;
    isOwner: boolean;
    onDone: () => void;
};

export function KillSwitch({ policy, isOwner, onDone }: Props) {
    const { publicKey } = useWallet();
    const { programId, agent } = useKeys();
    const send = useSend();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggle = async () => {
        if (!publicKey) return;
        setBusy(true);
        setError(null);
        try {
            await send([setFrozenIx({ programId, owner: publicKey, agent, frozen: !policy.frozen })]);
            onDone();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The transaction failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <button type="button" onClick={toggle} disabled={!isOwner || busy} className={policy.frozen ? "btn-quiet" : "btn-danger"}>
                {busy ? "Waiting for wallet" : policy.frozen ? "Unfreeze agent" : "Freeze agent now"}
            </button>
            <p className="mt-2 text-sm text-slate">
                {isOwner
                    ? policy.frozen
                        ? "Every payment from the agent is refused until you unfreeze."
                        : "Stops every payment from the agent immediately."
                    : "Connect the owner wallet to use the kill switch."}
            </p>
            {error ? <p className="mt-2 text-sm text-alarm">{error}</p> : null}
        </div>
    );
}
