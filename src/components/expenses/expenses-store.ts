import { useEffect, useState, useCallback } from "react";

const KEY = "stackwise.expenses.v1";

export type ExpenseStatus = "draft" | "submitted" | "approved" | "rejected" | "reimbursed" | "paid";
export type ExpensePaymentMethod = "cash" | "card" | "bank_transfer" | "mobile" | "petty_cash" | "company_card";
export type ExpenseType = "employee" | "travel" | "vendor" | "recurring";
export type RecurringFreq = "weekly" | "monthly" | "quarterly" | "yearly";

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  color: string;
  monthlyBudget: number;
}

export interface Expense {
  id: string;
  reference: string;
  date: string;
  type: ExpenseType;
  employee: string;
  department: string;
  categoryId: string;
  vendor: string;
  amount: number;
  currency: string;
  paymentMethod: ExpensePaymentMethod;
  description: string;
  attachment: string | null;
  status: ExpenseStatus;
  reimbursable: boolean;
  reimbursed: boolean;
  approvedBy: string | null;
  rejectedReason: string | null;
  recurring?: { frequency: RecurringFreq; nextRun: string } | null;
  travel?: { destination: string; purpose: string; mileage: number } | null;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  expenseId: string;
  action: string;
  actor: string;
  note: string;
  at: string;
}

interface ExpensesData {
  categories: ExpenseCategory[];
  expenses: Expense[];
  audit: AuditEntry[];
}

const DEPARTMENTS = ["Operations", "Sales", "Finance", "Engineering", "Marketing", "HR", "Procurement"];

