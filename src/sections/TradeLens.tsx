import { useEffect, useReducer } from "react";
import { ArrowRight, Check, Play, PlugZap, RotateCcw, Unplug, FileCheck2 } from "lucide-react";
import { tlReducer, initialTLState, STAGES, SHIPMENT, SCRIPT_LABELS, NETWORK_MESSAGE, connectedCount, isConnected, SHIPPING } from "../sim/tradelens";
import { Btn, Card, Disclaimer, Pill, StatusLine, Timeline, nowTime } from "../components/ui";
import { useSimControls } from "../useSimControls";

export default function TradeLens({ control }: { control: ReturnType<typeof useSimControls> }) {
  const [s, dispatch] = useReducer(tlReducer, undefined, initialTLState);
  const done = s.stage >= STAGES.length - 1;
  const shippingOn = isConnected(s, SHIPPING);
  const stepsDone = s.scriptStep >= SCRIPT_LABELS.length;

  useEffect(() => {
    control.register("tradelens", {
      next: () => dispatch({ type: "next", at: nowTime() }),
      reset: () => dispatch({ type: "reset" }),
    });
  }, [control]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-3xl font-extrabold">TradeLens Simulator</h2>
        <Pill tone="amber">SIMULATED DATA</Pill>
        <span className="text-lg text-slate-300">
          {SHIPMENT.id} · {SHIPMENT.container} · {SHIPMENT.route} · {SHIPMENT.cargo} · {SHIPMENT.carrier}
        </span>
      </div>
      <Disclaimer />

      <div className="flex flex-wrap items-center gap-3">
        <Btn tone="cyan" disabled={stepsDone} onClick={() => dispatch({ type: "next", at: nowTime() })} icon={<Play className="h-5 w-5" />}>
          Next step (N)
        </Btn>
        <span className="text-xl font-semibold text-cyan-200">{s.stepLabel}</span>
      </div>

      <StatusLine tone={shippingOn ? "cyan" : "amber"}>{s.message}</StatusLine>

      <div className="grid grid-cols-12 gap-3">
        <Card title="Route" className="col-span-12">
          <div className="flex items-center gap-2">
            {STAGES.map((st, i) => (
              <div key={st} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex-1 rounded-lg border-2 px-3 py-3 text-center text-xl font-bold ${
                    i === s.stage
                      ? "border-cyan-400 bg-cyan-400/20 text-cyan-200"
                      : i < s.stage
                        ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
                        : "border-navy-600 text-slate-400"
                  }`}
                >
                  {i < s.stage && <Check className="mr-1 inline h-5 w-5" />}
                  {st}
                </div>
                {i < STAGES.length - 1 && <ArrowRight className="h-6 w-6 text-slate-400" />}
              </div>
            ))}
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-navy-700">
            <div className="h-full bg-cyan-400 transition-all" style={{ width: `${((s.stage + 1) / STAGES.length) * 100}%` }} />
          </div>
        </Card>

        <div className="col-span-12 flex flex-wrap gap-3">
          <Btn tone="cyan" disabled={done} onClick={() => dispatch({ type: "advance", at: nowTime() })} icon={<ArrowRight className="h-5 w-5" />}>
            Advance Shipment
          </Btn>
          <Btn tone="green" onClick={() => dispatch({ type: "verify", at: nowTime() })} icon={<FileCheck2 className="h-5 w-5" />}>
            Verify Documents
          </Btn>
          <Btn tone="red" disabled={!shippingOn} onClick={() => dispatch({ type: "disconnect", at: nowTime() })} icon={<Unplug className="h-5 w-5" />}>
            Disable Major Participant
          </Btn>
          <Btn tone="amber" disabled={shippingOn} onClick={() => dispatch({ type: "reconnect", at: nowTime() })} icon={<PlugZap className="h-5 w-5" />}>
            Reconnect Participant
          </Btn>
          <Btn onClick={() => dispatch({ type: "reset" })} icon={<RotateCcw className="h-5 w-5" />}>
            Reset Shipment
          </Btn>
        </div>

        {!shippingOn && (
          <div className="col-span-12 rounded-lg border-2 border-red-400 bg-red-500/10 px-4 py-3 text-lg text-red-100">{NETWORK_MESSAGE}</div>
        )}

        <Card title="Participants" className="col-span-5" right={<Pill tone={shippingOn ? "green" : "red"}>Participants connected: {connectedCount(s)} of 5 (illustrative)</Pill>}>
          <ul className="space-y-1.5">
            {s.participants.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-lg">
                <span>{p.name}</span>
                <Pill tone={p.connected ? "green" : "red"}>{p.connected ? "Connected" : "Disconnected"}</Pill>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Documents" className="col-span-7">
          <ul className="space-y-1.5">
            {s.docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 text-lg">
                <span>
                  {d.name} <span className="text-slate-400">· owner: {s.participants.find((p) => p.id === d.owner)!.name}</span>
                  {d.note && <span className="block text-base text-amber-300">{d.note}</span>}
                </span>
                <Pill tone={d.status === "Verified" ? "green" : "amber"}>{d.status}</Pill>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-base text-slate-400">Simulated status only. Not a digital signature or customs clearance.</p>
        </Card>

        <Card title="Simulated shared ledger, not a deployed blockchain" className="col-span-7">
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left text-lg">
              <thead className="sticky top-0 bg-navy-900 text-cyan-300">
                <tr>
                  <th className="py-1 pr-2">Record ID</th>
                  <th className="pr-2">Event</th>
                  <th className="pr-2">Participant</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {s.ledger.map((r) => (
                  <tr key={r.id} className="border-t border-navy-700">
                    <td className="py-1 pr-2 font-mono">{r.id}</td>
                    <td className="pr-2">{r.event}</td>
                    <td className="pr-2">{r.participant}</td>
                    <td className={r.status === "Recorded" ? "text-emerald-300" : "font-semibold text-red-300"}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Event log" className="col-span-5">
          <ul className="max-h-64 space-y-1 overflow-y-auto text-base">
            {s.events.length === 0 && <li className="text-slate-400">No events yet.</li>}
            {s.events.map((e, i) => (
              <li key={i}>
                <span className="font-mono text-cyan-300">{e.at}</span> {e.text}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Why TradeLens was discontinued" className="col-span-12">
          <ul className="list-disc space-y-1 pl-6 text-lg">
            <li>Launched by Maersk and IBM in 2018; MSC and CMA CGM joined in 2019 after governance changes.</li>
            <li>Discontinuation announced 29 Nov 2022; platform to be offline by end of Q1 2023.</li>
            <li>
              Maersk said it "has not reached the level of commercial viability necessary to continue work" and that "the need for full global industry collaboration has not been achieved."
            </li>
            <li>Total financial loss: not publicly disclosed.</li>
          </ul>
          <p className="mt-3 text-2xl font-bold text-cyan-200">The technology worked, but competitors will not all join a platform run by one rival.</p>
          <div className="mt-3">
            <Timeline
              items={[
                { when: "2018", what: "Launch" },
                { when: "2019", what: "MSC and CMA CGM join" },
                { when: "29 Nov 2022", what: "Announcement" },
                { when: "Q1 2023", what: "Offline" },
              ]}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

