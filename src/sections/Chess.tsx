import { useEffect, useReducer } from "react";
import { AlertTriangle, Check, GitMerge, Play, RefreshCw, RotateCcw, Zap, FastForward } from "lucide-react";
import {
  chessReducer, initialChessState, LIFECYCLE, SCRIPT_LABELS, FAILURE_MESSAGE, INITIAL_BUYER_SHARES, INITIAL_SELLER_SHARES,
  inputValue, formatAUD, validateTrade, stageStatuses, isInProgress, type Inputs, type StageStatus,
} from "../sim/chess";
import { Btn, Card, Disclaimer, Pill, StatusLine, Timeline } from "../components/ui";
import type { useSimControls } from "../useSimControls";

const stageTone: Record<StageStatus, "green" | "amber" | "red" | "cyan" | "slate"> = {
  Ready: "cyan",
  Waiting: "slate",
  "In progress": "amber",
  Complete: "green",
  Failed: "red",
};

function Field({ label, value, onChange, disabled, mono }: { label: string; value: string; onChange: (v: string) => void; disabled: boolean; mono?: boolean }) {
  return (
    <label className="block text-base text-slate-300">
      {label}
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xl text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50 ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}

export default function Chess({ control }: { control: ReturnType<typeof useSimControls> }) {
  const [s, dispatch] = useReducer(chessReducer, undefined, initialChessState);
  const c = s.current;
  const locked = isInProgress(s);
  const statuses = stageStatuses(s);
  const value = inputValue(s.inputs);
  const errors = validateTrade(s.inputs, s.sellerShares);
  const failed = !!c?.failed;
  const settled = !!c && !c.failed && c.stage === 4;
  const stepsDone = s.scriptStep >= SCRIPT_LABELS.length;

  useEffect(() => {
    control.register("chess", { next: () => dispatch({ type: "next" }), reset: () => dispatch({ type: "reset" }) });
  }, [control]);

  const set = (field: keyof Inputs) => (value: string) => dispatch({ type: "input", field, value });
  const rows = [
    { name: s.inputs.buyer, initial: INITIAL_BUYER_SHARES, current: s.buyerShares },
    { name: s.inputs.seller, initial: INITIAL_SELLER_SHARES, current: s.sellerShares },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-3xl font-extrabold">ASX CHESS Simulator</h2>
        <Pill tone="amber">FICTIONAL TRANSACTION</Pill>
        <span className="text-lg text-slate-300">Fictional transaction, not live market data</span>
      </div>
      <Disclaimer />

      <div className="flex flex-wrap items-center gap-3">
        <Btn tone="cyan" disabled={stepsDone} onClick={() => dispatch({ type: "next" })} icon={<Play className="h-5 w-5" />}>
          Next step (N)
        </Btn>
        <span className="text-xl font-semibold text-cyan-200">{s.stepLabel}</span>
      </div>

      <StatusLine tone={failed ? "red" : settled ? "green" : "cyan"}>{s.message}</StatusLine>

      <Card title="Lifecycle">
        <div className="flex items-stretch gap-2">
          {LIFECYCLE.map((name, i) => (
            <div
              key={name}
              className={`flex-1 rounded-lg border-2 px-2 py-3 text-center ${
                statuses[i] === "Failed"
                  ? "border-red-400 bg-red-500/10"
                  : statuses[i] === "Complete"
                    ? "border-emerald-400 bg-emerald-400/10"
                    : statuses[i] === "In progress"
                      ? "border-amber-400 bg-amber-400/10"
                      : statuses[i] === "Ready"
                        ? "border-cyan-400"
                        : "border-navy-600"
              }`}
            >
              <div className="text-lg font-bold">{name}</div>
              <div className="mt-1">
                <Pill tone={stageTone[statuses[i]]}>{statuses[i] === "Failed" ? "Failed" : statuses[i]}</Pill>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Btn tone="cyan" disabled={locked} onClick={() => dispatch({ type: "match" })} icon={<GitMerge className="h-5 w-5" />}>
          Match Buyer & Seller
        </Btn>
        <Btn tone="green" disabled={!c || failed || settled} onClick={() => dispatch({ type: "process" })} icon={<FastForward className="h-5 w-5" />}>
          Process Settlement
        </Btn>
        <Btn tone="red" disabled={!locked} onClick={() => dispatch({ type: "fail" })} icon={<Zap className="h-5 w-5" />}>
          Simulate System Failure
        </Btn>
        <Btn tone="amber" disabled={!failed} onClick={() => dispatch({ type: "retry" })} icon={<RefreshCw className="h-5 w-5" />}>
          Retry
        </Btn>
        <Btn onClick={() => dispatch({ type: "reset" })} icon={<RotateCcw className="h-5 w-5" />}>
          Reset Transaction
        </Btn>
      </div>

      {failed && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-red-400 bg-red-500/10 px-4 py-3 text-lg text-red-100">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" />
          <p>
            <b>Failed at {c!.failedAt}.</b> {FAILURE_MESSAGE}
          </p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-3">
        <Card title="Trade" className="col-span-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Buyer" value={s.inputs.buyer} onChange={set("buyer")} disabled={locked} />
            <Field label="Seller" value={s.inputs.seller} onChange={set("seller")} disabled={locked} />
            <Field label="Ticker" value={s.inputs.ticker} onChange={set("ticker")} disabled={locked} mono />
            <Field label="Shares" value={s.inputs.shares} onChange={set("shares")} disabled={locked} mono />
            <Field label="Price (A$)" value={s.inputs.price} onChange={set("price")} disabled={locked} mono />
            <div className="text-base text-slate-300">
              Transaction value
              <div className="mt-1 text-3xl font-extrabold text-cyan-300">{value === null ? "n/a" : formatAUD(value)}</div>
            </div>
          </div>
          {errors.length > 0 && !locked && (
            <p className="mt-3 flex items-center gap-2 text-lg font-medium text-red-300">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {errors[0]}
            </p>
          )}
          {locked && <p className="mt-3 text-base text-slate-400">Inputs are locked while the transaction is in progress.</p>}
        </Card>

        <Card title="Balances (shares)" className="col-span-7">
          <table className="w-full text-left text-xl">
            <thead className="text-cyan-300">
              <tr>
                <th className="py-1">Holder</th>
                <th>Initial</th>
                <th>Change</th>
                <th>Current</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const d = r.current - r.initial;
                return (
                  <tr key={r.name} className="border-t border-navy-700">
                    <td className="py-2">{r.name}</td>
                    <td>{r.initial}</td>
                    <td className={d > 0 ? "text-emerald-300" : d < 0 ? "text-red-300" : "text-slate-400"}>{d > 0 ? `+${d}` : d}</td>
                    <td className="font-bold">{r.current}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 flex items-center gap-2 text-base text-slate-400">
            <Check className="h-4 w-4" /> Ownership changes only after successful settlement, once per transaction.
          </p>
        </Card>

        <Card title="Transaction history" className="col-span-12">
          <table className="w-full text-left text-lg">
            <thead className="text-cyan-300">
              <tr>
                <th className="py-1">Transaction ID</th>
                <th>Buyer</th>
                <th>Seller</th>
                <th>Shares</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {s.history.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-2 text-slate-400">No transactions yet.</td>
                </tr>
              )}
              {s.history.map((h) => (
                <tr key={h.id} className="border-t border-navy-700">
                  <td className="py-1 font-mono">{h.id}</td>
                  <td>{h.buyer}</td>
                  <td>{h.seller}</td>
                  <td>{h.shares}</td>
                  <td>{formatAUD(h.value)}</td>
                  <td>
                    <Pill tone={h.status === "Settled" ? "green" : h.status === "Failed" ? "red" : "amber"}>
                      {h.status === "Failed" ? `Failed at ${h.failedAt}` : h.status}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Why the CHESS replacement was paused" className="col-span-12">
          <ul className="list-disc space-y-1 pl-6 text-lg">
            <li>Work with Digital Asset began around 2016 (sources vary between 2015 and 2017).</li>
            <li>Aug 2022: Accenture engaged for an independent review. 17 Nov 2022: ASX paused the original project and wrote off about A$245-255 million before tax.</li>
            <li>Review findings: weak execution and siloed reporting between ASX and the vendor, poor testing strategy, conflicting requirements; after four years just over 60% was handed over for testing and most performance features were unbuilt.</li>
            <li>June 2026: ASX admitted to ASIC that its Feb 2022 "progressing well" announcement was misleading; a A$20.5 million penalty is proposed, subject to Federal Court approval.</li>
          </ul>
          <p className="mt-2 text-lg text-slate-300">This was a failure of a specific project and its execution, not proof that blockchain itself failed.</p>
          <p className="mt-2 text-2xl font-bold text-cyan-200">A critical system needs strong project control and early testing of speed and scale.</p>
          <div className="mt-3">
            <Timeline
              items={[
                { when: "Around 2016", what: "Start" },
                { when: "Aug 2022", what: "Accenture review" },
                { when: "17 Nov 2022", what: "Paused and written off" },
                { when: "Jun 2026", what: "ASIC admission" },
              ]}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
