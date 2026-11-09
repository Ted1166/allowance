import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const FINISHED = new Set(["SUCCESS", "REFUNDED", "FAILED"]);

export function useFundingStatus(depositAddress: string | null, depositMemo: string | null) {
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!depositAddress) {
            setStatus(null);
            return;
        }
        let active = true;
        const poll = async () => {
            try {
                const result = await api.fundStatus(depositAddress, depositMemo);
                if (!active) return;
                setStatus(result.status);
                if (FINISHED.has(result.status)) clearInterval(timer);
            } catch {
                return;
            }
        };
        const timer = setInterval(poll, 4000);
        poll();
        return () => {
            active = false;
            clearInterval(timer);
        };
    }, [depositAddress, depositMemo]);

    return status;
}
