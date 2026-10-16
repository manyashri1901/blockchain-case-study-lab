import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Info } from "lucide-react";

export const DISCLAIMER =
  "Educational simulation. All shipments, participants, transactions and balances are fictional. This does not reproduce the internal systems of IBM, Maersk or ASX, and it is not a real blockchain.";

export function Disclaimer() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-navy-600 bg-navy-800 px-4 py-2 text-base text-slate-300">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
      <p>{DISCLAIMER}</p>
    </div>
  );
}

const tones = {
  cyan: "bg-cyan-400 text-navy-950 hover:bg-cyan-300",
  green: "bg-emerald-400 text-navy-950 hover:bg-emerald-300",
  red: "bg-red-500 text-white hover:bg-red-400",
  amber: "bg-amber-400 text-navy-950 hover:bg-amber-300",
  ghost: "bg-navy-700 text-slate-100 hover:bg-navy-600 border border-navy-600",
};

export function Btn({
  tone = "ghost",
  icon,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof tones; icon?: ReactNode }) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${tones[tone]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function Card({ title, children, className = "", right }: { title?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={`rounded-xl border border-navy-600 bg-navy-900 p-4 ${className}`}>
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h3 className="text-xl font-bold text-cyan-300">{title}</h3>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

const pillTones = {
  green: "border-emerald-400 text-emerald-300 bg-emerald-400/10",
  amber: "border-amber-400 text-amber-300 bg-amber-400/10",
  red: "border-red-400 text-red-300 bg-red-400/10",
  cyan: "border-cyan-400 text-cyan-300 bg-cyan-400/10",
  slate: "border-slate-500 text-slate-300 bg-slate-500/10",
};

export function Pill({ tone, children }: { tone: keyof typeof pillTones; children: ReactNode }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-3 py-0.5 text-base font-semibold ${pillTones[tone]}`}>
      {children}
    </span>
  );
}

export function StatusLine({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "red" | "green" | "amber" }) {
  const c = { cyan: "border-cyan-400 text-cyan-100", red: "border-red-400 text-red-200", green: "border-emerald-400 text-emerald-100", amber: "border-amber-400 text-amber-100" }[tone];
  return (
    <p aria-live="polite" className={`rounded-lg border-l-8 bg-navy-800 px-4 py-3 text-xl font-medium ${c}`}>
      {children}
    </p>
  );
}

export function Timeline({ items }: { items: { when: string; what: string }[] }) {
  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map((i) => (
        <li key={i.when} className="flex items-center gap-2 text-lg">
          <span className="h-3 w-3 rounded-full bg-cyan-400" />
          <b className="text-cyan-300">{i.when}</b>
          <span className="text-slate-200">{i.what}</span>
        </li>
      ))}
    </ol>
  );
}

export function nowTime(): string {
  return new Date().toLocaleTimeString("en-GB");
}

