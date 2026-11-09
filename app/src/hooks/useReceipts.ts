import { useEffect, useState } from "react";
import type { ReceiptView } from "@allowance/shared";
import { API_URL, api } from "@/lib/api";

export function useReceipts() {
    const [receipts, setReceipts] = useState<ReceiptView[]>([]);

    useEffect(() => {
        let active = true;
        api
            .receipts()
            .then((items) => {
                if (active) setReceipts(items);
            })
            .catch(() => undefined);

        const source = new EventSource(`${API_URL}/api/receipts/stream`);
        source.onmessage = (event) => {
            const receipt = JSON.parse(event.data) as ReceiptView;
            setReceipts((current) => [receipt, ...current.filter((item) => item.id !== receipt.id)]);
        };

        return () => {
            active = false;
            source.close();
        };
    }, []);

    return receipts;
}
