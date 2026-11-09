"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";

const WalletButton = dynamic(() => import("@solana/wallet-adapter-react-ui").then((module) => module.WalletMultiButton), {
    ssr: false,
});

const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/fund", label: "Fund" },
    { href: "/limits", label: "Limits" },
    { href: "/receipts", label: "Receipts" },
    { href: "/attack-demo", label: "Attack demo" },
];

export function Nav() {
    const pathname = usePathname();

    return (
        <header className="border-b border-line">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
                <Link href="/" className="font-display text-xl font-semibold">
                    Allowance
                </Link>
                <nav className="flex flex-1 flex-wrap gap-x-5 gap-y-1 text-sm">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={pathname === link.href ? "border-b-2 border-ledger pb-0.5 text-ink" : "pb-0.5 text-slate hover:text-ink"}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
                <WalletButton />
            </div>
        </header>
    );
}
