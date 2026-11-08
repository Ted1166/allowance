import { PublicKey } from "@solana/web3.js";
import { Router, type Request, type Response } from "express";
import { toBaseUnits, type FundingQuote, type FundingToken } from "@allowance/shared";
import type { ServerConfig } from "../config";
import { findSolanaUsdc, findToken } from "./assets";
import { AuroraClient, AuroraError, type AuroraToken } from "./client";

const TOKEN_CACHE_MS = 5 * 60 * 1000;
const QUOTE_WINDOW_MS = 30 * 60 * 1000;

function fail(res: Response, error: unknown): void {
    if (error instanceof AuroraError) {
        res.status(error.status >= 400 && error.status < 500 ? error.status : 502).json({ error: error.body });
        return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : "Unexpected error" });
}

export function auroraRoutes(config: ServerConfig): Router {
    const router = Router();
    const client = config.auroraKey ? new AuroraClient(config.auroraUrl, config.auroraKey) : null;
    let cache: { tokens: AuroraToken[]; loadedAt: number } | null = null;

    const loadTokens = async (): Promise<AuroraToken[]> => {
        if (!client) throw new Error("Aurora is not configured");
        if (!cache || Date.now() - cache.loadedAt > TOKEN_CACHE_MS) {
            cache = { tokens: await client.tokens(), loadedAt: Date.now() };
        }
        return cache.tokens;
    };

    router.use((_req, res, next) => {
        if (client) {
            next();
            return;
        }
        res.status(503).json({ error: "Set AURORA_API_KEY to enable funding from other chains." });
    });

    router.get("/tokens", async (_req, res) => {
        try {
            const tokens = await loadTokens();
            const view: FundingToken[] = tokens.map((token) => ({
                assetId: token.assetId,
                symbol: token.symbol,
                blockchain: token.blockchain,
                decimals: token.decimals,
                price: token.price,
            }));
            res.json(view);
        } catch (error) {
            fail(res, error);
        }
    });

    router.post("/quote", async (req: Request, res: Response) => {
        try {
            const { originAsset, amount, refundTo, recipient, dry } = req.body as {
                originAsset?: string;
                amount?: string;
                refundTo?: string;
                recipient?: string;
                dry?: boolean;
            };
            if (!originAsset || !amount || !refundTo || !recipient) {
                res.status(400).json({ error: "originAsset, amount, refundTo and recipient are required" });
                return;
            }
            new PublicKey(recipient);

            const tokens = await loadTokens();
            const origin = findToken(tokens, originAsset);
            const destination = findSolanaUsdc(tokens);
            if (!origin) {
                res.status(400).json({ error: "Unknown origin asset" });
                return;
            }
            if (!destination) {
                res.status(502).json({ error: "Solana USDC is not available from Aurora right now" });
                return;
            }

            const raw = await client!.quote({
                dry: dry === true,
                swapType: "EXACT_INPUT",
                slippageTolerance: 100,
                originAsset: origin.assetId,
                depositType: "ORIGIN_CHAIN",
                destinationAsset: destination.assetId,
                amount: toBaseUnits(amount, origin.decimals).toString(),
                refundTo,
                refundType: "ORIGIN_CHAIN",
                recipient,
                recipientType: "DESTINATION_CHAIN",
                deadline: new Date(Date.now() + QUOTE_WINDOW_MS).toISOString(),
            });

            const quote = (raw.quote ?? raw) as Record<string, unknown>;
            const view: FundingQuote = {
                depositAddress: String(quote.depositAddress ?? ""),
                depositMemo: quote.depositMemo ? String(quote.depositMemo) : null,
                amountInFormatted: quote.amountInFormatted ? String(quote.amountInFormatted) : null,
                amountOutFormatted: quote.amountOutFormatted ? String(quote.amountOutFormatted) : null,
                deadline: quote.deadline ? String(quote.deadline) : null,
                timeEstimate: typeof quote.timeEstimate === "number" ? quote.timeEstimate : null,
            };
            res.json(view);
        } catch (error) {
            fail(res, error);
        }
    });

    router.get("/status", async (req: Request, res: Response) => {
        try {
            const depositAddress = String(req.query.depositAddress ?? "");
            const depositMemo = req.query.depositMemo ? String(req.query.depositMemo) : undefined;
            if (!depositAddress) {
                res.status(400).json({ error: "depositAddress is required" });
                return;
            }
            const result = await client!.status(depositAddress, depositMemo);
            res.json({ status: String(result.status ?? "UNKNOWN") });
        } catch (error) {
            fail(res, error);
        }
    });

    return router;
}
