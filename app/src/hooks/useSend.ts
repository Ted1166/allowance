import { useCallback } from "react";
import { Transaction, type TransactionInstruction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

export function useSend() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    return useCallback(
        async (instructions: TransactionInstruction[]): Promise<string> => {
            if (!publicKey) throw new Error("Connect a wallet first");
            const transaction = new Transaction().add(...instructions);
            const latest = await connection.getLatestBlockhash();
            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction({ signature, ...latest }, "confirmed");
            return signature;
        },
        [connection, publicKey, sendTransaction],
    );
}
