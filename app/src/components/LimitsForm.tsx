"use client";

import { useState, type FormEvent } from "react";
import { initPolicyIx, setLimitsIx, toBaseUnits, type PolicyState } from "@allowance/shared";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSend } from "@/hooks/useSend";
import { usdc } from "@/lib/format";
import { useKeys } from "./Providers";

type Props = {
    policy: PolicyState | null;
    isOwner: boolean;
    onDone: () => void;
};

export function LimitsForm({ policy, isOwner, onDone }: Props) {
    const { publicKey } = useWallet();
    const { programId, agent, mint, merchant } = useKeys();
    const send = useSend();
    const [perCall, setPerCall] = useState(policy ? usdc(policy.perCallCap).replace(/,/g, "") : "0.5");
    const [daily, setDaily] = useState(policy ? usdc(policy.dailyCap).replace(/,/g, "") : "5");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<{ tone: "good" | "bad"; text: string } | null>(null);

    const canSubmit = Boolean(publicKey) && (policy === null || isOwner);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!publicKey) return;
        setBusy(true);
        setMessage(null);
        try {
            const perCallCap = toBaseUnits(perCall);
            const dailyCap = toBaseUnits(daily);
            if (perCallCap === 0n || dailyCap < perCallCap) {
                throw new Error("The daily limit must be at least the per call limit, and neither can be zero.");
            }
            const instruction = policy
                ? setLimitsIx({ programId, owner: publicKey, agent, perCallCap, dailyCap })
                : initPolicyIx({ programId, owner: publicKey, agent, mint, perCallCap, dailyCap, merchants: [merchant] });
            await send([instruction]);
            setMessage({ tone: "good", text: policy ? "Limits saved." : "Allowance created. The demo merchant is on the allowlist." });
            onDone();
        } catch (cause) {
            setMessage({ tone: "bad", text: cause instanceof Error ? cause.message : "The transaction failed" });
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} className="max-w-md space-y-4">
            <div>
                <label htmlFor="per-call" className="label">
                    Per call limit (USDC)
                </label>
                <input id="per-call" className="field" inputMode="decimal" value={perCall} onChange={(event) => setPerCall(event.target.value)} />
            </div>
            <div>
                <label htmlFor="daily" className="label">
                    Daily limit (USDC)
                </label>
                <input id="daily" className="field" inputMode="decimal" value={daily} onChange={(event) => setDaily(event.target.value)} />
            </div>
            <button type="submit" className="btn-primary" disabled={!canSubmit || busy}>
                {busy ? "Waiting for wallet" : policy ? "Save limits" : "Create allowance"}
            </button>
            {!publicKey ? <p className="text-sm text-slate">Connect a wallet to continue.</p> : null}
            {publicKey && policy && !isOwner ? <p className="text-sm text-slate">Only the owner wallet can change limits.</p> : null}
            {message ? <p className={message.tone === "good" ? "text-sm text-ledger" : "text-sm text-alarm"}>{message.text}</p> : null}
        </form>
    );
}
