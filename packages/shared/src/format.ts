import { USDC_DECIMALS } from "./constants";

export function toBaseUnits(value: string, decimals = USDC_DECIMALS): bigint {
    const trimmed = value.trim();
    if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === "" || trimmed === ".") {
        throw new Error(`Invalid amount: ${value}`);
    }
    const [whole = "0", fraction = ""] = trimmed.split(".");
    const padded = (fraction + "0".repeat(decimals)).slice(0, decimals);
    return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(padded || "0");
}

export function formatUnits(value: bigint, decimals = USDC_DECIMALS): string {
    const base = 10n ** BigInt(decimals);
    const whole = value / base;
    const fraction = (value % base).toString().padStart(decimals, "0").replace(/0+$/, "");
    return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function shortAddress(address: string, size = 4): string {
    if (address.length <= size * 2 + 1) return address;
    return `${address.slice(0, size)}...${address.slice(-size)}`;
}
