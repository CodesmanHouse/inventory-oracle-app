import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gauge, Wrench, ShieldAlert, TrendingDown, CheckCircle2, AlertTriangle, Clock, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Asset } from "./assets-store";
import { bookValue, currentMeter, nextServiceDueDate, nextServiceDueMeter, serviceHealth, fmtKES, ageYears } from "./assets-store";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: Asset | null;
  onAddReading: (id: string, r: { date: string; value: number; recordedBy: string; note?: string }) => void;
  onAddService: (id: string, s: { date: string; type: "preventive" | "corrective" | "inspection" | "upgrade"; performedBy: string; cost: number; notes: string; nextDueDate?: string; nextDueMeter?: number }) => void;
}

export function AssetDetailSheet({ open, onOpenChange, asset, onAddReading, onAddService }: Props) {
  if (!asset) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <Body asset={asset} onAddReading={onAddReading} onAddService={onAddService} />
      </SheetContent>
    </Sheet>
  );
}

function Body({ asset, onAddReading, onAddService }: { asset: Asset; onAddReading: Props["onAddReading"]; onAddService: Props["onAddService"] }) {
  const health = useMemo(() => serviceHealth(asset), [asset]);
  const meter = currentMeter(asset);
  const bv = bookValue(asset);
  const depPct = Math.max(0, Math.min(100, (1 - bv / Math.max(1, asset.purchaseCost)) * 100));
  const dueDate = nextServiceDueDate(asset);
  const dueMeter = nextServiceDueMeter(asset);

  const monthly = useMemo(() => groupByMonth(asset.meterReadings), [asset.meterReadings]);

  const [r, setR] = useState({ date: new Date().toISOString().slice(0, 10), value: meter, recordedBy: "Operator", note: "" });
  const [s, setS] = useState({ date: new Date().toISOString().slice(0, 10), type: "preventive" as const, performedBy: "", cost: 0, notes: "" });

  function submitReading() {
    if (!r.value && r.value !== 0) return;
    onAddReading(asset.id, { ...r, note: r.note || undefined });
    setR({ ...r, value: r.value, note: "" });
  }
  function submitService() {
    onAddService(asset.id, s);
    setS({ ...s, notes: "", cost: 0 });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{asset.tag}</span>
          <span>{asset.name}</span>
        </SheetTitle>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{asset.category}</Badge>
          <Badge variant="outline">{asset.location}</Badge>
          <Badge variant="outline">Assigned · {asset.assignedTo}</Badge>
          <StatusChip status={asset.status} />
        </div>
      </SheetHeader>

      {/* Top KPI strip */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <KPI icon={Gauge} label="Current meter" value={`${meter.toLocaleString()} ${asset.meterUnit}`} />
        <KPI icon={TrendingDown} label="Book value" value={fmtKES(bv)} sub={`${depPct.toFixed(0)}% depreciated`} />
        <KPI icon={Activity} label="Age" value={`${ageYears(asset).toFixed(1)} yrs`} sub={`of ${asset.usefulLifeYears} yrs`} />
        <KPI icon={Wrench} label="Service health"
          value={health.state === "overdue" ? "Overdue" : health.state === "due_soon" ? "Due soon" : "Healthy"}
          tone={health.state === "overdue" ? "danger" : health.state === "due_soon" ? "warn" : "ok"} />
      </div>

      {/* Service pressure gauge */}
      <div className="mt-3 rounded-xl border border-border bg-white p-3">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">Next service pressure</span>
          <span>{(Math.min(100, health.pressure * 100)).toFixed(0)}%</span>
        </div>
        <Progress value={Math.min(100, health.pressure * 100)} className={cn("h-2", health.state === "overdue" && "[&>div]:bg-rose-600", health.state === "due_soon" && "[&>div]:bg-amber-500")} />
        <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{dueDate ? `Date due ${dueDate}` : "No prior service on file"}{health.daysToService != null ? ` · ${health.daysToService}d` : ""}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{dueMeter != null ? `Meter due ${dueMeter.toLocaleString()} ${asset.meterUnit}` : "Meter target not set"}{health.meterToService != null ? ` · ${health.meterToService.toLocaleString()} to go` : ""}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="readings" className="mt-4">
        <TabsList className="grid w-full grid-cols-4 rounded-xl bg-white p-1">
          <TabsTrigger value="readings">Readings</TabsTrigger>
          <TabsTrigger value="service">Service log</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="docs">Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="readings" className="mt-3 space-y-3">
          <div className="rounded-xl border border-border bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily meter reading</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Input type="date" value={r.date} onChange={(e) => setR({ ...r, date: e.target.value })} />
              <Input type="number" value={r.value} onChange={(e) => setR({ ...r, value: Number(e.target.value) })} placeholder={`Value (${asset.meterUnit})`} />
              <Input value={r.recordedBy} onChange={(e) => setR({ ...r, recordedBy: e.target.value })} placeholder="Recorded by" />
              <Button onClick={submitReading}>Log reading</Button>
            </div>
          </div>
          <SparkBars data={monthly} unit={asset.meterUnit} />
          <ReadingsTable asset={asset} />
        </TabsContent>

        <TabsContent value="service" className="mt-3 space-y-3">
          <div className="rounded-xl border border-border bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Record service</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Input type="date" value={s.date} onChange={(e) => setS({ ...s, date: e.target.value })} />
              <Select value={s.type} onValueChange={(v) => setS({ ...s, type: v as typeof s.type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventive</SelectItem>
                  <SelectItem value="corrective">Corrective</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="upgrade">Upgrade</SelectItem>
                </SelectContent>
              </Select>
              <Input value={s.performedBy} onChange={(e) => setS({ ...s, performedBy: e.target.value })} placeholder="Performed by" />
              <Input type="number" value={s.cost} onChange={(e) => setS({ ...s, cost: Number(e.target.value) })} placeholder="Cost (KES)" />
            </div>
            <Textarea className="mt-2" rows={2} value={s.notes} onChange={(e) => setS({ ...s, notes: e.target.value })} placeholder="Notes" />
            <div className="mt-2 flex justify-end"><Button onClick={submitService}><Wrench className="mr-1.5 h-4 w-4" /> Log service</Button></div>
          </div>
          <ServiceTimeline asset={asset} />
        </TabsContent>

        <TabsContent value="finance" className="mt-3 space-y-3">
          <FinancePanel asset={asset} />
        </TabsContent>

        <TabsContent value="docs" className="mt-3 space-y-2 text-sm">
          <Row label="Warranty expiry" value={asset.warrantyExpiry ?? "—"} tone={chipTone(asset.warrantyExpiry)} />
          <Row label="Insurance expiry" value={asset.insuranceExpiry ?? "—"} tone={chipTone(asset.insuranceExpiry)} />
          <Row label="Notes" value={asset.notes || "—"} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function chipTone(d?: string | null): "ok" | "warn" | "danger" | undefined {
  if (!d) return undefined;
  const days = Math.round((new Date(d).getTime() - Date.now()) / 86400_000);
  if (days < 0) return "danger";
  if (days < 60) return "warn";
  return "ok";
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" | "danger" }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-white p-3">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={cn("font-medium", tone === "danger" && "text-rose-600", tone === "warn" && "text-amber-600", tone === "ok" && "text-emerald-600")}>{value}</span>
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub, tone }: { icon: typeof Gauge; label: string; value: string; sub?: string; tone?: "ok" | "warn" | "danger" }) {
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <Icon className={cn("h-3.5 w-3.5", tone === "danger" && "text-rose-600", tone === "warn" && "text-amber-600", tone === "ok" && "text-emerald-600")} />
      </div>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function StatusChip({ status }: { status: Asset["status"] }) {
  const map: Record<Asset["status"], { l: string; c: string; Icon: typeof CheckCircle2 }> = {
    active: { l: "Active", c: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
    idle: { l: "Idle", c: "bg-slate-50 text-slate-600 border-slate-200", Icon: Clock },
    maintenance: { l: "Maintenance", c: "bg-amber-50 text-amber-700 border-amber-200", Icon: Wrench },
    retired: { l: "Retired", c: "bg-rose-50 text-rose-700 border-rose-200", Icon: ShieldAlert },
  };
  const m = map[status];
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", m.c)}><m.Icon className="h-3 w-3" /> {m.l}</span>;
}

function groupByMonth(rs: Asset["meterReadings"]) {
  const map = new Map<string, number>();
  const sorted = [...rs].sort((a, b) => a.date.localeCompare(b.date));
  let prev: number | null = null;
  for (const r of sorted) {
    const m = r.date.slice(0, 7);
    const usage = prev != null ? Math.max(0, r.value - prev) : 0;
    map.set(m, (map.get(m) ?? 0) + usage);
    prev = r.value;
  }
  return Array.from(map.entries()).slice(-12).map(([m, v]) => ({ month: m, value: v }));
}

function SparkBars({ data, unit }: { data: { month: string; value: number }[]; unit: string }) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Usage trend ({unit})</p>
      <div className="flex h-24 items-end gap-1">
        {data.map((d) => (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t bg-gradient-to-t from-primary to-primary/60" style={{ height: `${(d.value / max) * 100}%` }} title={`${d.month}: ${d.value.toLocaleString()}`} />
            <span className="text-[9px] text-muted-foreground">{d.month.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadingsTable({ asset }: { asset: Asset }) {
  const sorted = [...asset.meterReadings].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent readings</div>
      {sorted.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No readings yet.</p> : sorted.map((r, i) => {
        const prev = sorted[i + 1];
        const delta = prev ? r.value - prev.value : 0;
        return (
          <div key={r.id} className="flex items-center justify-between border-b border-border/50 px-3 py-2 text-sm last:border-0">
            <span className="text-muted-foreground">{r.date} · {r.recordedBy}</span>
            <span className="font-mono">{r.value.toLocaleString()} {asset.meterUnit} {delta > 0 && <span className="ml-1 text-[11px] text-emerald-600">+{delta}</span>}</span>
          </div>
        );
      })}
    </div>
  );
}

function ServiceTimeline({ asset }: { asset: Asset }) {
  if (asset.services.length === 0) return <p className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">No service history yet.</p>;
  return (
    <div className="space-y-2">
      {asset.services.slice().sort((a, b) => b.date.localeCompare(a.date)).map((s) => (
        <div key={s.id} className="rounded-xl border border-border bg-white p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary"><Wrench className="h-3.5 w-3.5" /></span>
              <span className="text-sm font-medium capitalize">{s.type}</span>
              <Badge variant="outline" className="text-[10px]">{s.date}</Badge>
            </div>
            <span className="font-mono text-sm">{fmtKES(s.cost)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{s.notes} · by {s.performedBy}</p>
        </div>
      ))}
    </div>
  );
}

function FinancePanel({ asset }: { asset: Asset }) {
  const annual = (asset.purchaseCost - asset.salvageValue) / Math.max(1, asset.usefulLifeYears);
  const bv = bookValue(asset);
  const accumDep = asset.purchaseCost - bv;
  const totalService = asset.services.reduce((s, x) => s + x.cost, 0);
  const totalCost = asset.purchaseCost + totalService;
  return (
    <div className="grid grid-cols-2 gap-2">
      <FinRow label="Purchase cost" value={fmtKES(asset.purchaseCost)} />
      <FinRow label="Salvage value" value={fmtKES(asset.salvageValue)} />
      <FinRow label="Annual depreciation" value={fmtKES(annual)} />
      <FinRow label="Accumulated depreciation" value={fmtKES(accumDep)} />
      <FinRow label="Book value" value={fmtKES(bv)} tone="ok" />
      <FinRow label="Lifetime service cost" value={fmtKES(totalService)} />
      <FinRow label="Total cost of ownership" value={fmtKES(totalCost)} tone="warn" />
      <FinRow label="Cost per year (TCO)" value={fmtKES(totalCost / Math.max(0.1, ageYears(asset)))} />
    </div>
  );
}

function FinRow({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 font-mono text-sm font-semibold", tone === "ok" && "text-emerald-600", tone === "warn" && "text-amber-700")}>{value}</p>
    </div>
  );
}
