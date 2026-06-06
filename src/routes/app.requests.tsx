import { useState, useMemo, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, FileText, Inbox, CheckCircle2, Clock, AlertTriangle, XCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RequestFormSheet } from "@/components/requests/RequestFormSheet";
import { RequestsTable } from "@/components/requests/RequestsTable";
import { RequestsFilters } from "@/components/requests/RequestsFilters";
import { RequestDetailSheet } from "@/components/requests/RequestDetailSheet";
import { useApprovalActions } from "@/components/requests/ApprovalActions";
import { useItems, useRequests } from "@/hooks/useInventoryData";
import { useRole } from "@/hooks/useRole";
import { usePermissions } from "@/hooks/usePermissions";
import { useDemo } from "@/hooks/useDemo";
import { RequestStatus } from "@/types/inventory";
import type { InventoryRequest } from "@/types/inventory";
import type { RequestFilters } from "@/components/requests/request-filter-types";
import { EMPTY_REQUEST_FILTERS } from "@/components/requests/request-filter-types";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const Route = createFileRoute("/app/requests")({
  component: RequestsPage,
  head: () => ({ meta: [{ title: "Requests — Stackwise" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    request: (search.request as string) || undefined,
  }),
});

function applyFilters(requests: InventoryRequest[], filters: RequestFilters): InventoryRequest[] {
  return requests.filter((r) => {
    if (filters.statuses.length > 0 && !filters.statuses.includes(r.status)) return false;
    if (filters.requestor && !r.requestedBy.toLowerCase().includes(filters.requestor.toLowerCase())) return false;
    if (filters.dateFrom && r.createdAt < new Date(filters.dateFrom).toISOString()) return false;
    if (filters.dateTo) {
      const toEnd = new Date(filters.dateTo);
      toEnd.setDate(toEnd.getDate() + 1);
      if (r.createdAt >= toEnd.toISOString()) return false;
    }
    return true;
  });
}

function RequestsPage() {
  const { data: catalogItems } = useItems();
  const { data: requests } = useRequests();
  const { role } = useRole();
  const { can } = usePermissions();
  const { demoStore, bumpVersion } = useDemo();
  const navigate = useNavigate();
  const { request: requestParam } = Route.useSearch();
  const isManagerOrAdmin = role === "admin" || role === "manager";
  const canApproveReq = can("approve_request");
  const [formOpen, setFormOpen] = useState(false);
  const [filters, setFilters] = useState<RequestFilters>(EMPTY_REQUEST_FILTERS);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<InventoryRequest | null>(null);
  const [cancelTarget, setCancelTarget] = useState<InventoryRequest | null>(null);

  // Open detail from URL param on load
  useEffect(() => {
    if (requestParam && requests.length > 0 && !detailRequest) {
      const found = requests.find((r) => r.id === requestParam);
      if (found) {
        setDetailRequest(found);
        setDetailOpen(true);
      }
    }
  }, [requestParam, requests, detailRequest]);

  const approval = useApprovalActions({ items: catalogItems });

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === RequestStatus.Pending).length,
    [requests],
  );

  const kpis = useMemo(() => {
    const now = Date.now();
    const pending = requests.filter((r) => r.status === RequestStatus.Pending);
    const urgent = pending.filter((r) => r.priority === "urgent").length;
    const stale = pending.filter((r) => now - new Date(r.createdAt).getTime() > 3 * 86_400_000).length;
    const fulfilled = requests.filter((r) => r.status === RequestStatus.Fulfilled).length;
    const declined = requests.filter((r) => r.status === RequestStatus.Declined).length;
    const partial = requests.filter((r) => r.status === RequestStatus.PartiallyFulfilled).length;
    const approvalRate = requests.length
      ? Math.round(((fulfilled + partial) / requests.length) * 100)
      : 0;
    return { pending: pending.length, urgent, stale, fulfilled, declined, partial, approvalRate };
  }, [requests]);

  const pendingRequests = useMemo(
    () =>
      applyFilters(
        requests.filter((r) => r.status === RequestStatus.Pending),
        filters,
      ).sort((a, b) => {
        if (a.priority === "urgent" && b.priority !== "urgent") return -1;
        if (b.priority === "urgent" && a.priority !== "urgent") return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }),
    [requests, filters],
  );


  const allFiltered = useMemo(() => applyFilters(requests, filters), [requests, filters]);

  const currentDetail = useMemo(
    () => (detailRequest ? requests.find((r) => r.id === detailRequest.id) ?? detailRequest : null),
    [requests, detailRequest],
  );

  function handleRowClick(req: InventoryRequest) {
    setDetailRequest(req);
    setDetailOpen(true);
    navigate({ to: "/app/requests", search: { request: req.id }, replace: true });
  }

  function handleDetailClose(open: boolean) {
    setDetailOpen(open);
    if (!open) {
      navigate({ to: "/app/requests", search: { request: undefined }, replace: true });
    }
  }

  function handleCancel(req: InventoryRequest) {
    setCancelTarget(req);
  }

  function confirmCancel() {
    if (!cancelTarget || !demoStore) return;
    demoStore.updateRequest(cancelTarget.id, {
      status: RequestStatus.Cancelled,
      updatedAt: new Date().toISOString(),
    });
    bumpVersion();
    toast.success(`${cancelTarget.requestNumber} cancelled`);
    setCancelTarget(null);
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
            <Inbox className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Requests</h1>
            <p className="text-sm text-muted-foreground">
              Stock · leave · advances · equipment · purchase · IT — one inbox, one approval flow.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New request
        </Button>
      </div>

      {requests.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard icon={Clock} label="Pending" value={kpis.pending} tint="bg-amber-500/10 text-amber-600" />
          <KpiCard icon={AlertTriangle} label="Urgent" value={kpis.urgent} tint="bg-destructive/10 text-destructive" />
          <KpiCard icon={Sparkles} label="Stale > 3d" value={kpis.stale} tint="bg-rose-500/10 text-rose-600" />
          <KpiCard icon={CheckCircle2} label="Fulfilled" value={kpis.fulfilled} tint="bg-emerald-500/10 text-emerald-600" />
          <KpiCard icon={XCircle} label="Declined" value={kpis.declined} tint="bg-muted text-muted-foreground" />
          <KpiCard icon={FileText} label="Approval rate" value={`${kpis.approvalRate}%`} tint="bg-primary/10 text-primary" />
        </div>
      )}



      <ErrorBoundary>
      {requests.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No requests submitted"
          description="Inventory requests let team members request stock for their departments."
          actionLabel="New Request"
          onAction={() => setFormOpen(true)}
        />
      ) : isManagerOrAdmin ? (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5">
              Pending Approval
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <RequestsFilters filters={filters} onChange={setFilters} />
          </div>

          <TabsContent value="all" className="mt-4">
            <RequestsTable requests={allFiltered} onRowClick={handleRowClick} showRequestor />
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            <RequestsTable requests={pendingRequests} onRowClick={handleRowClick} showRequestor preSorted />
          </TabsContent>
        </Tabs>
      ) : (
        <RequestsTable requests={requests} onRowClick={handleRowClick} />
      )}
      </ErrorBoundary>

      <RequestDetailSheet
        open={detailOpen}
        onOpenChange={handleDetailClose}
        request={currentDetail}
        items={catalogItems}
        canApprove={canApproveReq}
        onApprove={approval.openApprove}
        onDecline={approval.openDecline}
        onPartial={approval.openPartial}
        onCancel={handleCancel}
      />

      {approval.renderDialogs()}

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {cancelTarget?.requestNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The request will be marked as cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmCancel}
            >
              Confirm Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RequestFormSheet open={formOpen} onOpenChange={setFormOpen} items={catalogItems} />
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Inbox;
  label: string;
  value: number | string;
  tint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tint}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 font-mono text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

