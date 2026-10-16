// Pure ASX CHESS simulator logic. Fictional data; not live market data.

export const LIFECYCLE = [
  "ORDER PLACED",
  "TRADE MATCHED",
  "CLEARING",
  "SETTLEMENT",
  "OWNERSHIP UPDATED",
] as const;

export const FAILURE_MESSAGE =
  "Settlement interrupted. Ownership has not changed. In real financial infrastructure, disruption could require investigation, reconciliation and recovery.";

export const INITIAL_BUYER_SHARES = 20;
export const INITIAL_SELLER_SHARES = 150;

export type TxStatus = "Matched" | "Clearing" | "Settlement" | "Settled" | "Failed";

export interface Inputs {
  buyer: string;
  seller: string;
  ticker: string;
  shares: string;
  price: string;
}

export interface Tx {
  id: string;
  buyer: string;
  seller: string;
  ticker: string;
  shares: number;
  price: number;
  value: number;
  stage: number; // 1..4 index into LIFECYCLE
  failed: boolean;
  failedAt?: string;
}

export interface HistoryRow {
  id: string;
  buyer: string;
  seller: string;
  shares: number;
  value: number;
  status: TxStatus;
  failedAt?: string;
}

export interface ChessState {
  inputs: Inputs;
  buyerShares: number;
  sellerShares: number;
  current: Tx | null;
  history: HistoryRow[];
  counter: number;
  message: string;
  scriptStep: number;
  stepLabel: string;
}

export type ChessAction =
  | { type: "input"; field: keyof Inputs; value: string }
  | { type: "match" }
  | { type: "process" }
  | { type: "fail" }
  | { type: "retry" }
  | { type: "next" }
  | { type: "reset" };

export const SCRIPT_LABELS = [
  "Buyer and seller matched, no ownership change",
  "Clearing begins",
  "Settlement stage reached",
  "Ownership updated, trade settled",
  "Transaction reset to the starting state",
  "New trade matched",
  "Clearing begins",
  "System failure: settlement interrupted, ownership unchanged",
];

const SCRIPT: ChessAction["type"][] = ["match", "process", "process", "process", "reset", "match", "process", "fail"];

export function initialChessState(): ChessState {
  return {
    inputs: { buyer: "Investor A", seller: "Investor B", ticker: "DEMO", shares: "100", price: "50.00" },
    buyerShares: INITIAL_BUYER_SHARES,
    sellerShares: INITIAL_SELLER_SHARES,
    current: null,
    history: [],
    counter: 0,
    message: "Enter a fictional trade, then match buyer and seller.",
    scriptStep: 0,
    stepLabel: "Press Next step to start the demo",
  };
}

/** Whole number of shares, or null when invalid. */
export function parseShares(v: string): number | null {
  const t = v.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n > 0 && Number.isSafeInteger(n) ? n : null;
}

