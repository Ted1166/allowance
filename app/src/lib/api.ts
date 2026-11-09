import type {
    AgentRun,
    AttackName,
    AttackResult,
    ConfigView,
    FundingQuote,
    FundingToken,
    ReceiptView,
} from "@allowance/shared";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4021";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
    if (!response.ok) {
        const detail = body?.error;
        throw new Error(typeof detail === "string" ? detail : `Request failed with status ${response.status}`);
    }
    return body as T;
}

export const api = {
    config: () => request<ConfigView>("/api/config"),
    receipts: () => request<ReceiptView[]>("/api/receipts"),
    fundTokens: () => request<FundingToken[]>("/api/fund/tokens"),
    fundQuote: (body: { originAsset: string; amount: string; refundTo: string; recipient: string }) =>
        request<FundingQuote>("/api/fund/quote", { method: "POST", body: JSON.stringify({ ...body, dry: false }) }),
    fundStatus: (depositAddress: string, depositMemo: string | null) => {
        const query = new URLSearchParams({ depositAddress });
        if (depositMemo) query.set("depositMemo", depositMemo);
        return request<{ status: string }>(`/api/fund/status?${query.toString()}`);
    },
    runAttack: (name: AttackName, mode?: "live" | "scripted") =>
        request<AttackResult>(`/api/demo/attacks/${name}`, { method: "POST", body: JSON.stringify({ mode }) }),
    buy: (route: string) =>
    request<{ paid: boolean; signature: string | null; error: string | null; body: string }>("/api/demo/buy", {
      method: "POST",
      body: JSON.stringify({ route }),
    }),
  runAgent: (task: string) => request<AgentRun>("/api/demo/agent", { method: "POST", body: JSON.stringify({ task }) }),
};
