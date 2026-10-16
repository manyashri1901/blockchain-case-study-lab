import { ExternalLink } from "lucide-react";
import { Card } from "../components/ui";

const ROWS: [string, string, string][] = [
  ["Sector", "Shipping & Logistics", "Financial market infrastructure"],
  ["Purpose", "Shared digital platform for shipping documents and events", "Replace the CHESS clearing and settlement system"],
  ["Main challenge", "Industry adoption and collaboration", "Delivery, testing and governance"],
  ["Outcome", "Discontinued (offline by end of Q1 2023)", "Original project paused (17 Nov 2022)"],
  ["Money lost", "Not publicly disclosed", "A$245-255 million written off before tax"],
  ["Key lesson", "Competitors will not all join a platform run by one rival", "Critical systems need strong project control and early testing"],
];

const LESSONS = [
  "Technology alone does not guarantee success.",
  "Participants need incentives to collaborate.",
  "Critical systems need strong governance.",
  "Complex projects need rigorous testing and realistic milestones.",
  "Failure of one project does not prove blockchain itself is ineffective.",
];

const SOURCES = [
  "https://www.maersk.com/tr-tr/news/articles/2022/11/29/maersk-and-ibm-to-discontinue-tradelens",
  "https://www.supplychaindive.com/news/Maersk-IBM-shut-down-TradeLens/637580/",
  "https://piernext.portdebarcelona.cat/?p=9782",
  "https://www.thetradenews.com/asx-scraps-dlt-post-trade-project-after-six-years-as-once-heralded-initiative-leaves-behind-a-trail-of-failings/",
  "https://www2.arnnet.com.au/article/703426/misaligned-views-led-towards-250m-asx-chess-project-failure/",
  "https://ia.acs.org.au/article/2022/asx-scraps-blockchain-project-after-7yrs-and--250m.html",
  "https://www.asic.gov.au/about-asic/news-centre/find-a-media-release/2026-releases/26-119mr-asx-admits-misleading-conduct-relating-to-chess-replacement-project",
];

export default function Analysis() {
  return (
    <div className="space-y-4">
      <h2 className="text-4xl font-extrabold">Two projects. Two different failure mechanisms.</h2>
      <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-navy-600 text-left text-xl">
        <thead className="bg-navy-800 text-cyan-300">
          <tr>
            <th className="p-3"></th>
            <th className="p-3">TradeLens</th>
            <th className="p-3">ASX CHESS replacement</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([k, a, b]) => (
            <tr key={k} className="bg-navy-900">
              <td className="border-t border-navy-700 p-3 font-bold text-slate-300">{k}</td>
              <td className="border-t border-navy-700 p-3">{a}</td>
              <td className="border-t border-navy-700 p-3">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Card title="Shared lessons">
        <ol className="space-y-2 text-2xl">
          {LESSONS.map((l, i) => (
            <li key={l} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400 font-bold text-navy-950">{i + 1}</span>
              {l}
            </li>
          ))}
        </ol>
      </Card>
      <footer>
        <h3 className="mb-1 text-lg font-bold text-cyan-300">Sources</h3>
        <ul className="space-y-0.5 text-sm">
          {SOURCES.map((u) => (
            <li key={u}>
              <a href={u} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all text-cyan-300 underline hover:text-cyan-200">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {u}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
