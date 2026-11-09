import { formatUnits } from "@allowance/shared";

export function usdc(value: bigint | string | null | undefined): string {
    if (value === null || value === undefined) return "-";
    const text = formatUnits(BigInt(value));
    const [whole = "0", fraction = ""] = text.split(".");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return fraction ? `${grouped}.${fraction.slice(0, 4)}` : grouped;
}

export function timeOf(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function pathOf(url: string | null): string {
    if (!url) return "";
    try {
        return new URL(url).pathname;
    } catch {
        return url;
    }
}
