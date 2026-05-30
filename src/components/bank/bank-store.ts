// In-memory + localStorage bank store. Demo-only.
import { useEffect, useState, useCallback } from "react";

export type AccountStatus = "active" | "inactive";
export type Currency = "KES" | "USD" | "EUR" | "GBP";
export type DepositType = "cash" | "cheque" | "mobile_money";
export type WithdrawalType = "cash" | "cheque" | "transfer" | "mobile_money";
export type MobileProvider = "M-Pesa" | "Airtel Money" | "T-Kash";
export type TxnType = "deposit" | "withdrawal" | "transfer_in" | "transfer_out" | "charge" | "interest";

export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  swiftCode: string;
  currency: Currency;
  openingBalance: number;
  currentBalance: number;
  status: AccountStatus;
  color: string;
  createdAt: string;
}

export interface BankTxn {
  id: string;
  accountId: string;
  date: string;
  type: TxnType;
  subtype?: DepositType | WithdrawalType;
  reference: string; // receipt / cheque / mpesa code
  description: string;
  amount: number; // positive in, negative out
  party: string; // payer or payee
  mobileProvider?: MobileProvider;
  reconciled: boolean;
  createdAt: string;
}

export interface StatementLine {
  id: string;
  accountId: string;
  date: string;
  description: string;
  reference: string;
  amount: number; // signed
  matchedTxnId?: string | null;
  importedAt: string;
}

const ACC_KEY = "stackwise.bank.accounts.v1";
const TXN_KEY = "stackwise.bank.txns.v1";
const STMT_KEY = "stackwise.bank.statements.v1";

const ACCENTS = [
  "from-primary to-primary/70",
  "from-rose-600 to-rose-400",
  "from-emerald-600 to-emerald-400",
  "from-blue-700 to-blue-500",
  "from-amber-600 to-amber-400",
];

function uid() {
  return crypto.randomUUID();
}

