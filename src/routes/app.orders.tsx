import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  ShoppingBag,
  Search,
  Calendar,
  User,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "Orders · Stackwise" }] }),
});

type OrderStatus = "draft" | "confirmed" | "in_progress" | "delivered" | "cancelled";

interface SalesOrder {
  id: string;
  lpoNumber: string;
  dateReceived: string;
  customerName: string;
  customerQuotation: string;
  dateToBeDelivered: string;
  handledBy: string;
  status: OrderStatus;
  amount: number;
  notes?: string;
  createdAt: string;
}

const STORAGE_KEY = "stackwise.orders.v1";

const STATUS_META: Record<OrderStatus, { label: string; cls: string; icon: typeof Clock }> = {
  draft: { label: "Draft", cls: "bg-muted text-muted-foreground", icon: FileText },
  confirmed: { label: "Confirmed", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: CheckCircle2 },
  in_progress: { label: "In progress", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: Truck },
  delivered: { label: "Delivered", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", cls: "bg-destructive/10 text-destructive", icon: AlertCircle },
};

const SEED: SalesOrder[] = [
  {
    id: crypto.randomUUID(),
    lpoNumber: "LPO-2026-0042",
    dateReceived: "2026-05-24",
    customerName: "Acme Holdings Ltd",
    customerQuotation: "QT-3391",
    dateToBeDelivered: "2026-06-05",
    handledBy: "Joyce Wanjiku",
    status: "in_progress",
    amount: 184500,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    lpoNumber: "LPO-2026-0041",
    dateReceived: "2026-05-22",
    customerName: "Pinnacle Engineering",
    customerQuotation: "QT-3387",
    dateToBeDelivered: "2026-05-30",
    handledBy: "Brian Otieno",
    status: "confirmed",
    amount: 92700,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    lpoNumber: "LPO-2026-0040",
    dateReceived: "2026-05-18",
    customerName: "Coastline Foods",
    customerQuotation: "QT-3380",
    dateToBeDelivered: "2026-05-25",
    handledBy: "Mary Achieng",
    status: "delivered",
    amount: 215000,
    createdAt: new Date().toISOString(),
  },
];

function loadOrders(): SalesOrder[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    return JSON.parse(raw) as SalesOrder[];
  } catch {
    return SEED;
  }
}

