import { describe, expect, it } from "vitest";
import {
  initialTLState, tlReducer, connectedCount, MISSING, SCRIPT_LABELS as TL_STEPS, type TLState, type TLAction,
} from "./tradelens";
import {
  initialChessState, chessReducer, transactionValue, inputValue, validateTrade, formatAUD,
  SCRIPT_LABELS as CH_STEPS, type ChessState, type ChessAction,
} from "./chess";

const at = "10:00:00";
const tl = (s: TLState, ...a: TLAction[]) => a.reduce(tlReducer, s);
const ch = (s: ChessState, ...a: ChessAction[]) => a.reduce(chessReducer, s);

describe("TradeLens", () => {
  it("advancing creates ledger entries and moves the stage", () => {
    const s0 = initialTLState();
    const s1 = tl(s0, { type: "advance", at });
    expect(s1.stage).toBe(1);
    expect(s1.ledger.length).toBe(s0.ledger.length + 2);
    expect(s1.ledger.at(-1)).toMatchObject({ event: "Vessel status update", status: "Recorded" });
    expect(s1.events[0].at).toBe(at);
  });

  it("stops at the final stage", () => {
    const s = tl(initialTLState(), ...Array(6).fill({ type: "advance", at }));
    expect(s.stage).toBe(3);
    expect(s.ledger.length).toBe(3 + 3 * 2);
  });

  it("verifying only affects documents with connected owners", () => {
    const s = tl(initialTLState(), { type: "disconnect", at }, { type: "verify", at });
    const byId = Object.fromEntries(s.docs.map((d) => [d.id, d]));
    expect(byId.bol.status).toBe("Pending");
    expect(byId.bol.note).toMatch(/disconnected/);
    expect(byId.cd.status).toBe("Verified");
    expect(byId.pl.status).toBe("Verified");
  });

  it("disconnecting keeps history and marks later vessel updates missing", () => {
    const s1 = tl(initialTLState(), { type: "advance", at });
    const s2 = tl(s1, { type: "disconnect", at });
    expect(s2.ledger).toEqual(s1.ledger);
    expect(connectedCount(s2)).toBe(4);
    const s3 = tl(s2, { type: "advance", at });
    expect(s3.ledger.at(-1)).toMatchObject({ event: "Vessel status update", status: MISSING });
  });

  it("reconnecting keeps progress and history", () => {
    const s = tl(initialTLState(), { type: "advance", at }, { type: "disconnect", at }, { type: "advance", at });
    const r = tl(s, { type: "reconnect", at });
    expect(connectedCount(r)).toBe(5);
    expect(r.stage).toBe(s.stage);
    expect(r.ledger).toEqual(s.ledger);
  });

  it("reset restores the initial state", () => {
    const s = tl(initialTLState(), { type: "advance", at }, { type: "disconnect", at }, { type: "verify", at }, { type: "reset" });
    expect(s).toEqual(initialTLState());
  });

  it("scripted demo runs all steps", () => {
    let s = initialTLState();
    for (let i = 0; i < TL_STEPS.length; i++) s = tl(s, { type: "next", at });
    expect(s.scriptStep).toBe(TL_STEPS.length);
    expect(s.stage).toBe(3);
    expect(connectedCount(s)).toBe(4);
    expect(s.stepLabel).toMatch(/^Step 5 of 5/);
  });
});

describe("CHESS", () => {
  it("value = shares x price", () => {
    expect(transactionValue(100, 50)).toBe(5000);
    expect(formatAUD(5000)).toBe("A$5,000.00");
    expect(inputValue(initialChessState().inputs)).toBe(5000);
    expect(inputValue({ ...initialChessState().inputs, shares: "x" })).toBeNull();
  });

  it("matching does not move shares", () => {
    const s = ch(initialChessState(), { type: "match" });
    expect(s.current?.stage).toBe(1);
    expect(s.buyerShares).toBe(20);
    expect(s.sellerShares).toBe(150);
    expect(s.history[0].status).toBe("Matched");
  });

  it("successful settlement moves shares exactly once", () => {
    const p: ChessAction = { type: "process" };
    const s = ch(initialChessState(), { type: "match" }, p, p, p);
    expect(s.buyerShares).toBe(120);
    expect(s.sellerShares).toBe(50);
    expect(s.history[0].status).toBe("Settled");
    const again = ch(s, p, p);
    expect(again.buyerShares).toBe(120);
    expect(again.sellerShares).toBe(50);
  });

  it("balances change only on the final stage", () => {
    const p: ChessAction = { type: "process" };
    const s = ch(initialChessState(), { type: "match" }, p, p);
    expect(s.current?.stage).toBe(3);
    expect(s.buyerShares).toBe(20);
  });

  it("failed settlement leaves balances unchanged and is never shown as settled", () => {
    const p: ChessAction = { type: "process" };
    const s = ch(initialChessState(), { type: "match" }, p, { type: "fail" });
    expect(s.current?.failed).toBe(true);
    expect(s.buyerShares).toBe(20);
    expect(s.sellerShares).toBe(150);
    expect(s.history[0].status).toBe("Failed");
    expect(ch(s, p, p, p).buyerShares).toBe(20);
  });

  it("failure is unavailable before matching and after settlement", () => {
    expect(ch(initialChessState(), { type: "fail" }).current).toBeNull();
    const p: ChessAction = { type: "process" };
    const done = ch(initialChessState(), { type: "match" }, p, p, p, { type: "fail" });
    expect(done.history[0].status).toBe("Settled");
  });

  it("retry creates a new transaction and keeps the failed one", () => {
    const s = ch(initialChessState(), { type: "match" }, { type: "fail" }, { type: "retry" });
    expect(s.history.map((h) => h.status)).toEqual(["Failed", "Matched"]);
    expect(s.history[0].id).not.toBe(s.history[1].id);
    expect(s.current?.stage).toBe(1);
  });

  it("seller cannot sell more than they own", () => {
    let s = ch(initialChessState(), { type: "input", field: "shares", value: "151" });
    expect(validateTrade(s.inputs, s.sellerShares)[0]).toMatch(/cannot sell 151/);
    s = ch(s, { type: "match" });
    expect(s.current).toBeNull();
    expect(s.history).toHaveLength(0);
  });

  it("validates shares and price", () => {
    const base = initialChessState().inputs;
    expect(validateTrade({ ...base, shares: "0" }, 150)).not.toHaveLength(0);
    expect(validateTrade({ ...base, shares: "2.5" }, 150)).not.toHaveLength(0);
    expect(validateTrade({ ...base, price: "0" }, 150)).not.toHaveLength(0);
    expect(validateTrade({ ...base, price: "-3" }, 150)).not.toHaveLength(0);
    expect(validateTrade(base, 150)).toHaveLength(0);
  });

  it("reset restores everything", () => {
    const p: ChessAction = { type: "process" };
    const s = ch(initialChessState(), { type: "input", field: "price", value: "9" }, { type: "match" }, p, p, p, { type: "reset" });
    expect(s).toEqual(initialChessState());
  });

  it("scripted demo ends in a failed second transaction", () => {
    let s = initialChessState();
    for (let i = 0; i < CH_STEPS.length; i++) s = ch(s, { type: "next" });
    expect(s.scriptStep).toBe(CH_STEPS.length);
    expect(s.history).toHaveLength(1);
    expect(s.history[0].status).toBe("Failed");
    expect(s.buyerShares).toBe(20);
  });
});
