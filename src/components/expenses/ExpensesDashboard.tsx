import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import type { Expense, ExpenseCategory } from "./expenses-store";

const fmt = (n: number) => `KES ${n.toLocaleString()}`;

interface Props {
  expenses: Expense[];
  categories: ExpenseCategory[];
}

export function ExpensesDashboard({ expenses, categories }: Props) {
  const stats = useMemo(() => {
    const now = new Date();
    const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
    const thisMonth = monthKey(now);

    const monthExp = expenses.filter((e) => monthKey(new Date(e.date)) === thisMonth);
    const total = monthExp.reduce((s, e) => s + e.amount, 0);
    const pending = expenses.filter((e) => e.status === "submitted").reduce((s, e) => s + e.amount, 0);
    const approved = expenses.filter((e) => e.status === "approved" || e.status === "paid").reduce((s, e) => s + e.amount, 0);
    const rejected = expenses.filter((e) => e.status === "rejected").reduce((s, e) => s + e.amount, 0);
    const reimbursable = expenses.filter((e) => e.reimbursable && !e.reimbursed).reduce((s, e) => s + e.amount, 0);
    const outstandingReimb = expenses.filter((e) => e.reimbursable && !e.reimbursed && e.status !== "rejected").length;
    const totalBudget = categories.reduce((s, c) => s + c.monthlyBudget, 0);
    const utilisation = totalBudget ? Math.min(100, Math.round((total / totalBudget) * 100)) : 0;

    // Monthly trend (last 6 months)
    const trend: { month: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      const total = expenses.filter((e) => monthKey(new Date(e.date)) === key).reduce((s, e) => s + e.amount, 0);
      trend.push({ month: d.toLocaleString("en", { month: "short" }), total });
    }

    // By dept
    const byDept = Object.entries(expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.department] = (acc[e.department] ?? 0) + e.amount; return acc;
    }, {})).map(([department, total]) => ({ department, total }));

    // By category
    const byCat = categories.map((c) => ({
      name: c.name,
      value: expenses.filter((e) => e.categoryId === c.id).reduce((s, e) => s + e.amount, 0),
      color: c.color,
    }));

    // Top spenders
    const top = Object.entries(expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.employee] = (acc[e.employee] ?? 0) + e.amount; return acc;
    }, {})).map(([employee, total]) => ({ employee, total })).sort((a, b) => b.total - a.total).slice(0, 5);

    // Budget vs Actual
    const budgetActual = categories.map((c) => ({
      name: c.code,
      budget: c.monthlyBudget,
      actual: monthExp.filter((e) => e.categoryId === c.id).reduce((s, e) => s + e.amount, 0),
    }));

    return { total, pending, approved, rejected, reimbursable, outstandingReimb, utilisation, trend, byDept, byCat, top, budgetActual };
  }, [expenses, categories]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Kpi label="Total · this month" value={fmt(stats.total)} accent="from-primary to-primary/70" />
        <Kpi label="Pending approvals" value={fmt(stats.pending)} accent="from-amber-500 to-amber-400" />
        <Kpi label="Approved" value={fmt(stats.approved)} accent="from-emerald-600 to-emerald-500" />
        <Kpi label="Rejected" value={fmt(stats.rejected)} accent="from-destructive to-destructive/70" />
        <Kpi label="Reimbursable" value={fmt(stats.reimbursable)} accent="from-indigo-600 to-indigo-500" />
        <Kpi label="Budget utilisation" value={`${stats.utilisation}%`} accent="from-sky-600 to-sky-500" extra={<Progress value={stats.utilisation} className="mt-2 h-1.5" />} />
        <Kpi label="Outstanding reimb." value={String(stats.outstandingReimb)} accent="from-rose-500 to-rose-400" suffix="items" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-xl bg-white">
          <CardHeader><CardTitle className="text-base">Monthly expenses trend</CardTitle></CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={stats.trend}>
                <defs>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} className="text-xs" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#gExp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader><CardTitle className="text-base">By category</CardTitle></CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stats.byCat} dataKey="value" nameKey="name" outerRadius={80} innerRadius={45}>
                  {stats.byCat.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-xl bg-white">
          <CardHeader><CardTitle className="text-base">By department</CardTitle></CardHeader>
          <CardContent style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={stats.byDept}>
                <XAxis dataKey="department" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} className="text-xs" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader><CardTitle className="text-base">Top spenders</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.top.map((t) => (
              <div key={t.employee} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <span className="text-sm font-medium">{t.employee}</span>
                <span className="font-mono text-xs text-muted-foreground">{fmt(t.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader><CardTitle className="text-base">Budget vs actual · MTD</CardTitle></CardHeader>
          <CardContent style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={stats.budgetActual}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} className="text-xs" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="budget" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent, extra, suffix }: { label: string; value: string; accent: string; extra?: React.ReactNode; suffix?: string }) {
  return (
    <Card className="overflow-hidden rounded-xl bg-white">
      <div className={`h-1 bg-gradient-to-r ${accent}`} />
      <CardContent className="p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-xl font-semibold text-foreground">{value} {suffix && <span className="text-xs font-normal text-muted-foreground">{suffix}</span>}</p>
        {extra}
      </CardContent>
    </Card>
  );
}
