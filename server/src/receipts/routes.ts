import { Router } from "express";
import type { ReceiptStore } from "./store";

export function receiptRoutes(store: ReceiptStore): Router {
    const router = Router();

    router.get("/", (_req, res) => {
        res.json(store.list());
    });

    router.get("/stream", (req, res) => {
        res.set({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        });
        res.flushHeaders();
        res.write(": connected\n\n");

        const unsubscribe = store.subscribe((receipt) => {
            res.write(`data: ${JSON.stringify(receipt)}\n\n`);
        });
        const heartbeat = setInterval(() => res.write(": ping\n\n"), 15_000);

        req.on("close", () => {
            clearInterval(heartbeat);
            unsubscribe();
        });
    });

    return router;
}
