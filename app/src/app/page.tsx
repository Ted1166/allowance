import Link from "next/link";
import { BudgetRuler } from "@/components/BudgetRuler";

export default function HomePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-5xl font-semibold leading-tight sm:text-6xl">A budget your AI agent cannot overspend</h1>
      <p className="mt-6 max-w-xl text-lg text-slate">
        Fund an allowance from any chain, set what the agent may spend, and let it buy from paid APIs. The limits live in a Solana
        program, so they hold even when the model is tricked.
      </p>

      <div className="mt-12 max-w-xl">
        <BudgetRuler spent={4_200_000n} dailyCap={10_000_000n} perCallCap={500_000n} />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/dashboard" className="btn-primary">
          Open the dashboard
        </Link>
        <Link href="/attack-demo" className="btn-quiet">
          Watch attacks fail
        </Link>
      </div>

      <dl className="mt-16 grid gap-8 sm:grid-cols-3">
        <div className="section">
          <dt className="font-display text-lg font-semibold">You set the limits</dt>
          <dd className="mt-2 text-sm text-slate">A cap per purchase, a cap per day, a list of merchants, and a freeze switch.</dd>
        </div>
        <div className="section">
          <dt className="font-display text-lg font-semibold">Fund it from any chain</dt>
          <dd className="mt-2 text-sm text-slate">Send what you hold. Aurora turns it into USDC on Solana and it lands in your wallet.</dd>
        </div>
        <div className="section">
          <dt className="font-display text-lg font-semibold">The program says no</dt>
          <dd className="mt-2 text-sm text-slate">Overspends, unknown merchants and injected instructions fail on chain, not in a prompt.</dd>
        </div>
      </dl>
    </div>
  );
}