function seed(): ExpensesData {
  const today = new Date();
  const iso = (offset: number) => {
    const d = new Date(today); d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const cats: ExpenseCategory[] = [
    { id: "c1", name: "Office supplies", code: "OFC", color: "#0EA5E9", monthlyBudget: 80_000 },
    { id: "c2", name: "Travel & accommodation", code: "TRV", color: "#F97316", monthlyBudget: 250_000 },
    { id: "c3", name: "Meals & entertainment", code: "MEL", color: "#10B981", monthlyBudget: 60_000 },
    { id: "c4", name: "Utilities", code: "UTL", color: "#6366F1", monthlyBudget: 120_000 },
    { id: "c5", name: "Software & subscriptions", code: "SFT", color: "#EC4899", monthlyBudget: 180_000 },
    { id: "c6", name: "Vendor services", code: "VND", color: "#EAB308", monthlyBudget: 320_000 },
  ];
  const mkRef = (i: number) => `EXP-${String(2400 + i).padStart(5, "0")}`;
  const expenses: Expense[] = [
    { id: "e1", reference: mkRef(1), date: iso(-1), type: "employee", employee: "Wanjiru Mwangi", department: "Sales", categoryId: "c3", vendor: "Java House", amount: 4_800, currency: "UGX", paymentMethod: "card", description: "Client lunch · Q3 pitch", attachment: "receipt-4800.pdf", status: "submitted", reimbursable: true, reimbursed: false, approvedBy: null, rejectedReason: null, createdAt: iso(-1) },
    { id: "e2", reference: mkRef(2), date: iso(-2), type: "travel", employee: "Brian Otieno", department: "Operations", categoryId: "c2", vendor: "Kenya Airways", amount: 38_500, currency: "UGX", paymentMethod: "company_card", description: "Nairobi → Mombasa site visit", attachment: "boarding.pdf", status: "approved", reimbursable: false, reimbursed: false, approvedBy: "Faith Njeri", rejectedReason: null, travel: { destination: "Mombasa", purpose: "Warehouse audit", mileage: 0 }, createdAt: iso(-2) },
    { id: "e3", reference: mkRef(3), date: iso(-3), type: "vendor", employee: "Faith Njeri", department: "Procurement", categoryId: "c6", vendor: "Mavuno Cleaning Co.", amount: 22_000, currency: "UGX", paymentMethod: "bank_transfer", description: "May janitorial services", attachment: null, status: "paid", reimbursable: false, reimbursed: false, approvedBy: "Faith Njeri", rejectedReason: null, createdAt: iso(-3) },
    { id: "e4", reference: mkRef(4), date: iso(-4), type: "recurring", employee: "System", department: "Engineering", categoryId: "c5", vendor: "GitHub Enterprise", amount: 18_400, currency: "UGX", paymentMethod: "company_card", description: "Monthly seats × 8", attachment: null, status: "paid", reimbursable: false, reimbursed: false, approvedBy: "Faith Njeri", rejectedReason: null, recurring: { frequency: "monthly", nextRun: iso(26) }, createdAt: iso(-4) },
    { id: "e5", reference: mkRef(5), date: iso(-5), type: "employee", employee: "Kevin Kiprotich", department: "Marketing", categoryId: "c1", vendor: "Text Book Centre", amount: 6_200, currency: "UGX", paymentMethod: "cash", description: "Print collateral", attachment: "rec-6200.jpg", status: "rejected", reimbursable: true, reimbursed: false, approvedBy: null, rejectedReason: "Use procurement channel", createdAt: iso(-5) },
    { id: "e6", reference: mkRef(6), date: iso(-6), type: "travel", employee: "Wanjiru Mwangi", department: "Sales", categoryId: "c2", vendor: "Uber", amount: 2_300, currency: "UGX", paymentMethod: "mobile", description: "Client visits · Westlands", attachment: null, status: "reimbursed", reimbursable: true, reimbursed: true, approvedBy: "Faith Njeri", rejectedReason: null, travel: { destination: "Westlands", purpose: "Client meetings", mileage: 0 }, createdAt: iso(-6) },
    { id: "e7", reference: mkRef(7), date: iso(-7), type: "vendor", employee: "Brian Otieno", department: "Operations", categoryId: "c4", vendor: "Kenya Power", amount: 64_300, currency: "UGX", paymentMethod: "bank_transfer", description: "May electricity", attachment: "kplc.pdf", status: "approved", reimbursable: false, reimbursed: false, approvedBy: "Faith Njeri", rejectedReason: null, createdAt: iso(-7) },
    { id: "e8", reference: mkRef(8), date: iso(-9), type: "employee", employee: "Mercy Achieng", department: "HR", categoryId: "c3", vendor: "Artcaffé", amount: 3_400, currency: "UGX", paymentMethod: "card", description: "Candidate breakfast interview", attachment: null, status: "submitted", reimbursable: true, reimbursed: false, approvedBy: null, rejectedReason: null, createdAt: iso(-9) },
  ];
  const audit: AuditEntry[] = expenses.slice(0, 4).map((e, i) => ({
    id: `a${i}`, expenseId: e.id, action: e.status === "rejected" ? "rejected" : "approved",
    actor: "Faith Njeri", note: e.rejectedReason ?? "Auto-seeded", at: e.createdAt,
  }));
  return { categories: cats, expenses, audit };
}

export const DEPARTMENT_OPTIONS = DEPARTMENTS;

export function useExpensesStore() {
  const [data, setData] = useState<ExpensesData | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setData(raw ? JSON.parse(raw) : seed());
    } catch { setData(seed()); }
  }, []);

  useEffect(() => {
    if (data) localStorage.setItem(KEY, JSON.stringify(data));
  }, [data]);

  const ready = data !== null;

  const addExpense = useCallback((input: Omit<Expense, "id" | "reference" | "createdAt">) => {
    setData((prev) => {
      if (!prev) return prev;
      const ref = `EXP-${String(2400 + prev.expenses.length + 1).padStart(5, "0")}`;
      const exp: Expense = { ...input, id: crypto.randomUUID(), reference: ref, createdAt: new Date().toISOString() };
      return { ...prev, expenses: [exp, ...prev.expenses] };
    });
  }, []);

  const updateExpense = useCallback((id: string, patch: Partial<Expense>) => {
    setData((prev) => prev && ({ ...prev, expenses: prev.expenses.map((e) => e.id === id ? { ...e, ...patch } : e) }));
  }, []);

  const removeExpense = useCallback((id: string) => {
    setData((prev) => prev && ({ ...prev, expenses: prev.expenses.filter((e) => e.id !== id) }));
  }, []);

  const duplicateExpense = useCallback((id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const src = prev.expenses.find((e) => e.id === id);
      if (!src) return prev;
      const ref = `EXP-${String(2400 + prev.expenses.length + 1).padStart(5, "0")}`;
      const copy: Expense = { ...src, id: crypto.randomUUID(), reference: ref, status: "draft", createdAt: new Date().toISOString() };
      return { ...prev, expenses: [copy, ...prev.expenses] };
    });
  }, []);

  const decideExpense = useCallback((id: string, decision: "approved" | "rejected", actor: string, note: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const expenses = prev.expenses.map((e) => e.id === id ? {
        ...e, status: decision as ExpenseStatus,
        approvedBy: decision === "approved" ? actor : null,
        rejectedReason: decision === "rejected" ? note : null,
      } : e);
      const entry: AuditEntry = { id: crypto.randomUUID(), expenseId: id, action: decision, actor, note, at: new Date().toISOString() };
      return { ...prev, expenses, audit: [entry, ...prev.audit] };
    });
  }, []);

  const reimburse = useCallback((id: string, actor: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const expenses = prev.expenses.map((e) => e.id === id ? { ...e, status: "reimbursed" as ExpenseStatus, reimbursed: true } : e);
      const entry: AuditEntry = { id: crypto.randomUUID(), expenseId: id, action: "reimbursed", actor, note: "Reimbursement processed", at: new Date().toISOString() };
      return { ...prev, expenses, audit: [entry, ...prev.audit] };
    });
  }, []);

  const addCategory = useCallback((c: Omit<ExpenseCategory, "id">) => {
    setData((prev) => prev && ({ ...prev, categories: [...prev.categories, { ...c, id: crypto.randomUUID() }] }));
  }, []);
  const updateCategory = useCallback((id: string, patch: Partial<ExpenseCategory>) => {
    setData((prev) => prev && ({ ...prev, categories: prev.categories.map((c) => c.id === id ? { ...c, ...patch } : c) }));
  }, []);
  const removeCategory = useCallback((id: string) => {
    setData((prev) => prev && ({ ...prev, categories: prev.categories.filter((c) => c.id !== id) }));
  }, []);

  return {
    ready,
    categories: data?.categories ?? [],
    expenses: data?.expenses ?? [],
    audit: data?.audit ?? [],
    addExpense, updateExpense, removeExpense, duplicateExpense,
    decideExpense, reimburse, addCategory, updateCategory, removeCategory,
  };
}
