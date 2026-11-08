import type { ServerConfig } from "../config";
import type { ReceiptStore } from "../receipts/store";
import type { ChallengeBook } from "./replayGuard";

export type X402Context = {
    config: ServerConfig;
    receipts: ReceiptStore;
    challenges: ChallengeBook;
};
