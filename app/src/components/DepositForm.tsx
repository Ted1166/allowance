"use client";

import { useState } from "react";
import { createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { depositIx, tokenAccountFor, toBaseUnits, withdrawIx, type PolicyState } from "@allowance/shared";
import { useSend } from "@/hooks/useSend";
import { useKeys } from "./Providers";

type Props = {
    policy: PolicyState | null;
    isOwner: boolean;
    onDone: () => void;
};

export function DepositForm({ policy, isOwner, onDone }: Props) {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { programId, agent, mint } = useKeys();
    const send = useSend();
    const [amount, setAmount] = useState("1");
    const [busy, setBusy] = useState<"deposit" | "withdraw" | null>(null);
    const [message, setMessage] = useState<{ tone: "good" | "bad"; text: string } | null>(null);

    const run = async (kind: "deposit" | "withdraw") => {
        if (!publicKey) return;
        setBusy(kind);
        setMessage(null);
        try {
            const value = toBaseUnits(amount);
            if (value === 0n) throw new Error("Enter an amount above zero.");
            const walletToken = tokenAccountFor(publicKey, mint);

            if (kind === "deposit") {
                if (!(await connection.getAccountInfo(walletToken))) {
                    throw new Error("This wallet has no USDC yet. Fund it first, then add it to the allowance.");
                }
                await send([depositIx({ programId, signer: publicKey, agent, mint, amount: value })]);
                setMessage({ tone: "good", text: "Added to the allowance." });
            } else {
                await send([
                    createAssociatedTokenAccountIdempotentInstruction(publicKey, walletToken, publicKey, mint),
                    withdrawIx({ programId, signer: publicKey, agent, mint, amount: value }),
                ]);
                setMessage({ tone: "good", text: "Withdrawn to your wallet." });
            }
            onDone();
        } catch (cause) {
            setMessage({ tone: "bad", text: cause instanceof Error ? cause.message : "The transaction failed" });
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="max-w-md space-y-4">
            <div>
                <label htmlFor="move-amount" className="label">
                    Amount (USDC)
                </label>
                <input id="move-amount" className="field" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </div>
            <div className="flex gap-3">
                <button type="button" className="btn-primary" disabled={!publicKey || !policy || busy !== null} onClick={() => run("deposit")}>
                    {busy === "deposit" ? "Waiting for wallet" : "Add to allowance"}
                </button>
                <button type="button" className="btn-quiet" disabled={!isOwner || busy !== null} onClick={() => run("withdraw")}>
                    {busy === "withdraw" ? "Waiting for wallet" : "Withdraw"}
                </button>
            </div>
            {!policy ? <p className="text-sm text-slate">Create the allowance on the Limits page first.</p> : null}
            {message ? <p className={message.tone === "good" ? "text-sm text-ledger" : "text-sm text-alarm"}>{message.text}</p> : null}
        </div>
    );
}
