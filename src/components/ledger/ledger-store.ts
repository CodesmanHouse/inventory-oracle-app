import { useEffect, useState } from "react";

export type LedgerKind = "debtor" | "creditor";
export type EntryStatus = "draft" | "open" | "partial" | "paid" | "overdue" | "disputed";

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: "cash" | "mpesa" | "bank" | "cheque" | "card";
  reference?: string;
  note?: string;
}

export interface LedgerEntry {
  id: string;
  kind: LedgerKind;
  reference: string;          // INV-… for debtors, BILL-… for creditors
  partyName: string;          // customer or supplier
  partyRef?: string;          // their PO / quotation / invoice no
  issueDate: string;
  dueDate: string;
  amount: number;             // gross total
  currency: string;           // KES default
  paid: number;               // cumulative paid
  status: EntryStatus;
  notes?: string;
  payments: Payment[];
  promiseToPay?: string;      // user-pledged date
  tags: string[];
  createdAt: string;
}

const STORAGE = {
  debtor: "stackwise.ledger.debtor.v1",
  creditor: "stackwise.ledger.creditor.v1",
} as const;

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);

export function ageDays(e: LedgerEntry, today = todayISO()): number {
  return daysBetween(today, e.dueDate);
}

export function balance(e: LedgerEntry): number {
  return Math.max(0, e.amount - e.paid);
}

export function bucket(e: LedgerEntry): "current" | "1-30" | "31-60" | "61-90" | "90+" {
  const d = ageDays(e);
  if (d <= 0) return "current";
  if (d <= 30) return "1-30";
  if (d <= 60) return "31-60";
  if (d <= 90) return "61-90";
  return "90+";
}

export function computeStatus(e: Pick<LedgerEntry, "amount" | "paid" | "dueDate" | "status">): EntryStatus {
  if (e.status === "draft" || e.status === "disputed") return e.status;
  const bal = Math.max(0, e.amount - e.paid);
  if (bal === 0) return "paid";
  const overdue = new Date() > new Date(e.dueDate);
  if (e.paid > 0) return overdue ? "overdue" : "partial";
  return overdue ? "overdue" : "open";
}

function seed(kind: LedgerKind): LedgerEntry[] {
  const base = new Date();
  const offset = (days: number) =>
    new Date(base.getTime() + days * 86_400_000).toISOString().slice(0, 10);

  if (kind === "debtor") {
    return [
      mk("debtor", "INV-2026-0142", "Acme Holdings Ltd", "QT-3391", offset(-12), offset(18), 184500, 50000, ["retail"]),
      mk("debtor", "INV-2026-0141", "Coastline Foods", "QT-3380", offset(-45), offset(-15), 215000, 0, ["wholesale"]),
      mk("debtor", "INV-2026-0140", "Pinnacle Engineering", "QT-3387", offset(-80), offset(-50), 92700, 30000, ["project"]),
      mk("debtor", "INV-2026-0139", "Savanna Hotels", "QT-3370", offset(-100), offset(-70), 48200, 48200, []),
      mk("debtor", "INV-2026-0138", "Lakeside Logistics", "QT-3365", offset(-3), offset(27), 56300, 0, ["new"]),
    ];
  }
  return [
    mk("creditor", "BILL-2026-0088", "Global Supplies Co", "PO-1021", offset(-10), offset(20), 132400, 0, ["materials"]),
    mk("creditor", "BILL-2026-0087", "Rapid Logistics", "PO-1019", offset(-40), offset(-10), 28900, 10000, ["freight"]),
    mk("creditor", "BILL-2026-0086", "Power Grid Utility", undefined, offset(-65), offset(-35), 17800, 0, ["utility"]),
    mk("creditor", "BILL-2026-0085", "Office Plus Stationers", "PO-1015", offset(-95), offset(-65), 9600, 9600, []),
    mk("creditor", "BILL-2026-0084", "Atlas Manufacturing", "PO-1014", offset(-5), offset(25), 245000, 0, ["materials"]),
  ];
}

function mk(
  kind: LedgerKind,
  reference: string,
  partyName: string,
  partyRef: string | undefined,
  issueDate: string,
  dueDate: string,
  amount: number,
  paid: number,
  tags: string[],
): LedgerEntry {
  const entry: LedgerEntry = {
    id: crypto.randomUUID(),
    kind,
    reference,
    partyName,
    partyRef,
    issueDate,
    dueDate,
    amount,
    currency: "KES",
    paid,
    status: "open",
    payments: paid > 0 ? [{ id: crypto.randomUUID(), date: issueDate, amount: paid, method: "bank" }] : [],
    tags,
    createdAt: new Date().toISOString(),
  };
  entry.status = computeStatus(entry);
  return entry;
}

export function nextReference(kind: LedgerKind, list: LedgerEntry[]): string {
  const prefix = kind === "debtor" ? "INV" : "BILL";
  const nums = list
    .map((e) => parseInt(e.reference.split("-").pop() || "0", 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${new Date().getFullYear()}-${String(next).padStart(4, "0")}`;
}

export function useLedger(kind: LedgerKind) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const key = STORAGE[kind];

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      setEntries(raw ? (JSON.parse(raw) as LedgerEntry[]) : seed(kind));
    } catch {
      setEntries(seed(kind));
    }
  }, [key, kind]);

  const persist = (next: LedgerEntry[]) => {
    setEntries(next);
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(next));
  };

  return {
    entries,
    add: (e: LedgerEntry) => persist([{ ...e, status: computeStatus(e) }, ...entries]),
    update: (id: string, patch: Partial<LedgerEntry>) =>
      persist(
        entries.map((e) =>
          e.id === id ? { ...e, ...patch, status: computeStatus({ ...e, ...patch }) } : e,
        ),
      ),
    remove: (id: string) => persist(entries.filter((e) => e.id !== id)),
    pay: (id: string, payment: Payment) =>
      persist(
        entries.map((e) => {
          if (e.id !== id) return e;
          const updated = { ...e, paid: e.paid + payment.amount, payments: [payment, ...e.payments] };
          return { ...updated, status: computeStatus(updated) };
        }),
      ),
  };
}
