"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PublicKey } from "@solana/web3.js";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import type { ConfigView } from "@allowance/shared";
import { API_URL, api } from "@/lib/api";
import "@solana/wallet-adapter-react-ui/styles.css";

const ConfigContext = createContext<ConfigView | null>(null);

export function useConfig(): ConfigView {
    const value = useContext(ConfigContext);
    if (!value) throw new Error("useConfig must be used inside Providers");
    return value;
}

export function useKeys() {
    const config = useConfig();
    return useMemo(
        () => ({
            programId: new PublicKey(config.programId),
            agent: new PublicKey(config.agent),
            mint: new PublicKey(config.mint),
            merchant: new PublicKey(config.merchant),
        }),
        [config],
    );
}

export function Providers({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<ConfigView | null>(null);
    const [error, setError] = useState<string | null>(null);
    const wallets = useMemo(() => [], []);

    useEffect(() => {
        api
            .config()
            .then(setConfig)
            .catch(() => setError(`Could not reach the Allowance server at ${API_URL}. Start it with pnpm dev:server.`));
    }, []);

    if (error) {
        return <p className="mx-auto max-w-xl px-5 py-24 text-ink">{error}</p>;
    }
    if (!config) {
        return <p className="mx-auto max-w-xl px-5 py-24 text-slate">Loading</p>;
    }

    return (
        <ConfigContext.Provider value={config}>
            <ConnectionProvider endpoint={config.rpcUrl}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>{children}</WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ConfigContext.Provider>
    );
}
