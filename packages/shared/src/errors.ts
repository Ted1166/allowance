import { ALLOWANCE_ERRORS } from "./constants";

export type Failure = {
    code: number | null;
    name: string;
    message: string;
};

function customCode(err: unknown): number | null {
    if (!err || typeof err !== "object" || !("InstructionError" in err)) return null;
    const detail = (err as { InstructionError: [number, unknown] }).InstructionError[1];
    if (detail && typeof detail === "object" && "Custom" in detail) {
        return Number((detail as { Custom: number }).Custom);
    }
    return null;
}

function logValue(logs: string[] | null | undefined, marker: string): string | null {
    const line = logs?.find((entry) => entry.includes(marker));
    if (!line) return null;
    return line.split(marker)[1]?.split(".")[0]?.trim() ?? null;
}

export function describeFailure(err: unknown, logs?: string[] | null): Failure {
    const code = customCode(err);
    if (code !== null && ALLOWANCE_ERRORS[code]) {
        return { code, ...ALLOWANCE_ERRORS[code] };
    }
    const name = logValue(logs, "Error Code:");
    const message = logValue(logs, "Error Message:");
    if (name || message) {
        return { code, name: name ?? "ProgramError", message: message ?? name ?? "Program error" };
    }
    if (typeof err === "string") return { code, name: "Error", message: err };
    return { code, name: "TransactionFailed", message: JSON.stringify(err) };
}
