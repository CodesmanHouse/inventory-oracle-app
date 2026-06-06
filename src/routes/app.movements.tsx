import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { AddSaleSheet } from "@/components/transactions/AddSaleSheet";
import { CSVExportButton, type CSVColumn } from "@/components/data/CSVExportButton";
import { useMovements, useItems } from "@/hooks/useInventoryData";
import { PermissionGate } from "@/hooks/usePermissions";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import type { StockMovement } from "@/types/inventory";

export const Route = createFileRoute("/app/movements")({
  component: TransactionsPage,
  head: () => ({ meta: [{ title: "Transactions — Stackwise" }] }),
});

const fmt = (n: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX" }).format(n || 0);

function TransactionsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const { data: movements } = useMovements();
  const { data: items } = useItems();

  // Only show transactions that are actual sales (have sale details or are Shipped)
  const transactions = useMemo(
    () => movements.filter((m) => m.sale || m.type === "shipped"),
    [movements],
  );

  const itemNameMap = useMemo(
    () => new Map(items.map((i) => [i.id, i.name])),
    [items],
  );

  const stats = useMemo(() => {
    const total = transactions.reduce((s, m) => s + (m.sale?.totalAmount ?? 0), 0);
    const collected = transactions.reduce((s, m) => s + (m.sale?.deposit ?? m.sale?.totalAmount ?? 0), 0);
    const outstanding = transactions.reduce((s, m) => s + (m.sale?.balance ?? 0), 0);
    return { count: transactions.length, total, collected, outstanding };
  }, [transactions]);

  const csvColumns = useMemo<CSVColumn<StockMovement>[]>(() => [
    { header: "Receipt", accessor: (m) => m.sale?.receiptNumber ?? `TXN-${m.id.slice(0, 6)}` },
    { header: "Date", accessor: (m) => new Date(m.createdAt).toLocaleString() },
    { header: "Item", accessor: (m) => itemNameMap.get(m.itemId) ?? "" },
    { header: "Quantity", accessor: (m) => Math.abs(m.quantity) },
    { header: "Total", accessor: (m) => m.sale?.totalAmount ?? 0 },
    { header: "Deposit", accessor: (m) => m.sale?.deposit ?? 0 },
    { header: "Balance", accessor: (m) => m.sale?.balance ?? 0 },
    { header: "Method", accessor: (m) => m.sale?.paymentMethod ?? "" },
    { header: "Customer", accessor: (m) => m.sale?.customer ?? "" },
    { header: "Staff", accessor: (m) => m.sale?.staff ?? m.performedBy },
    { header: "Status", accessor: (m) => m.sale?.status ?? "" },
  ], [itemNameMap]);

  const statPills = [
    { label: "Transactions", value: String(stats.count) },
    { label: "Gross sales", value: fmt(stats.total) },
    { label: "Collected", value: fmt(stats.collected), tone: "emerald" },
    { label: "Outstanding", value: fmt(stats.outstanding), tone: "amber" },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {stats.count} {stats.count === 1 ? "sale" : "sales"} recorded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CSVExportButton data={transactions} columns={csvColumns} filename="stackwise-transactions" />
          <PermissionGate permission="log_movement">
            <Button onClick={() => setFormOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add sale
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statPills.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p
              className={`mt-1 font-mono text-xl font-semibold ${
                s.tone === "emerald"
                  ? "text-emerald-600"
                  : s.tone === "amber"
                  ? "text-amber-600"
                  : "text-foreground"
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <ErrorBoundary>
        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Record your first sale to start tracking receipts, payments, and customer history."
            actionLabel="Add sale"
            onAction={() => setFormOpen(true)}
          />
        ) : (
          <TransactionsTable transactions={transactions} itemNameMap={itemNameMap} />
        )}
      </ErrorBoundary>

      <AddSaleSheet open={formOpen} onOpenChange={setFormOpen} items={items} />
    </div>
  );
}
