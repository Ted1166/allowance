import type { PaymentRequirement, PaymentResource } from "@allowance/shared";

export type PendingChallenge = {
    requirement: PaymentRequirement;
    resource: PaymentResource;
    expiresAt: number;
};

export class ChallengeBook {
    private pending = new Map<string, PendingChallenge>();

    issue(requirement: PaymentRequirement, resource: PaymentResource): void {
        this.sweep();
        this.pending.set(requirement.extra.reference, {
            requirement,
            resource,
            expiresAt: Date.now() + requirement.maxTimeoutSeconds * 1000,
        });
    }

    take(reference: string): PendingChallenge | null {
        const entry = this.pending.get(reference);
        if (!entry) return null;
        this.pending.delete(reference);
        return entry.expiresAt >= Date.now() ? entry : null;
    }

    private sweep(): void {
        const now = Date.now();
        for (const [key, entry] of this.pending) {
            if (entry.expiresAt < now) this.pending.delete(key);
        }
    }
}
