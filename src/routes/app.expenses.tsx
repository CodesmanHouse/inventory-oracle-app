import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Receipt, LayoutGrid, FileText, Tags, Users, Plane, Building2, RotateCw, Wallet, CheckSquare, Target, FileSpreadsheet, BarChart3, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useExpensesStore, type Expense } from "@/components/expenses/expenses-store";
import { ExpensesDashboard } from "@/components/expenses/ExpensesDashboard";
import { ExpensesTable } from "@/components/expenses/ExpensesTable";
import { ExpenseFormSheet } from "@/components/expenses/ExpenseFormSheet";
import { CategoriesPanel, BudgetsPanel, ReportsPanel, AuditLogPanel } from "@/components/expenses/ExpensePanels";
import { ExpenseInsights, ExpenseHeatmap } from "@/components/expenses/ExpenseInsights";
import { ReceiptScanner } from "@/components/expenses/ReceiptScanner";

export const Route = createFileRoute("/app/expenses")({
  component: ExpensesPage,
  head: () => ({ meta: [{ title: "Expenses · Stackwise" }] }),
});

function ExpensesPage() {
  const store = useExpensesStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const analytics = useMemo(() => {
    const byEmployee = Object.entries(store.expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.employee] = (acc[e.employee] ?? 0) + e.amount; return acc;
    }, {})).sort((a, b) => b[1] - a[1]);
    const avg = store.expenses.length ? store.expenses.reduce((s, e) => s + e.amount, 0) / store.expenses.length : 0;
    const reimbCount = store.expenses.filter((e) => e.reimbursable).length;
    return { byEmployee, avg, reimbCount };
  }, [store.expenses]);

  if (!store.ready) return <div className="mx-auto h-32 max-w-[1400px] animate-pulse rounded-xl bg-muted/50" />;

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (e: Expense) => { setEditing(e); setOpen(true); };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
            <Receipt className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Expenses</h1>
            <p className="text-sm text-muted-foreground">Claims · approvals · budgets · reimbursements · analytics</p>
          </div>
        </div>
        <Button onClick={openNew} className="gap-1.5"><Receipt className="h-4 w-4" /> New expense</Button>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-white p-1">
          <Tab value="dashboard" icon={LayoutGrid} label="Dashboard" />
          <Tab value="claims" icon={FileText} label="Claims" />
          <Tab value="categories" icon={Tags} label="Categories" />
          <Tab value="employee" icon={Users} label="Employee" />
          <Tab value="travel" icon={Plane} label="Travel" />
          <Tab value="vendor" icon={Building2} label="Vendor" />
          <Tab value="recurring" icon={RotateCw} label="Recurring" />
          <Tab value="reimbursements" icon={Wallet} label="Reimbursements" />
          <Tab value="approvals" icon={CheckSquare} label="Approvals" />
          <Tab value="budgets" icon={Target} label="Budgets" />
          <Tab value="reports" icon={FileSpreadsheet} label="Reports" />
          <Tab value="analytics" icon={BarChart3} label="Analytics" />
          <Tab value="audit" icon={History} label="Audit logs" />
        </TabsList>

        <TabsContent value="dashboard" className="mt-5 space-y-6">
          <ExpenseInsights expenses={store.expenses} categories={store.categories} />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2"><ExpenseHeatmap expenses={store.expenses} /></div>
            <ReceiptScanner categories={store.categories} onCapture={store.addExpense} />
          </div>
          <ExpensesDashboard expenses={store.expenses} categories={store.categories} />
        </TabsContent>

        <TabsContent value="claims" className="mt-5">
          <ExpensesTable title="All expense claims" expenses={store.expenses} categories={store.categories}
            onAdd={openNew} onEdit={openEdit} onDuplicate={store.duplicateExpense} onRemove={store.removeExpense}
            onDecide={(id, d) => store.decideExpense(id, d, "Faith Njeri", d === "approved" ? "Approved via inbox" : "Rejected")}
            onSubmitForApproval={(id) => store.updateExpense(id, { status: "submitted" })}
            onReimburse={(id) => store.reimburse(id, "Faith Njeri")} />
        </TabsContent>

        <TabsContent value="categories" className="mt-5">
          <CategoriesPanel categories={store.categories} onAdd={store.addCategory} onUpdate={store.updateCategory} onRemove={store.removeCategory} />
        </TabsContent>

        <TabsContent value="employee" className="mt-5">
          <ExpensesTable title="Employee expenses" filterType="employee" expenses={store.expenses} categories={store.categories}
            onAdd={openNew} onEdit={openEdit} onDuplicate={store.duplicateExpense} onRemove={store.removeExpense}
            onDecide={(id, d) => store.decideExpense(id, d, "Faith Njeri", d === "approved" ? "OK" : "Rejected")}
            onSubmitForApproval={(id) => store.updateExpense(id, { status: "submitted" })}
            onReimburse={(id) => store.reimburse(id, "Faith Njeri")} />
        </TabsContent>

        <TabsContent value="travel" className="mt-5">
          <ExpensesTable title="Travel expenses" filterType="travel" expenses={store.expenses} categories={store.categories}
            onAdd={openNew} onEdit={openEdit} onDuplicate={store.duplicateExpense} onRemove={store.removeExpense}
            onDecide={(id, d) => store.decideExpense(id, d, "Faith Njeri", d === "approved" ? "OK" : "Rejected")}
            onSubmitForApproval={(id) => store.updateExpense(id, { status: "submitted" })} />
        </TabsContent>

        <TabsContent value="vendor" className="mt-5">
          <ExpensesTable title="Vendor expenses" filterType="vendor" expenses={store.expenses} categories={store.categories}
            onAdd={openNew} onEdit={openEdit} onDuplicate={store.duplicateExpense} onRemove={store.removeExpense}
            onDecide={(id, d) => store.decideExpense(id, d, "Faith Njeri", d === "approved" ? "OK" : "Rejected")}
            onSubmitForApproval={(id) => store.updateExpense(id, { status: "submitted" })} />
        </TabsContent>

        <TabsContent value="recurring" className="mt-5">
          <ExpensesTable title="Recurring expenses" filterType="recurring" expenses={store.expenses} categories={store.categories}
            onAdd={openNew} onEdit={openEdit} onDuplicate={store.duplicateExpense} onRemove={store.removeExpense}
            onDecide={(id, d) => store.decideExpense(id, d, "Faith Njeri", d === "approved" ? "OK" : "Rejected")}
            onSubmitForApproval={(id) => store.updateExpense(id, { status: "submitted" })} />
        </TabsContent>

        <TabsContent value="reimbursements" className="mt-5">
          <ExpensesTable title="Reimbursements" expenses={store.expenses.filter((e) => e.reimbursable)} categories={store.categories}
            onEdit={openEdit} onDuplicate={store.duplicateExpense} onRemove={store.removeExpense}
            onDecide={(id, d) => store.decideExpense(id, d, "Faith Njeri", d === "approved" ? "Approved" : "Rejected")}
            onSubmitForApproval={(id) => store.updateExpense(id, { status: "submitted" })}
            onReimburse={(id) => store.reimburse(id, "Faith Njeri")} />
        </TabsContent>

        <TabsContent value="approvals" className="mt-5">
          <ExpensesTable title="Awaiting your approval" expenses={store.expenses.filter((e) => e.status === "submitted")} categories={store.categories}
            onEdit={openEdit} onDuplicate={store.duplicateExpense} onRemove={store.removeExpense}
            onDecide={(id, d) => store.decideExpense(id, d, "Faith Njeri", d === "approved" ? "Approved in queue" : "Rejected in queue")}
            onSubmitForApproval={(id) => store.updateExpense(id, { status: "submitted" })} />
        </TabsContent>

        <TabsContent value="budgets" className="mt-5">
          <BudgetsPanel categories={store.categories} expenses={store.expenses} />
        </TabsContent>

        <TabsContent value="reports" className="mt-5">
          <ReportsPanel expenses={store.expenses} categories={store.categories} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="text-sm font-semibold">Spend per employee</h3>
              <div className="mt-3 space-y-2">
                {analytics.byEmployee.map(([emp, total]) => (
                  <div key={emp} className="flex items-center justify-between text-sm">
                    <span>{emp}</span>
                    <span className="font-mono text-xs text-muted-foreground">KES {total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="text-sm font-semibold">Key metrics</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Average expense</dt><dd className="font-mono">KES {Math.round(analytics.avg).toLocaleString()}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Reimbursable claims</dt><dd className="font-mono">{analytics.reimbCount}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Total claims</dt><dd className="font-mono">{store.expenses.length}</dd></div>
              </dl>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-5">
          <AuditLogPanel audit={store.audit} expenses={store.expenses} />
        </TabsContent>
      </Tabs>

      <ExpenseFormSheet open={open} onOpenChange={setOpen} categories={store.categories} initial={editing} onSubmit={store.addExpense} />
    </div>
  );
}

function Tab({ value, icon: Icon, label }: { value: string; icon: typeof Receipt; label: string }) {
  return (
    <TabsTrigger value={value} className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
      <Icon className="h-3.5 w-3.5" /> {label}
    </TabsTrigger>
  );
}
