import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import type { AuditEntry, Expense, ExpenseCategory } from "./expenses-store";

const fmt = (n: number) => `UGX ${n.toLocaleString()}`;

// ─── Categories Manager ───────────────────────────────────────
export function CategoriesPanel({ categories, onAdd, onUpdate, onRemove }: {
  categories: ExpenseCategory[];
  onAdd: (c: Omit<ExpenseCategory, "id">) => void;
  onUpdate: (id: string, p: Partial<ExpenseCategory>) => void;
  onRemove: (id: string) => void;
}) {
  const [form, setForm] = useState({ name: "", code: "", color: "#0EA5E9", budget: "" });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="rounded-xl bg-white lg:col-span-2">
        <CardHeader><CardTitle className="text-base">Expense categories</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <span className="h-7 w-7 rounded-md" style={{ background: c.color }} />
              <div className="flex-1">
                <Input value={c.name} onChange={(e) => onUpdate(c.id, { name: e.target.value })} className="border-0 px-0 font-medium shadow-none focus-visible:ring-0" />
                <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
              </div>
              <div className="w-40">
                <Label className="text-[10px] uppercase text-muted-foreground">Monthly budget</Label>
                <Input type="number" value={c.monthlyBudget} onChange={(e) => onUpdate(c.id, { monthlyBudget: Number(e.target.value) || 0 })} className="h-8 bg-white" />
              </div>
              <Button size="icon" variant="ghost" onClick={() => onRemove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader><CardTitle className="text-base">Add category</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Code (e.g. TRV)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 p-1" />
          <Input type="number" placeholder="Monthly budget" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          <Button className="w-full gap-1.5" onClick={() => {
            if (!form.name) return;
            onAdd({ name: form.name, code: form.code || form.name.slice(0, 3).toUpperCase(), color: form.color, monthlyBudget: Number(form.budget) || 0 });
            setForm({ name: "", code: "", color: "#0EA5E9", budget: "" });
          }}><Plus className="h-4 w-4" /> Add</Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Budgets Panel ────────────────────────────────────────────
export function BudgetsPanel({ categories, expenses }: { categories: ExpenseCategory[]; expenses: Expense[] }) {
  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const thisMonth = monthKey(new Date());
  const rows = categories.map((c) => {
    const actual = expenses.filter((e) => e.categoryId === c.id && monthKey(new Date(e.date)) === thisMonth).reduce((s, e) => s + e.amount, 0);
    const pct = c.monthlyBudget ? Math.min(100, Math.round((actual / c.monthlyBudget) * 100)) : 0;
    return { ...c, actual, pct };
  });

  return (
    <Card className="rounded-xl bg-white">
      <CardHeader><CardTitle className="text-base">Budget tracking · {new Date().toLocaleString("en", { month: "long", year: "numeric" })}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {rows.map((r) => (
          <div key={r.id} className="space-y-2 rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} /> {r.name}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{fmt(r.actual)} / {fmt(r.monthlyBudget)}</span>
            </div>
            <Progress value={r.pct} className={`h-2 ${r.pct >= 100 ? "[&>div]:bg-destructive" : r.pct >= 80 ? "[&>div]:bg-amber-500" : ""}`} />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{r.pct}% utilised</span>
              <span>{r.pct >= 100 ? "Over budget" : `${fmt(Math.max(0, r.monthlyBudget - r.actual))} remaining`}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Reports Panel ────────────────────────────────────────────
export function ReportsPanel({ expenses, categories }: { expenses: Expense[]; categories: ExpenseCategory[] }) {
  const exportCSV = (kind: string, rows: Record<string, string | number>[]) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${kind}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const reports = [
    { id: "summary", title: "Expense summary", desc: "All expenses with status, category and amounts.",
      rows: () => expenses.map((e) => ({ ref: e.reference, date: e.date, employee: e.employee, dept: e.department, category: catMap[e.categoryId] ?? "—", vendor: e.vendor, amount: e.amount, currency: e.currency, status: e.status })) },
    { id: "reimbursements", title: "Reimbursements", desc: "Outstanding and processed employee reimbursements.",
      rows: () => expenses.filter((e) => e.reimbursable).map((e) => ({ ref: e.reference, employee: e.employee, amount: e.amount, status: e.reimbursed ? "reimbursed" : "outstanding", date: e.date })) },
    { id: "vendor", title: "Vendor expenses", desc: "All vendor-paid expenses grouped by vendor.",
      rows: () => expenses.filter((e) => e.type === "vendor").map((e) => ({ vendor: e.vendor, ref: e.reference, date: e.date, amount: e.amount, category: catMap[e.categoryId] ?? "—" })) },
    { id: "travel", title: "Travel expenses", desc: "Travel-related expenses with destinations.",
      rows: () => expenses.filter((e) => e.type === "travel").map((e) => ({ ref: e.reference, employee: e.employee, destination: e.travel?.destination ?? "—", purpose: e.travel?.purpose ?? "—", amount: e.amount, date: e.date })) },
    { id: "recurring", title: "Recurring expenses", desc: "Subscriptions and recurring vendor charges.",
      rows: () => expenses.filter((e) => e.type === "recurring").map((e) => ({ ref: e.reference, vendor: e.vendor, frequency: e.recurring?.frequency ?? "—", nextRun: e.recurring?.nextRun ?? "—", amount: e.amount })) },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {reports.map((r) => (
        <Card key={r.id} className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle className="text-base">{r.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{r.desc}</p>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{r.rows().length} rows</span>
            <Button size="sm" variant="outline" onClick={() => exportCSV(r.id, r.rows())}>Export CSV</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Audit Log Panel ──────────────────────────────────────────
export function AuditLogPanel({ audit, expenses }: { audit: AuditEntry[]; expenses: Expense[] }) {
  const map = useMemo(() => Object.fromEntries(expenses.map((e) => [e.id, e])), [expenses]);
  return (
    <Card className="rounded-xl bg-white">
      <CardHeader><CardTitle className="text-base">Audit trail</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {audit.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>}
        {audit.map((a) => {
          const exp = map[a.expenseId];
          return (
            <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
              <Badge variant="outline" className={a.action === "approved" ? "bg-emerald-100 text-emerald-800" : a.action === "rejected" ? "bg-rose-100 text-rose-800" : "bg-indigo-100 text-indigo-800"}>{a.action}</Badge>
              <div className="flex-1">
                <p className="text-sm"><span className="font-mono">{exp?.reference ?? a.expenseId.slice(0, 6)}</span> · by <span className="font-medium">{a.actor}</span></p>
                <p className="text-xs text-muted-foreground">{a.note}</p>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">{new Date(a.at).toLocaleString()}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