function today(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function seedAccounts(): BankAccount[] {
  const a: BankAccount[] = [
    {
      id: uid(),
      accountName: "Stackwise Operations",
      accountNumber: "0123456789",
      bankName: "Equity Bank",
      branch: "Westlands",
      swiftCode: "EQBLKENA",
      currency: "KES",
      openingBalance: 500_000,
      currentBalance: 742_300,
      status: "active",
      color: ACCENTS[0],
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      accountName: "Payroll Holding",
      accountNumber: "9988007711",
      bankName: "KCB Bank",
      branch: "Industrial Area",
      swiftCode: "KCBLKENX",
      currency: "KES",
      openingBalance: 200_000,
      currentBalance: 318_540,
      status: "active",
      color: ACCENTS[1],
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      accountName: "USD Reserve",
      accountNumber: "44-330-998",
      bankName: "Stanbic Bank",
      branch: "Chiromo",
      swiftCode: "SBICKENX",
      currency: "USD",
      openingBalance: 12_000,
      currentBalance: 14_820,
      status: "active",
      color: ACCENTS[3],
      createdAt: new Date().toISOString(),
    },
  ];
  return a;
}

function seedTxns(accounts: BankAccount[]): BankTxn[] {
  const [ops, payroll] = accounts;
  return [
    {
      id: uid(),
      accountId: ops.id,
      date: today(-1),
      type: "deposit",
      subtype: "mobile_money",
      reference: "QGT7H4X9PA",
      description: "Customer payment · INV-3392",
      amount: 48_500,
      party: "Acme Holdings Ltd",
      mobileProvider: "M-Pesa",
      reconciled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      accountId: ops.id,
      date: today(-2),
      type: "deposit",
      subtype: "cheque",
      reference: "CHQ-00871",
      description: "Cheque deposit",
      amount: 120_000,
      party: "Pinnacle Engineering",
      reconciled: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      accountId: ops.id,
      date: today(-3),
      type: "withdrawal",
      subtype: "transfer",
      reference: "EFT-44120",
      description: "Supplier payment",
      amount: -65_400,
      party: "Mavuno Suppliers Ltd",
      reconciled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      accountId: payroll.id,
      date: today(-4),
      type: "withdrawal",
      subtype: "transfer",
      reference: "PAY-MAY-26",
      description: "May payroll run",
      amount: -180_000,
      party: "Payroll batch",
      reconciled: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      accountId: ops.id,
      date: today(-5),
      type: "deposit",
      subtype: "cash",
      reference: "RCP-0019",
      description: "Counter cash deposit",
      amount: 32_000,
      party: "Mary Achieng",
      reconciled: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function useBankStore() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [txns, setTxns] = useState<BankTxn[]>([]);
  const [statements, setStatements] = useState<StatementLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let accs = load<BankAccount[]>(ACC_KEY, []);
    if (accs.length === 0) {
      accs = seedAccounts();
      save(ACC_KEY, accs);
    }
    let tx = load<BankTxn[]>(TXN_KEY, []);
    if (tx.length === 0) {
      tx = seedTxns(accs);
      save(TXN_KEY, tx);
    }
    const st = load<StatementLine[]>(STMT_KEY, []);
    setAccounts(accs);
    setTxns(tx);
    setStatements(st);
    setReady(true);
  }, []);

  const persistAccounts = useCallback((next: BankAccount[]) => {
    setAccounts(next);
    save(ACC_KEY, next);
  }, []);
  const persistTxns = useCallback((next: BankTxn[]) => {
    setTxns(next);
    save(TXN_KEY, next);
  }, []);
  const persistStatements = useCallback((next: StatementLine[]) => {
    setStatements(next);
    save(STMT_KEY, next);
  }, []);

  const addAccount = useCallback(
    (a: Omit<BankAccount, "id" | "createdAt" | "currentBalance" | "color"> & { currentBalance?: number }) => {
      const account: BankAccount = {
        ...a,
        id: uid(),
        currentBalance: a.currentBalance ?? a.openingBalance,
        color: ACCENTS[(accounts.length) % ACCENTS.length],
        createdAt: new Date().toISOString(),
      };
      persistAccounts([account, ...accounts]);
      return account;
    },
    [accounts, persistAccounts],
  );

  const updateAccount = useCallback(
    (id: string, patch: Partial<BankAccount>) => {
      persistAccounts(accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    },
    [accounts, persistAccounts],
  );

  const removeAccount = useCallback(
    (id: string) => {
      persistAccounts(accounts.filter((a) => a.id !== id));
      persistTxns(txns.filter((t) => t.accountId !== id));
    },
    [accounts, txns, persistAccounts, persistTxns],
  );

  const addTxn = useCallback(
    (t: Omit<BankTxn, "id" | "createdAt" | "reconciled"> & { reconciled?: boolean }) => {
      const txn: BankTxn = {
        ...t,
        id: uid(),
        reconciled: t.reconciled ?? false,
        createdAt: new Date().toISOString(),
      };
      persistTxns([txn, ...txns]);
      // update balance
      const acc = accounts.find((a) => a.id === t.accountId);
      if (acc) {
        updateAccount(acc.id, { currentBalance: acc.currentBalance + t.amount });
      }
      return txn;
    },
    [accounts, txns, persistTxns, updateAccount],
  );

  const toggleReconciled = useCallback(
    (id: string) => {
      persistTxns(txns.map((t) => (t.id === id ? { ...t, reconciled: !t.reconciled } : t)));
    },
    [txns, persistTxns],
  );

  const importStatement = useCallback(
    (accountId: string, lines: Omit<StatementLine, "id" | "accountId" | "importedAt">[]) => {
      const newLines: StatementLine[] = lines.map((l) => ({
        ...l,
        id: uid(),
        accountId,
        importedAt: new Date().toISOString(),
      }));
      persistStatements([...newLines, ...statements]);
      return newLines;
    },
    [statements, persistStatements],
  );

  return {
    ready,
    accounts,
    txns,
    statements,
    addAccount,
    updateAccount,
    removeAccount,
    addTxn,
    toggleReconciled,
    importStatement,
  };
}

export function fmt(amount: number, currency: Currency = "KES") {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency} ${Math.abs(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
