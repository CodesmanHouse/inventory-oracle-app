import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus, Search, Users, Crown, TrendingUp, AlertTriangle, LayoutGrid, List as ListIcon,
  Building2, Sparkles, Mail, Phone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { useCustomers, type Customer, type CustomerStage } from "@/components/customers/customers-store";
import { CustomerFormSheet } from "@/components/customers/CustomerFormSheet";
import { CustomerKanban } from "@/components/customers/CustomerKanban";
import { CustomerDetailSheet } from "@/components/customers/CustomerDetailSheet";

export const Route = createFileRoute("/app/customers")({
  component: CustomersPage,
  head: () => ({ meta: [{ title: "Customers · Stackwise" }] }),
});

const STAGE_CLS: Record<CustomerStage, string> = {
  lead: "bg-slate-500/10 text-slate-600",
  prospect: "bg-blue-500/10 text-blue-600",
  active: "bg-emerald-500/10 text-emerald-600",
  vip: "bg-amber-500/10 text-amber-600",
  dormant: "bg-rose-500/10 text-rose-600",
};

const TIER_DOT: Record<Customer["tier"], string> = {
  bronze: "bg-amber-700",
  silver: "bg-slate-400",
  gold: "bg-amber-400",
  platinum: "bg-cyan-400",
};

function CustomersPage() {
  const { customers, add, update, remove, addInteraction } = useCustomers();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<CustomerStage | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [active, setActive] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (stageFilter !== "all" && c.stage !== stageFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.reference.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [customers, query, stageFilter]);

  const kpis = useMemo(() => {
    const total = customers.length;
    const vip = customers.filter((c) => c.stage === "vip" || c.tier === "platinum").length;
    const ltv = customers.reduce((s, c) => s + c.lifetimeValue, 0);
    const overdue = customers.filter(
      (c) => c.creditLimit > 0 && c.outstandingBalance / c.creditLimit > 0.8,
    ).length;
    const dormant = customers.filter((c) => c.stage === "dormant").length;
    return { total, vip, ltv, overdue, dormant };
  }, [customers]);

  function handleSave(c: Customer) {
    if (editing) {
      update(c.id, c);
      toast.success(`${c.name} updated`);
    } else {
      add(c);
      toast.success(`${c.name} added · ${c.reference}`);
    }
    setFormOpen(false);
    setEditing(null);
  }

  function openDetail(c: Customer) {
    setActive(c);
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {customers.length} · 360° relationships, lifecycle and loyalty
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> New customer
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Total" value={kpis.total} icon={Users} accent="bg-primary/10 text-primary" />
        <Kpi label="VIP / Platinum" value={kpis.vip} icon={Crown} accent="bg-amber-500/10 text-amber-600" />
        <Kpi
          label="Lifetime value"
          value={`KES ${(kpis.ltv / 1_000_000).toFixed(2)}M`}
          icon={TrendingUp}
          accent="bg-emerald-500/10 text-emerald-600"
        />
        <Kpi
          label="Credit watch"
          value={kpis.overdue}
          icon={AlertTriangle}
          accent="bg-destructive/10 text-destructive"
        />
        <Kpi label="Dormant" value={kpis.dormant} icon={Sparkles} accent="bg-rose-500/10 text-rose-600" />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, reference, email, phone, tag…"
            className="bg-white pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as CustomerStage | "all")}>
          <SelectTrigger className="w-[160px] bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {(Object.keys(STAGE_CLS) as CustomerStage[]).map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-md border border-border bg-white p-0.5">
          <button
            onClick={() => setView("kanban")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors",
              view === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Pipeline
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors",
              view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ListIcon className="h-3.5 w-3.5" /> List
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={customers.length === 0 ? "No customers yet" : "No matching customers"}
          description={
            customers.length === 0
              ? "Add your first customer to start tracking relationships and lifetime value."
              : "Try a different search or stage filter."
          }
          actionLabel={customers.length === 0 ? "New customer" : undefined}
          onAction={customers.length === 0 ? () => setFormOpen(true) : undefined}
        />
      ) : view === "kanban" ? (
        <CustomerKanban
          customers={filtered}
          onOpen={openDetail}
          onMove={(id, stage) => {
            update(id, { stage });
            toast.success(`Moved to ${stage}`);
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-white">
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">LTV</TableHead>
                <TableHead>Sales rep</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => openDetail(c)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          {c.type === "company" && <Building2 className="h-3 w-3 text-muted-foreground" />}
                          {c.name}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">{c.reference}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {c.email || "—"}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3 w-3" /> {c.phone || "—"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("border-0 capitalize", STAGE_CLS[c.stage])}>
                      {c.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs capitalize">
                      <span className={cn("h-2 w-2 rounded-full", TIER_DOT[c.tier])} />
                      {c.tier}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{c.totalOrders}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    KES {(c.lifetimeValue / 1000).toFixed(0)}K
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.salesRep || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CustomerFormSheet
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }}
        existing={customers}
        editing={editing}
        onSave={handleSave}
      />

      <CustomerDetailSheet
        customer={active}
        open={!!active}
        onOpenChange={(v) => !v && setActive(null)}
        onEdit={() => {
          if (!active) return;
          setEditing(active);
          setActive(null);
          setFormOpen(true);
        }}
        onDelete={() => {
          if (!active) return;
          remove(active.id);
          toast.success(`${active.name} removed`);
          setActive(null);
        }}
        onLogInteraction={(i) => {
          if (!active) return;
          addInteraction(active.id, i);
          setActive({ ...active, interactions: [i, ...active.interactions] });
          toast.success("Activity logged");
        }}
      />
    </div>
  );
}

function Kpi({
  label, value, icon: Icon, accent,
}: { label: string; value: string | number; icon: typeof Users; accent: string }) {
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
