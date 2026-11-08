export type AuroraToken = {
    assetId: string;
    symbol: string;
    blockchain: string;
    decimals: number;
    price?: number;
};

export class AuroraError extends Error {
    constructor(
        readonly status: number,
        readonly body: string,
    ) {
        super(`Aurora API returned ${status}: ${body}`);
    }
}

export class AuroraClient {
    constructor(
        private readonly baseUrl: string,
        private readonly apiKey: string,
    ) { }

    private async request<T>(path: string, init?: RequestInit): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, init);
        const text = await response.text();
        if (!response.ok) throw new AuroraError(response.status, text);
        return JSON.parse(text) as T;
    }

    tokens(): Promise<AuroraToken[]> {
        return this.request(`/api/tokens/${this.apiKey}`);
    }

    quote(body: Record<string, unknown>): Promise<Record<string, unknown>> {
        return this.request(`/api/quote/${this.apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    }

    status(depositAddress: string, depositMemo?: string): Promise<Record<string, unknown>> {
        const query = new URLSearchParams({ depositAddress });
        if (depositMemo) query.set("depositMemo", depositMemo);
        return this.request(`/api/status/${this.apiKey}?${query.toString()}`);
    }
}