function saveOrders(orders: SalesOrder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function nextLpo(orders: SalesOrder[]): string {
  const nums = orders
    .map((o) => parseInt(o.lpoNumber.split("-").pop() || "0", 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `LPO-${new Date().getFullYear()}-${String(next).padStart(4, "0")}`;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function OrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    setOrders(loadOrders());
  }, []);

  function persist(next: SalesOrder[]) {
    setOrders(next);
    saveOrders(next);
  }

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        o.lpoNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerQuotation.toLowerCase().includes(q) ||
        o.handledBy.toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "confirmed" || o.status === "in_progress").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const value = orders.reduce((s, o) => s + (o.amount || 0), 0);
    return { total, pending, delivered, value };
  }, [orders]);

  function handleCreate(order: SalesOrder) {
    persist([order, ...orders]);
    toast.success(`${order.lpoNumber} created`);
    setFormOpen(false);
  }

  function handleStatusChange(id: string, status: OrderStatus) {
    persist(orders.map((o) => (o.id === id ? { ...o, status } : o)));
    toast.success("Status updated");
  }

  function handleDelete(id: string) {
    persist(orders.filter((o) => o.id !== id));
    toast.success("Order removed");
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Sales Orders</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {orders.length} orders · LPOs from customers
          </p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New order
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total orders" value={stats.total} icon={ShoppingBag} accent="bg-primary/10 text-primary" />
        <StatCard label="In pipeline" value={stats.pending} icon={Clock} accent="bg-amber-500/10 text-amber-600" />
        <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle2} accent="bg-emerald-500/10 text-emerald-600" />
        <StatCard
          label="Order value"
          value={`KES ${stats.value.toLocaleString()}`}
          icon={FileText}
          accent="bg-blue-500/10 text-blue-600"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search LPO, customer, quotation, handler…"
            className="bg-white pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={orders.length === 0 ? "No orders yet" : "No matching orders"}
          description={
            orders.length === 0
              ? "Create your first sales order from a customer LPO to get started."
              : "Try a different search or status filter."
          }
          actionLabel={orders.length === 0 ? "New order" : undefined}
          onAction={orders.length === 0 ? () => setFormOpen(true) : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-white">
                <TableHead>LPO #</TableHead>
                <TableHead>Date received</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Quotation</TableHead>
                <TableHead>Delivery date</TableHead>
                <TableHead>Handled by</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => {
                const meta = STATUS_META[o.status];
                const StatusIcon = meta.icon;
                const overdue =
                  o.status !== "delivered" &&
                  o.status !== "cancelled" &&
                  new Date(o.dateToBeDelivered) < new Date(todayISO());
                return (
                  <TableRow key={o.id} className="group">
                    <TableCell className="font-mono text-sm font-medium">{o.lpoNumber}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {o.dateReceived}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{o.customerName}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{o.customerQuotation}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-sm",
                          overdue ? "text-destructive font-medium" : "text-muted-foreground",
                        )}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {o.dateToBeDelivered}
                        {overdue && <span className="text-[10px] uppercase tracking-wider">overdue</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                          {o.handledBy.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </span>
                        {o.handledBy}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      KES {o.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={o.status}
                        onValueChange={(v) => handleStatusChange(o.id, v as OrderStatus)}
                      >
                        <SelectTrigger className="h-7 w-[140px] border-0 bg-transparent p-0 hover:bg-muted/40 [&>svg]:opacity-0 group-hover:[&>svg]:opacity-100">
                          <Badge variant="outline" className={cn("gap-1 border-0", meta.cls)}>
                            <StatusIcon className="h-3 w-3" />
                            {meta.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_META[s].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDelete(o.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <OrderFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        nextLpo={nextLpo(orders)}
        onCreate={handleCreate}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof Clock;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", accent)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 font-mono text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function OrderFormSheet({
  open,
  onOpenChange,
  nextLpo,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  nextLpo: string;
  onCreate: (o: SalesOrder) => void;
}) {
  const [lpoNumber, setLpo] = useState(nextLpo);
  const [dateReceived, setDateReceived] = useState(todayISO());
  const [customerName, setCustomerName] = useState("");
  const [customerQuotation, setCustomerQuotation] = useState("");
  const [dateToBeDelivered, setDelivery] = useState("");
  const [handledBy, setHandledBy] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setLpo(nextLpo);
      setDateReceived(todayISO());
      setCustomerName("");
      setCustomerQuotation("");
      setDelivery("");
      setHandledBy("");
      setAmount("");
      setNotes("");
    }
  }, [open, nextLpo]);

  const valid =
    lpoNumber.trim() && dateReceived && customerName.trim() && dateToBeDelivered && handledBy.trim();

  function submit() {
    if (!valid) return;
    onCreate({
      id: crypto.randomUUID(),
      lpoNumber: lpoNumber.trim(),
      dateReceived,
      customerName: customerName.trim(),
      customerQuotation: customerQuotation.trim() || "—",
      dateToBeDelivered,
      handledBy: handledBy.trim(),
      status: "confirmed",
      amount: parseFloat(amount) || 0,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[560px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New sales order</SheetTitle>
          <SheetDescription>Register a Local Purchase Order received from a customer.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="LPO number" icon={FileText}>
              <Input value={lpoNumber} onChange={(e) => setLpo(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Date received" icon={Calendar}>
              <Input type="date" value={dateReceived} onChange={(e) => setDateReceived(e.target.value)} />
            </Field>
          </div>

          <Field label="Customer name" icon={User}>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Acme Holdings Ltd"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Customer quotation" icon={FileText}>
              <Input
                value={customerQuotation}
                onChange={(e) => setCustomerQuotation(e.target.value)}
                placeholder="QT-0000"
                className="font-mono"
              />
            </Field>
            <Field label="Delivery date" icon={Truck}>
              <Input type="date" value={dateToBeDelivered} onChange={(e) => setDelivery(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Handled by" icon={User}>
              <Input
                value={handledBy}
                onChange={(e) => setHandledBy(e.target.value)}
                placeholder="Staff name"
              />
            </Field>
            <Field label="Amount (KES)" icon={FileText}>
              <Input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="font-mono"
              />
            </Field>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes, delivery instructions…"
              rows={3}
              className="mt-1"
            />
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid}>
            Create order
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Clock;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
