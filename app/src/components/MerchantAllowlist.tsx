"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { setMerchantsIx, shortAddress, MAX_MERCHANTS, type PolicyState } from "@allowance/shared";
import { useSend } from "@/hooks/useSend";
import { useConfig, useKeys } from "./Providers";

type Props = {
    policy: PolicyState;
    isOwner: boolean;
    onDone: () => void;
};

export function MerchantAllowlist({ policy, isOwner, onDone }: Props) {
    const config = useConfig();
    const { programId, agent } = useKeys();
    const send = useSend();
    const [draft, setDraft] = useState<string[]>(policy.merchants.map((key) => key.toBase58()));
    const [entry, setEntry] = useState("");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
    const { publicKey } = useWallet();

    const add = () => {
        let key: string;
        try {
            key = new PublicKey(entry.trim()).toBase58();
        } catch {
            setMessage({ tone: "bad", text: "Enter a valid Solana address." });
            return;
        }
        if (draft.includes(key)) {
            setMessage({ tone: "bad", text: "That address is already on the list." });
            return;
        }
        if (draft.length >= MAX_MERCHANTS) {
            setMessage({ tone: "bad", text: `The list can hold ${MAX_MERCHANTS} merchants.` });
            return;
        }
        setDraft([...draft, key]);
        setEntry("");
        setMessage(null);
    };

    const save = async () => {
        if (!publicKey) return;
        setBusy(true);
        setMessage(null);
        try {
            await send([setMerchantsIx({ programId, owner: publicKey, agent, merchants: draft.map((value) => new PublicKey(value)) })]);
            setMessage({ tone: "good", text: "Allowlist saved." });
            onDone();
        } catch (cause) {
            setMessage({ tone: "bad", text: cause instanceof Error ? cause.message : "The transaction failed" });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-xl">
            <ul className="divide-y divide-line border-y border-line">
                {draft.length === 0 ? <li className="py-3 text-sm text-slate">No merchants allowed. The agent cannot pay anyone.</li> : null}
                {draft.map((address) => (
                    <li key={address} className="flex items-center justify-between gap-4 py-3 text-sm">
                        <span>
                            {address === config.merchant ? "Demo merchant " : ""}
                            <span className="text-slate">{shortAddress(address, 6)}</span>
                        </span>
                        <button type="button" className="text-alarm hover:underline disabled:opacity-50" disabled={!isOwner} onClick={() => setDraft(draft.filter((item) => item !== address))}>
                            Remove
                        </button>
                    </li>
                ))}
            </ul>
            <div className="mt-4 flex gap-2">
                <input className="field" placeholder="Merchant wallet address" value={entry} onChange={(event) => setEntry(event.target.value)} />
                <button type="button" className="btn-quiet shrink-0" onClick={add} disabled={!isOwner || entry.trim() === ""}>
                    Add
                </button>
            </div>
            <button type="button" className="btn-primary mt-4" onClick={save} disabled={!isOwner || busy}>
                {busy ? "Waiting for wallet" : "Save allowlist"}
            </button>
            {message ? <p className={message.tone === "good" ? "mt-3 text-sm text-ledger" : "mt-3 text-sm text-alarm"}>{message.text}</p> : null}
        </div>
    );
}
