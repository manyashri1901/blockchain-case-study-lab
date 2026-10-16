import { ArrowRight, Landmark, Ship } from "lucide-react";
import { Disclaimer, Pill } from "../components/ui";

interface Props {
  open: (id: "tradelens" | "chess") => void;
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-xl">
      <span className="w-32 shrink-0 text-slate-400">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}

export default function Overview({ open }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-5xl font-extrabold">Blockchain Case Study Lab: When Blockchain Projects Fail</h1>
        <p className="mt-3 text-3xl text-cyan-300">Explore the technology. Simulate failure. Discover the lessons.</p>
      </div>
      <Disclaimer />
      <div className="grid grid-cols-2 gap-5">
        <button
          onClick={() => open("tradelens")}
          className="space-y-4 rounded-2xl border-2 border-navy-600 bg-navy-900 p-6 text-left transition hover:border-cyan-400"
        >
          <Ship className="h-12 w-12 text-cyan-400" />
          <h2 className="text-3xl font-extrabold">TradeLens</h2>
          <Row k="Sector" v="Shipping & Logistics" />
          <Row k="Challenge" v="Industry adoption" />
          <Row k="Status" v={<Pill tone="red">Discontinued</Pill>} />
          <p className="flex items-center gap-2 text-xl font-semibold text-cyan-300">
            Open simulator <ArrowRight className="h-6 w-6" />
          </p>
        </button>
        <button
          onClick={() => open("chess")}
          className="space-y-4 rounded-2xl border-2 border-navy-600 bg-navy-900 p-6 text-left transition hover:border-cyan-400"
        >
          <Landmark className="h-12 w-12 text-cyan-400" />
          <h2 className="text-3xl font-extrabold">ASX CHESS replacement</h2>
          <Row k="Sector" v="Financial market infrastructure" />
          <Row k="Challenge" v="Delivery and governance" />
          <Row k="Status" v={<Pill tone="amber">Original project paused</Pill>} />
          <p className="flex items-center gap-2 text-xl font-semibold text-cyan-300">
            Open simulator <ArrowRight className="h-6 w-6" />
          </p>
        </button>
      </div>
    </div>
  );
}