export function parsePrice(v: string): number | null {
  const t = v.trim();
  if (!/^\d*\.?\d+$|^\d+\.$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Transaction value in AUD, rounded to cents. */
export function transactionValue(shares: number, price: number): number {
  return Math.round(shares * price * 100) / 100;
}

export function inputValue(inputs: Inputs): number | null {
  const sh = parseShares(inputs.shares);
  const pr = parsePrice(inputs.price);
  return sh === null || pr === null ? null : transactionValue(sh, pr);
}

export function formatAUD(n: number): string {
  return `A$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function validateTrade(inputs: Inputs, sellerShares: number): string[] {
  const errors: string[] = [];
  if (!inputs.buyer.trim() || !inputs.seller.trim()) errors.push("Buyer and seller names are required.");
  else if (inputs.buyer.trim().toLowerCase() === inputs.seller.trim().toLowerCase())
    errors.push("Buyer and seller must be different.");
  if (!inputs.ticker.trim()) errors.push("Ticker is required.");
  const sh = parseShares(inputs.shares);
  if (sh === null) errors.push("Shares must be a positive whole number.");
  if (parsePrice(inputs.price) === null) errors.push("Price must be above zero.");
  if (sh !== null && sh > sellerShares)
    errors.push(`${inputs.seller.trim() || "Seller"} owns only ${sellerShares} shares and cannot sell ${sh}.`);
  return errors;
}

export function txStatus(t: Tx): TxStatus {
  if (t.failed) return "Failed";
  return (["Matched", "Matched", "Clearing", "Settlement", "Settled"] as const)[t.stage] as TxStatus;
}

export function isInProgress(s: ChessState): boolean {
  return !!s.current && !s.current.failed && s.current.stage < 4;
}

export type StageStatus = "Ready" | "Waiting" | "In progress" | "Complete" | "Failed";

export function stageStatuses(s: ChessState): StageStatus[] {
  const c = s.current;
  return LIFECYCLE.map((_, i) => {
    if (!c) return i === 0 ? "Ready" : "Waiting";
    if (i < c.stage) return "Complete";
    if (i === c.stage) return c.failed ? "Failed" : c.stage === 4 ? "Complete" : "In progress";
    return "Waiting";
  });
}

function txId(n: number): string {
  return `TX-${String(n).padStart(4, "0")}`;
}

function upsertHistory(history: HistoryRow[], t: Tx): HistoryRow[] {
  const row: HistoryRow = {
    id: t.id,
    buyer: t.buyer,
    seller: t.seller,
    shares: t.shares,
    value: t.value,
    status: txStatus(t),
    failedAt: t.failedAt,
  };
  return history.some((h) => h.id === t.id) ? history.map((h) => (h.id === t.id ? row : h)) : [...history, row];
}

function startTx(s: ChessState, base: Omit<Tx, "id" | "stage" | "failed" | "failedAt">, verb: string): ChessState {
  const counter = s.counter + 1;
  const tx: Tx = { ...base, id: txId(counter), stage: 1, failed: false };
  return {
    ...s,
    counter,
    current: tx,
    history: upsertHistory(s.history, tx),
    message: `${verb} ${tx.id}: ${tx.buyer} buys ${tx.shares} ${tx.ticker} from ${tx.seller}. No ownership change yet.`,
  };
}

function match(s: ChessState): ChessState {
  if (isInProgress(s)) return { ...s, message: "A transaction is already in progress." };
  const errors = validateTrade(s.inputs, s.sellerShares);
  if (errors.length) return { ...s, message: errors[0] };
  const shares = parseShares(s.inputs.shares)!;
  const price = parsePrice(s.inputs.price)!;
  return startTx(
    s,
    {
      buyer: s.inputs.buyer.trim(),
      seller: s.inputs.seller.trim(),
      ticker: s.inputs.ticker.trim().toUpperCase(),
      shares,
      price,
      value: transactionValue(shares, price),
    },
    "Matched",
  );
}

function process(s: ChessState): ChessState {
  const c = s.current;
  if (!c) return { ...s, message: "Match buyer and seller first." };
  if (c.failed) return { ...s, message: "Transaction failed. Use Retry to start a new one." };
  if (c.stage >= 4) return { ...s, message: "Transaction is already settled." };
  const stage = c.stage + 1;
  if (stage < 4) {
    const t = { ...c, stage };
    return { ...s, current: t, history: upsertHistory(s.history, t), message: `${t.id}: ${LIFECYCLE[stage]}. Ownership unchanged.` };
  }
  // Final stage: re-check the seller still owns enough, then move shares exactly once.
  if (s.sellerShares < c.shares) {
    const t = { ...c, failed: true, failedAt: LIFECYCLE[c.stage] };
    return {
      ...s,
      current: t,
      history: upsertHistory(s.history, t),
      message: `${c.seller} no longer owns enough shares. Settlement failed, ownership unchanged.`,
    };
  }
  const t = { ...c, stage };
  return {
    ...s,
    current: t,
    buyerShares: s.buyerShares + c.shares,
    sellerShares: s.sellerShares - c.shares,
    history: upsertHistory(s.history, t),
    message: `${t.id} settled: ${c.shares} ${c.ticker} moved from ${c.seller} to ${c.buyer}.`,
  };
}

function fail(s: ChessState): ChessState {
  const c = s.current;
  if (!c || c.failed || c.stage >= 4) {
    return { ...s, message: "Failure can be simulated after matching and before settlement completes." };
  }
  const t = { ...c, failed: true, failedAt: LIFECYCLE[c.stage] };
  return { ...s, current: t, history: upsertHistory(s.history, t), message: FAILURE_MESSAGE };
}

function retry(s: ChessState): ChessState {
  const c = s.current;
  if (!c || !c.failed) return { ...s, message: "Retry is available after a failure." };
  if (s.sellerShares < c.shares) return { ...s, message: `${c.seller} no longer owns enough shares to retry.` };
  const { buyer, seller, ticker, shares, price, value } = c;
  return startTx(s, { buyer, seller, ticker, shares, price, value }, "Retry created");
}

export function chessReducer(s: ChessState, a: ChessAction): ChessState {
  switch (a.type) {
    case "input":
      if (isInProgress(s)) return { ...s, message: "Inputs are locked while a transaction is in progress." };
      return { ...s, inputs: { ...s.inputs, [a.field]: a.value } };
    case "match":
      return match(s);
    case "process":
      return process(s);
    case "fail":
      return fail(s);
    case "retry":
      return retry(s);
    case "reset":
      return initialChessState();
    case "next": {
      if (s.scriptStep >= SCRIPT.length) return { ...s, message: "Demo complete. Press R to reset." };
      const i = s.scriptStep;
      const after = chessReducer(s, { type: SCRIPT[i] } as ChessAction);
      return {
        ...after,
        scriptStep: i + 1,
        stepLabel: `Step ${i + 1} of ${SCRIPT.length}: ${SCRIPT_LABELS[i]}`,
      };
    }
  }
}
