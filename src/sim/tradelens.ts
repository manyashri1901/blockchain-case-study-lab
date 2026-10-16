// Pure TradeLens simulator logic. Fictional data; not a real blockchain.

export const STAGES = ["EXPORTER", "PORT", "CUSTOMS", "IMPORTER"] as const;

export type ParticipantId = "exporter" | "shipping" | "port" | "customs" | "importer";

export interface Participant {
  id: ParticipantId;
  name: string;
  connected: boolean;
}

export interface Doc {
  id: string;
  name: string;
  owner: ParticipantId;
  status: "Pending" | "Verified";
  note: string;
}

export interface LedgerRecord {
  id: string;
  event: string;
  participant: string;
  status: string;
}

export interface TLEvent {
  at: string;
  text: string;
}

export interface TLState {
  stage: number;
  participants: Participant[];
  docs: Doc[];
  ledger: LedgerRecord[];
  events: TLEvent[];
  message: string;
  scriptStep: number;
  stepLabel: string;
}

export type TLAction =
  | { type: "advance"; at: string }
  | { type: "verify"; at: string }
  | { type: "disconnect"; at: string }
  | { type: "reconnect"; at: string }
  | { type: "next"; at: string }
  | { type: "reset" };

export const SHIPPING: ParticipantId = "shipping";
export const MISSING = "Missing: participant disconnected";

export const SHIPMENT = {
  id: "TL-2026-1042",
  container: "CONT-78421",
  route: "Shanghai to Rotterdam",
  cargo: "Electronics",
  carrier: "Demo Ocean Logistics",
};

export const NETWORK_MESSAGE =
  "Network participation has decreased. Existing records remain available, but future updates from the disconnected participant stop. Reduced participation weakens the completeness and value of the platform.";

export const SCRIPT_LABELS = [
  "Shipment advances to the next stage",
  "Documents verified (simulated status) for connected owners",
  "Shipping company disconnects from the network",
  "Shipment advances, but the vessel update is missing",
  "Shipment advances again, still without vessel updates",
];

const STAGE_PARTICIPANT: ParticipantId[] = ["exporter", "port", "customs", "importer"];

export function initialTLState(): TLState {
  return {
    stage: 0,
    participants: [
      { id: "exporter", name: "Exporter", connected: true },
      { id: "shipping", name: "Shipping company", connected: true },
      { id: "port", name: "Port authority", connected: true },
      { id: "customs", name: "Customs authority", connected: true },
      { id: "importer", name: "Importer", connected: true },
    ],
    docs: [
      { id: "bol", name: "Bill of Lading", owner: "shipping", status: "Pending", note: "" },
      { id: "cd", name: "Customs Declaration", owner: "customs", status: "Pending", note: "" },
      { id: "pl", name: "Packing List", owner: "exporter", status: "Pending", note: "" },
    ],
    ledger: [
      { id: "REC-001", event: "Shipment booked", participant: "Exporter", status: "Recorded" },
      { id: "REC-002", event: "Container loaded", participant: "Shipping company", status: "Recorded" },
      { id: "REC-003", event: "Packing list issued", participant: "Exporter", status: "Recorded" },
    ],
    events: [],
    message: "Shipment TL-2026-1042 is at the Exporter stage.",
    scriptStep: 0,
    stepLabel: "Press Next step to start the demo",
  };
}

export function connectedCount(s: TLState): number {
  return s.participants.filter((p) => p.connected).length;
}

export function isConnected(s: TLState, id: ParticipantId): boolean {
  return s.participants.find((p) => p.id === id)?.connected ?? false;
}

function nameOf(s: TLState, id: ParticipantId): string {
  return s.participants.find((p) => p.id === id)!.name;
}

function addRecord(s: TLState, event: string, who: ParticipantId): TLState {
  const status = isConnected(s, who) ? "Recorded" : MISSING;
  const id = `REC-${String(s.ledger.length + 1).padStart(3, "0")}`;
  return { ...s, ledger: [...s.ledger, { id, event, participant: nameOf(s, who), status }] };
}

function addEvent(s: TLState, at: string, text: string): TLState {
  return { ...s, events: [{ at, text }, ...s.events], message: text };
}

function advance(s: TLState, at: string): TLState {
  if (s.stage >= STAGES.length - 1) return { ...s, message: "Shipment is already at the final stage." };
  const stage = s.stage + 1;
  let n: TLState = { ...s, stage };
  n = addRecord(n, `Shipment arrived at ${STAGES[stage]}`, STAGE_PARTICIPANT[stage]);
  n = addRecord(n, "Vessel status update", SHIPPING);
  const missing = !isConnected(n, SHIPPING);
  return addEvent(
    n,
    at,
    missing
      ? `Moved to ${STAGES[stage]}. Vessel update missing: shipping company disconnected.`
      : `Moved to ${STAGES[stage]}. Vessel update recorded.`,
  );
}

function verify(s: TLState, at: string): TLState {
  let n = s;
  let verified = 0;
  let pending = 0;
  const docs = s.docs.map((d) => {
    if (d.status === "Verified") return d;
    if (isConnected(s, d.owner)) {
      verified++;
      return { ...d, status: "Verified" as const, note: "Simulated status only" };
    }
    pending++;
    return { ...d, note: `Owner (${nameOf(s, d.owner)}) is disconnected` };
  });
  n = { ...n, docs };
  for (const d of docs) {
    const was = s.docs.find((x) => x.id === d.id)!;
    if (was.status === "Pending" && d.status === "Verified") {
      n = addRecord(n, `${d.name} verified (simulated)`, d.owner);
    }
  }
  const text =
    verified === 0 && pending === 0
      ? "All documents already verified (simulated status)."
      : `Verified ${verified} document(s), ${pending} pending (simulated status).`;
  return addEvent(n, at, text);
}

function setConnected(s: TLState, at: string, connected: boolean): TLState {
  if (isConnected(s, SHIPPING) === connected) {
    return { ...s, message: connected ? "Shipping company is already connected." : "Shipping company is already disconnected." };
  }
  const participants = s.participants.map((p) => (p.id === SHIPPING ? { ...p, connected } : p));
  const n = { ...s, participants };
  return addEvent(n, at, connected ? "Shipping company reconnected. Progress and history kept." : "Shipping company disconnected from the network.");
}

export function tlReducer(s: TLState, a: TLAction): TLState {
  switch (a.type) {
    case "advance":
      return advance(s, a.at);
    case "verify":
      return verify(s, a.at);
    case "disconnect":
      return setConnected(s, a.at, false);
    case "reconnect":
      return setConnected(s, a.at, true);
    case "reset":
      return initialTLState();
    case "next": {
      if (s.scriptStep >= SCRIPT_LABELS.length) {
        return { ...s, message: "Demo complete. Press R to reset." };
      }
      const i = s.scriptStep;
      const run: TLAction["type"][] = ["advance", "verify", "disconnect", "advance", "advance"];
      const after = tlReducer(s, { type: run[i], at: a.at } as TLAction);
      return {
        ...after,
        scriptStep: i + 1,
        stepLabel: `Step ${i + 1} of ${SCRIPT_LABELS.length}: ${SCRIPT_LABELS[i]}`,
      };
    }
  }
}

