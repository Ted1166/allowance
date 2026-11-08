import { EventEmitter } from "node:events";
import type { ReceiptView } from "@allowance/shared";

const LIMIT = 200;

export class ReceiptStore {
    private items: ReceiptView[] = [];
    private bySignature = new Set<string>();
    private emitter = new EventEmitter();

    list(): ReceiptView[] {
        return [...this.items].sort((a, b) => b.timestamp - a.timestamp);
    }

    has(signature: string): boolean {
        return this.bySignature.has(signature);
    }

    add(receipt: ReceiptView): void {
        if (receipt.signature) {
            if (this.bySignature.has(receipt.signature)) return;
            this.bySignature.add(receipt.signature);
        }
        this.items.push(receipt);
        if (this.items.length > LIMIT) {
            const removed = this.items.shift();
            if (removed?.signature) this.bySignature.delete(removed.signature);
        }
        this.emitter.emit("receipt", receipt);
    }

    subscribe(listener: (receipt: ReceiptView) => void): () => void {
        this.emitter.on("receipt", listener);
        return () => this.emitter.off("receipt", listener);
    }
}
