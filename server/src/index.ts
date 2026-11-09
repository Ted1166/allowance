import cors from "cors";
import express from "express";
import { ATTACKS, createAgentContext, payingFetch, runAgent, runAttack } from "@allowance/agent";
import type { AttackName, ConfigView } from "@allowance/shared";
import { auroraRoutes } from "./aurora/routes";
import { loadConfig } from "./config";
import { backfillReceipts, watchReceipts } from "./receipts/indexer";
import { receiptRoutes } from "./receipts/routes";
import { ReceiptStore } from "./receipts/store";
import { merchantRoutes } from "./x402/merchantRoutes";
import { ChallengeBook } from "./x402/replayGuard";

const config = loadConfig();
const receipts = new ReceiptStore();
const agentContext = createAgentContext();

const app = express();
app.use(cors({ exposedHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE"] }));
app.use(express.json());

app.get("/api/config", (_req, res) => {
    const view: ConfigView = {
        network: config.network,
        caip2: config.caip2,
        rpcUrl: config.rpcUrl,
        programId: config.programId.toBase58(),
        mint: config.mint.toBase58(),
        agent: config.agent.toBase58(),
        merchant: config.merchant.toBase58(),
        attacker: config.attacker.toBase58(),
        feePayer: config.feePayer.publicKey.toBase58(),
        serverUrl: config.publicUrl,
        auroraEnabled: config.auroraKey !== null,
        liveAgentEnabled: Boolean(process.env.ANTHROPIC_API_KEY),
    };
    res.json(view);
});

app.use("/api/receipts", receiptRoutes(receipts));
app.use("/api/fund", auroraRoutes(config));

app.get("/api/demo/attacks", (_req, res) => {
    res.json(ATTACKS);
});

app.post("/api/demo/attacks/:name", async (req, res) => {
    const name = req.params.name as AttackName;
    if (!ATTACKS.some((attack) => attack.name === name)) {
        res.status(404).json({ error: `Unknown attack ${name}` });
        return;
    }
    try {
        const mode = req.body?.mode === "live" || req.body?.mode === "scripted" ? req.body.mode : undefined;
        res.json(await runAttack(agentContext, name, { mode }));
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Attack failed" });
    }
});

app.post("/api/demo/agent", async (req, res) => {
    const task = typeof req.body?.task === "string" ? req.body.task.trim() : "";
    if (!task) {
        res.status(400).json({ error: "task is required" });
        return;
    }
    try {
        res.json(await runAgent(agentContext, task));
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Agent failed" });
    }
});

app.post("/api/demo/buy", async (req, res) => {
  const route = typeof req.body?.route === "string" ? req.body.route : "";
  if (!/^\/paid\/[a-z0-9/_-]+$/i.test(route)) {
    res.status(400).json({ error: "route must start with /paid/" });
    return;
  }
  try {
    const result = await payingFetch(agentContext, `${config.publicUrl}${route}`);
    res.json({ paid: result.paid, signature: result.signature, error: result.error, body: result.body });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Purchase failed" });
  }
});

app.use(merchantRoutes({ config, receipts, challenges: new ChallengeBook() }));

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Unexpected error" });
});

app.listen(config.port, () => {
    console.log(`Allowance server listening on ${config.publicUrl}`);
    console.log(`Fee payer ${config.feePayer.publicKey.toBase58()} on ${config.network}`);
});

backfillReceipts(config, receipts).catch((error) => console.warn("Receipt backfill skipped:", error.message));
watchReceipts(config, receipts);
