"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { FundingQuote, FundingToken } from "@allowance/shared";
import { useFundingStatus } from "@/hooks/useFunding";
import { api } from "@/lib/api";
import { useConfig } from "./Providers";

const STATUS_TEXT: Record<string, string> = {
    PENDING_DEPOSIT: "Waiting for your deposit",
    KNOWN_DEPOSIT_TX: "Deposit detected",
    PROCESSING: "Swapping into USDC on Solana",
    SUCCESS: "USDC has arrived in your wallet",
    INCOMPLETE_DEPOSIT: "The deposit was too small to process",
    REFUNDED: "The deposit was refunded to your refund address",
    FAILED: "The swap failed",
};

export function FundingFlow() {
    const config = useConfig();
    const { publicKey } = useWallet();
    const [tokens, setTokens] = useState<FundingToken[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [chain, setChain] = useState("");
    const [assetId, setAssetId] = useState("");
    const [amount, setAmount] = useState("");
    const [refundTo, setRefundTo] = useState("");
    const [quote, setQuote] = useState<FundingQuote | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const status = useFundingStatus(quote?.depositAddress ?? null, quote?.depositMemo ?? null);

    useEffect(() => {
        if (!config.auroraEnabled) return;
        api
            .fundTokens()
            .then(setTokens)
            .catch((cause: Error) => setLoadError(cause.message));
    }, [config.auroraEnabled]);

    const chains = useMemo(() => Array.from(new Set(tokens.map((token) => token.blockchain))).sort(), [tokens]);
    const options = useMemo(() => tokens.filter((token) => token.blockchain === chain), [tokens, chain]);

    useEffect(() => {
        if (!chain && chains.length > 0) setChain(chains.includes("eth") ? "eth" : (chains[0] as string));
    }, [chains, chain]);

    useEffect(() => {
        setAssetId(options[0]?.assetId ?? "");
    }, [options]);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!publicKey) return;
        setBusy(true);
        setError(null);
        setQuote(null);
        try {
            setQuote(await api.fundQuote({ originAsset: assetId, amount, refundTo: refundTo.trim(), recipient: publicKey.toBase58() }));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not get a quote");
        } finally {
            setBusy(false);
        }
    };

    if (!config.auroraEnabled) {
        return (
            <p className="max-w-xl text-slate">
                Funding from other chains needs an Aurora API key on the server. You can still add USDC you already hold on Solana below.
            </p>
        );
    }

    return (
        <div className="max-w-xl">
            {loadError ? <p className="mb-4 text-sm text-alarm">{loadError}</p> : null}
            <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="chain" className="label">
                            Send from chain
                        </label>
                        <select id="chain" className="field" value={chain} onChange={(event) => setChain(event.target.value)}>
                            {chains.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="asset" className="label">
                            Asset
                        </label>
                        <select id="asset" className="field" value={assetId} onChange={(event) => setAssetId(event.target.value)}>
                            {options.map((token) => (
                                <option key={token.assetId} value={token.assetId}>
                                    {token.symbol}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="fund-amount" className="label">
                        Amount to send
                    </label>
                    <input id="fund-amount" className="field" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
                </div>
                <div>
                    <label htmlFor="refund" className="label">
                        Refund address on the chain you are sending from
                    </label>
                    <input id="refund" className="field" value={refundTo} onChange={(event) => setRefundTo(event.target.value)} />
                </div>
                <button type="submit" className="btn-primary" disabled={!publicKey || busy || !assetId || !amount || !refundTo}>
                    {busy ? "Getting a quote" : "Get deposit address"}
                </button>
                {!publicKey ? <p className="text-sm text-slate">Connect a wallet so Aurora knows where to deliver the USDC.</p> : null}
                {error ? <p className="text-sm text-alarm">{error}</p> : null}
            </form>

            {quote ? (
                <div className="section mt-8">
                    <p className="text-sm text-slate">Send exactly {quote.amountInFormatted ?? amount} to this address</p>
                    <p className="mt-1 break-all font-display text-lg font-semibold">{quote.depositAddress}</p>
                    {quote.depositMemo ? <p className="mt-1 text-sm">Memo: {quote.depositMemo}</p> : null}
                    <button type="button" className="btn-quiet mt-3" onClick={() => navigator.clipboard.writeText(quote.depositAddress)}>
                        Copy address
                    </button>
                    <p className="mt-4 text-sm text-slate">
                        You will receive about {quote.amountOutFormatted ?? "the quoted amount"} USDC in your Solana wallet.
                        {quote.deadline ? ` Send before ${new Date(quote.deadline).toLocaleTimeString()}.` : ""}
                    </p>
                    <p className="mt-4 text-ink">{status ? (STATUS_TEXT[status] ?? status) : "Checking status"}</p>
                    {status === "SUCCESS" ? <p className="mt-1 text-sm text-ledger">Add it to the allowance with the form below.</p> : null}
                </div>
            ) : null}
        </div>
    );
}
