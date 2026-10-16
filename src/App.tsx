import { useEffect, useState } from "react";
import { BarChart3, Home, Landmark, Maximize2, Minimize2, Ship } from "lucide-react";
import Overview from "./sections/Overview";
import TradeLens from "./sections/TradeLens";
import Chess from "./sections/Chess";
import Analysis from "./sections/Analysis";
import { useSimControls } from "./useSimControls";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "tradelens", label: "TradeLens Simulator", icon: Ship },
  { id: "chess", label: "ASX CHESS Simulator", icon: Landmark },
  { id: "analysis", label: "Failure Analysis", icon: BarChart3 },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

export default function App() {
  const [section, setSection] = useState<SectionId>("overview");
  const [presenting, setPresenting] = useState(false);
  const control = useSimControls();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k >= "1" && k <= "4") setSection(SECTIONS[Number(k) - 1].id);
      else if (k === "n") control.get(section)?.next();
      else if (k === "r") control.get(section)?.reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [section, control]);

  const show = (id: SectionId) => (section === id ? "" : "hidden");

  return (
    <div className="flex h-full flex-col">
      {!presenting && (
        <nav className="flex shrink-0 items-center gap-2 border-b border-navy-600 bg-navy-900 px-4 py-2">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-lg font-semibold ${
                section === s.id ? "bg-cyan-400 text-navy-950" : "text-slate-200 hover:bg-navy-700"
              }`}
            >
              <s.icon className="h-5 w-5" />
              {i + 1}. {s.label}
            </button>
          ))}
        </nav>
      )}
      <main className={`min-h-0 flex-1 overflow-y-auto ${presenting ? "px-10 py-5" : "px-6 py-4"}`}>
        <div className={`mx-auto ${presenting ? "max-w-none" : "max-w-[1700px]"}`}>
          <div className={show("overview")}>
            <Overview open={setSection} />
          </div>
          <div className={show("tradelens")}>
            <TradeLens control={control} />
          </div>
          <div className={show("chess")}>
            <Chess control={control} />
          </div>
          <div className={show("analysis")}>
            <Analysis />
          </div>
        </div>
      </main>
      <div className="flex shrink-0 items-center justify-between border-t border-navy-600 bg-navy-900 px-4 py-1.5 text-base text-slate-300">
        <span>
          <kbd className="rounded bg-navy-700 px-1.5">1-4</kbd> section · <kbd className="rounded bg-navy-700 px-1.5">N</kbd> next step ·{" "}
          <kbd className="rounded bg-navy-700 px-1.5">R</kbd> reset simulator
        </span>
        <button
          onClick={() => setPresenting((p) => !p)}
          className="flex items-center gap-2 rounded-lg border border-navy-600 px-3 py-1 font-semibold hover:bg-navy-700"
        >
          {presenting ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          Presentation Mode: {presenting ? "On" : "Off"}
        </button>
      </div>
    </div>
  );
}
