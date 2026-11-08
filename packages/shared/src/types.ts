export type ConfigView = {
    network: "devnet" | "mainnet";
    caip2: string;
    rpcUrl: string;
    programId: string;
    mint: string;
    agent: string;
    merchant: string;
    attacker: string;
    feePayer: string;
    serverUrl: string;
    auroraEnabled: boolean;
    liveAgentEnabled: boolean;
};

export type ReceiptView = {
    id: string;
    status: "settled" | "rejected";
    signature: string | null;
    merchant: string | null;
    amount: string | null;
    spentToday: string | null;
    resource: string | null;
    reason: string | null;
    timestamp: number;
};

export type FundingToken = {
    assetId: string;
    symbol: string;
    blockchain: string;
    decimals: number;
    price?: number;
};

export type FundingQuote = {
    depositAddress: string;
    depositMemo: string | null;
    amountInFormatted: string | null;
    amountOutFormatted: string | null;
    deadline: string | null;
    timeEstimate: number | null;
};

export type AttackName = "overspend" | "unknownMerchant" | "promptInjection" | "frozen";

export type AttackResult = {
    name: AttackName;
    title: string;
    description: string;
    mode: "onchain" | "live-agent" | "scripted-agent";
    outcome: "rejected" | "settled" | "error";
    failure: { code: number | null; name: string; message: string } | null;
    signature: string | null;
    explorerUrl: string | null;
    notes: string[];
};

export type AgentStep = {
    tool: string;
    input: unknown;
    output: string;
};

export type AgentRun = {
    steps: AgentStep[];
    answer: string;
};
