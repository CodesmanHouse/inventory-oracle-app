import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileBarChart2, Calendar, Layers, Wallet, ArrowDownToLine, ArrowUpFromLine, Receipt, Boxes, Scale, TrendingUp, PieChart, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useBankStore } from "@/components/bank/bank-store";
import { useLedger } from "@/components/ledger/ledger-store";
import { useExpensesStore } from "@/components/expenses/expenses-store";
import { useAssetsStore } from "@/components/assets/assets-store";
import { ReportViewer, type ReportKey } from "@/components/reports/ReportViewer";
import { presetRange, type Granularity, type DateRange } from "@/components/reports/reports-engine";

export const Route = createFileRoute("/app/reports")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports · Stackwise" }] }),
});

interface ReportDef { key: ReportKey; label: string; group: string; icon: typeof Wallet; description: string }

const REPORTS: ReportDef[] = [
  { key: "income_statement", label: "Income statement", group: "Financial statements", icon: TrendingUp, description: "Revenue, COGS, opex, net income" },
  { key: "balance_sheet", label: "Balance sheet", group: "Financial statements", icon: Scale, description: "Assets, liabilities, equity as of date" },
  { key: "cash_flow", label: "Cash flow", group: "Financial statements", icon: Wallet, description: "Inflow vs outflow by period" },
  { key: "pnl_periodic", label: "Periodic P&L", group: "Operational", icon: ClipboardList, description: "Revenue & expense rollup by period" },
  { key: "expense_by_category", label: "Expense by category", group: "Operational", icon: PieChart, description: "Spend mix by category" },
  { key: "ar_aging", label: "Debtors aging", group: "Ledgers", icon: ArrowDownToLine, description: "Outstanding receivables by bucket" },
  { key: "ap_aging", label: "Creditors aging", group: "Ledgers", icon: ArrowUpFromLine, description: "Outstanding payables by bucket" },
  { key: "debtors_outstanding", label: "Debtors outstanding", group: "Ledgers", icon: ArrowDownToLine, description: "Open invoices line by line" },
  { key: "creditors_outstanding", label: "Creditors outstanding", group: "Ledgers", icon: ArrowUpFromLine, description: "Open bills line by line" },
  { key: "bank_summary", label: "Bank summary", group: "Treasury", icon: Wallet, description: "All bank accounts with balances" },
  { key: "asset_register", label: "Asset register", group: "Assets", icon: Boxes, description: "Full asset list with book values" },
];

function ReportsPage() {
  const bank = useBankStore();
  const debtors = useLedger("debtor");
  const creditors = useLedger("creditor");
  const exp = useExpensesStore();
  const assets = useAssetsStore();

  const [range, setRange] = useState<DateRange>(presetRange("ytd"));
  const [g, setG] = useState<Granularity>("monthly");
  const [active, setActive] = useState<ReportKey>("income_statement");

  const inputs = useMemo(() => ({
    bank: { txns: bank.txns, accounts: bank.accounts },
    debtors: debtors.entries,
    creditors: creditors.entries,
    expenses: exp.expenses,
    assets: assets.assets,
  }), [bank.txns, bank.accounts, debtors.entries, creditors.entries, exp.expenses, assets.assets]);

  const categoriesById = useMemo(() => new Map(exp.categories.map((c) => [c.id, c.name])), [exp.categories]);

  const ready = bank.ready && exp.ready && assets.ready;
  if (!ready) return <div className="mx-auto h-32 max-w-[1400px] animate-pulse rounded-xl bg-muted/50" />;

  const groups = Array.from(new Set(REPORTS.map((r) => r.group)));
  const meta = REPORTS.find((r) => r.key === active)!;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
            <FileBarChart2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Reports</h1>
            <p className="text-sm text-muted-foreground">Income statement · Balance sheet · Cash flow · Ledgers · Exports</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-border bg-white p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Quick range</Label>
            <div className="flex flex-wrap gap-1">
              {[
                ["today", "Today"], ["week", "Week"], ["month", "Month"], ["quarter", "Quarter"],
                ["ytd", "YTD"], ["year", "12 mo"], ["last30", "30d"], ["last90", "90d"],
              ].map(([k, l]) => (
                <Button key={k} size="sm" variant="outline" onClick={() => setRange(presetRange(k as Parameters<typeof presetRange>[0]))}>{l}</Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">From</Label>
            <Input type="date" className="bg-white" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">To</Label>
            <Input type="date" className="bg-white" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Granularity</Label>
            <Select value={g} onValueChange={(v) => setG(v as Granularity)}>
              <SelectTrigger className="w-[160px] bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> {range.from} → {range.to}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Selector */}
        <aside className="space-y-3">
          {groups.map((grp) => (
            <div key={grp}>
              <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{grp}</p>
              <div className="space-y-1">
                {REPORTS.filter((r) => r.group === grp).map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.key} onClick={() => setActive(r.key)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                        active === r.key ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40",
                      )}
                    >
                      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", active === r.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">{r.label}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{r.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Viewer */}
        <ReportViewer reportKey={active} title={meta.label} range={range} granularity={g} inputs={inputs} categoriesById={categoriesById} />
      </div>
    </div>
  );
}
