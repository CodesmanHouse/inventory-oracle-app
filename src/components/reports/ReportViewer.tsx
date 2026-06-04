import { useMemo } from "react";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { exportAll, type ExportRow } from "@/components/bank/bank-export";
import {
  buildIncomeStatement, buildBalanceSheet, buildCashFlow, buildPeriodicPL,
  buildExpenseByCategory, buildAgingSummary, buildAssetRegister,
  type FinanceInputs, type DateRange, type Granularity,
} from "./reports-engine";

export type ReportKey =
  | "income_statement" | "balance_sheet" | "cash_flow" | "pnl_periodic"
  | "expense_by_category" | "ar_aging" | "ap_aging" | "asset_register"
  | "bank_summary" | "debtors_outstanding" | "creditors_outstanding";

interface Props {
  reportKey: ReportKey;
  title: string;
  range: DateRange;
  granularity: Granularity;
  inputs: FinanceInputs;
  categoriesById: Map<string, string>;
}

const fmt = (n: number) => `KES ${Math.round(n).toLocaleString()}`;

export function ReportViewer({ reportKey, title, range, granularity, inputs, categoriesById }: Props) {
  const data = useMemo(() => build(reportKey, range, granularity, inputs, categoriesById), [reportKey, range, granularity, inputs, categoriesById]);

  function handleExport(kind: "csv" | "excel" | "pdf") {
    if (data.rows.length === 0) return;
    exportAll(`stackwise-${reportKey}`, `Stackwise · ${title}`, data.rows, kind);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{range.from} → {range.to} · {data.rows.length} row{data.rows.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => handleExport("pdf")} disabled={!data.rows.length}><FileText className="mr-1.5 h-4 w-4" /> PDF</Button>
          <Button size="sm" variant="outline" onClick={() => handleExport("excel")} disabled={!data.rows.length}><FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel</Button>
          <Button size="sm" onClick={() => handleExport("csv")} disabled={!data.rows.length}><FileDown className="mr-1.5 h-4 w-4" /> CSV</Button>
        </div>
      </div>

      {data.totals && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {data.totals.map((t) => (
            <div key={t.label} className="rounded-xl border border-border bg-white p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.label}</p>
              <p className={cn("mt-0.5 font-mono text-lg font-semibold tabular-nums",
                t.tone === "ok" && "text-emerald-600",
                t.tone === "danger" && "text-rose-600",
              )}>{t.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        {data.rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No data for this period.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-white">
                {Object.keys(data.rows[0]).map((h) => <TableHead key={h} className={cn(/amount|balance|total|net|cost|revenue|inflow|outflow|value|salvage|paid|expenses/i.test(h) && "text-right")}>{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((r, idx) => (
                <TableRow key={idx} className={cn(typeof r.__bold !== "undefined" && r.__bold && "bg-muted/30 font-semibold")}>
                  {Object.keys(r).filter((k) => !k.startsWith("__")).map((h) => (
                    <TableCell key={h} className={cn("text-sm", /amount|balance|total|net|cost|revenue|inflow|outflow|value|salvage|paid|expenses/i.test(h) && "text-right font-mono tabular-nums")}>
                      {r[h]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

interface BuildResult {
  rows: (ExportRow & { __bold?: boolean })[];
  totals?: { label: string; value: string; tone?: "ok" | "danger" }[];
}

function build(key: ReportKey, range: DateRange, g: Granularity, i: FinanceInputs, cats: Map<string, string>): BuildResult {
  if (key === "income_statement") {
    const r = buildIncomeStatement(i, range);
    return {
      rows: r.rows.map((row) => ({
        Line: row.label,
        Amount: fmt(row.amount),
        __bold: row.bold,
      } as ExportRow & { __bold?: boolean })),
      totals: [{ label: "Net income", value: fmt(r.netIncome), tone: r.netIncome >= 0 ? "ok" : "danger" }],
    };
  }

  if (key === "balance_sheet") {
    const b = buildBalanceSheet(i, range.to);
    const rows: (ExportRow & { __bold?: boolean })[] = [];
    rows.push({ Section: "ASSETS", Line: "", Amount: "", __bold: true });
    for (const a of b.assets) rows.push({ Section: "", Line: (a.sub ? "  • " : "") + a.label, Amount: fmt(a.amount), __bold: !a.sub });
    rows.push({ Section: "Total assets", Line: "", Amount: fmt(b.totalAssets), __bold: true });
    rows.push({ Section: "LIABILITIES", Line: "", Amount: "", __bold: true });
    for (const a of b.liabilities) rows.push({ Section: "", Line: (a.sub ? "  • " : "") + a.label, Amount: fmt(a.amount), __bold: !a.sub });
    rows.push({ Section: "EQUITY", Line: "", Amount: "", __bold: true });
    for (const a of b.equity) rows.push({ Section: "", Line: a.label, Amount: fmt(a.amount) });
    rows.push({ Section: "Total liabilities + equity", Line: "", Amount: fmt(b.totalLiabEquity), __bold: true });
    return {
      rows,
      totals: [
        { label: "Total assets", value: fmt(b.totalAssets), tone: "ok" },
        { label: "Total liab + equity", value: fmt(b.totalLiabEquity) },
        { label: "Variance", value: fmt(b.totalAssets - b.totalLiabEquity), tone: Math.abs(b.totalAssets - b.totalLiabEquity) < 1 ? "ok" : "danger" },
      ],
    };
  }

  if (key === "cash_flow") {
    const arr = buildCashFlow(i, range, g);
    const totIn = arr.reduce((s, r) => s + r.Inflow, 0);
    const totOut = arr.reduce((s, r) => s + r.Outflow, 0);
    return {
      rows: arr.map((r) => ({ Period: r.Period, Inflow: fmt(r.Inflow), Outflow: fmt(r.Outflow), Net: fmt(r.Net) })),
      totals: [
        { label: "Total inflow", value: fmt(totIn), tone: "ok" },
        { label: "Total outflow", value: fmt(totOut), tone: "danger" },
        { label: "Net cash", value: fmt(totIn - totOut), tone: totIn - totOut >= 0 ? "ok" : "danger" },
      ],
    };
  }

  if (key === "pnl_periodic") {
    const arr = buildPeriodicPL(i, range, g);
    const totR = arr.reduce((s, r) => s + r.Revenue, 0);
    const totE = arr.reduce((s, r) => s + r.Expenses, 0);
    return {
      rows: arr.map((r) => ({ Period: r.Period, Revenue: fmt(r.Revenue), Expenses: fmt(r.Expenses), "Net result": fmt(r["Net result"]) })),
      totals: [
        { label: "Revenue", value: fmt(totR), tone: "ok" },
        { label: "Expenses", value: fmt(totE), tone: "danger" },
        { label: "Net result", value: fmt(totR - totE), tone: totR - totE >= 0 ? "ok" : "danger" },
      ],
    };
  }

  if (key === "expense_by_category") {
    const arr = buildExpenseByCategory(i, range);
    return {
      rows: arr.map(([id, v]) => ({ Category: cats.get(id) ?? id, Amount: fmt(v) })),
    };
  }

  if (key === "ar_aging" || key === "ap_aging") {
    const entries = key === "ar_aging" ? i.debtors : i.creditors;
    const b = buildAgingSummary(entries);
    const total = Object.values(b).reduce((s, v) => s + v, 0);
    return {
      rows: Object.entries(b).map(([bucket, amount]) => ({ Bucket: bucket, Amount: fmt(amount), "% of total": total ? `${((amount / total) * 100).toFixed(1)}%` : "—" })),
      totals: [{ label: "Total outstanding", value: fmt(total), tone: "danger" }],
    };
  }

  if (key === "asset_register") {
    const arr = buildAssetRegister(i.assets);
    return {
      rows: arr.map((r) => ({ ...r, "Purchase cost": fmt(r["Purchase cost"]), "Book value": fmt(r["Book value"]) } as ExportRow)),
    };
  }

  if (key === "bank_summary") {
    return {
      rows: i.bank.accounts.map((a) => ({
        Account: a.accountName, Bank: a.bankName, Currency: a.currency,
        "Opening balance": fmt(a.openingBalance), "Current balance": fmt(a.currentBalance),
        Status: a.status,
      })),
    };
  }

  // debtors / creditors outstanding
  const list = key === "debtors_outstanding" ? i.debtors : i.creditors;
  return {
    rows: list
      .filter((e) => e.amount - e.paid > 0)
      .map((e) => ({
        Reference: e.reference, Party: e.partyName, Issued: e.issueDate, Due: e.dueDate,
        Amount: fmt(e.amount), Paid: fmt(e.paid), Balance: fmt(e.amount - e.paid), Status: e.status,
      })),
  };
}
