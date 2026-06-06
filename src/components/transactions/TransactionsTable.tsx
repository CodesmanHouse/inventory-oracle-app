import { useState, useMemo } from "react";
import { Receipt, MoreHorizontal, Eye, Printer, Ban, Search, Boxes } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import type { StockMovement, TransactionStatus } from "@/types/inventory";

interface Props {
  transactions: StockMovement[];
  itemNameMap: Map<string, string>;
}

const PER_PAGE = 25;

const STATUS_STYLES: Record<TransactionStatus, string> = {
  paid: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  partial: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  pending: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  void: "bg-red-500/10 text-red-600 border-red-500/20",
};

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  mobile: "Mobile",
  bank_transfer: "Bank",
  credit: "Credit",
};

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX" }).format(n || 0);

type RangeFilter = "any" | "zero" | "positive";

export function TransactionsTable({ transactions, itemNameMap }: Props) {
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [customer, setCustomer] = useState("all");
  const [staff, setStaff] = useState("all");
  const [status, setStatus] = useState("all");
  const [itemId, setItemId] = useState("all");
  const [deposit, setDeposit] = useState<RangeFilter>("any");
  const [balance, setBalance] = useState<RangeFilter>("any");
  const isMobile = useIsMobile();

  const customers = useMemo(
    () => Array.from(new Set(transactions.map((m) => m.sale?.customer ?? "Walk-in"))).sort(),
    [transactions],
  );
  const staffList = useMemo(
    () => Array.from(new Set(transactions.map((m) => m.sale?.staff ?? m.performedBy))).sort(),
    [transactions],
  );
  const itemOptions = useMemo(
    () => Array.from(new Set(transactions.map((m) => m.itemId))).map((id) => ({ id, name: itemNameMap.get(id) ?? "Unknown" })),
    [transactions, itemNameMap],
  );

  const filtered = useMemo(() => {
    return transactions.filter((m) => {
      const s = m.sale;
      const cust = s?.customer ?? "Walk-in";
      const stf = s?.staff ?? m.performedBy;
      const st = (s?.status ?? "paid") as TransactionStatus;
      if (customer !== "all" && cust !== customer) return false;
      if (staff !== "all" && stf !== staff) return false;
      if (status !== "all" && st !== status) return false;
      if (itemId !== "all" && m.itemId !== itemId) return false;
      if (deposit === "zero" && (s?.deposit ?? 0) !== 0) return false;
      if (deposit === "positive" && (s?.deposit ?? 0) <= 0) return false;
      if (balance === "zero" && (s?.balance ?? 0) !== 0) return false;
      if (balance === "positive" && (s?.balance ?? 0) <= 0) return false;
      if (q.trim()) {
        const needle = q.toLowerCase();
        const itemName = itemNameMap.get(m.itemId) ?? "";
        return [s?.receiptNumber, cust, stf, itemName, s?.assetName ?? "", s?.telephone ?? "", s?.email ?? ""].some((v) =>
          v?.toLowerCase().includes(needle),
        );
      }
      return true;
    });
  }, [transactions, customer, staff, status, itemId, deposit, balance, q, itemNameMap]);

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  const clearFilters = () => {
    setQ(""); setCustomer("all"); setStaff("all"); setStatus("all");
    setItemId("all"); setDeposit("any"); setBalance("any"); setPage(0);
  };

  const filterBar = (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search receipt, customer, item, asset…" className="bg-white pl-8" />
      </div>
      <Select value={customer} onValueChange={setCustomer}>
        <SelectTrigger className="w-[150px] bg-white"><SelectValue placeholder="Customer" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All customers</SelectItem>
          {customers.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={staff} onValueChange={setStaff}>
        <SelectTrigger className="w-[140px] bg-white"><SelectValue placeholder="Staff" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All staff</SelectItem>
          {staffList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={itemId} onValueChange={setItemId}>
        <SelectTrigger className="w-[150px] bg-white"><SelectValue placeholder="Item" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All items</SelectItem>
          {itemOptions.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[120px] bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All status</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="partial">Partial</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="void">Void</SelectItem>
        </SelectContent>
      </Select>
      <Select value={deposit} onValueChange={(v) => setDeposit(v as RangeFilter)}>
        <SelectTrigger className="w-[130px] bg-white"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any deposit</SelectItem>
          <SelectItem value="positive">Deposit &gt; 0</SelectItem>
          <SelectItem value="zero">No deposit</SelectItem>
        </SelectContent>
      </Select>
      <Select value={balance} onValueChange={(v) => setBalance(v as RangeFilter)}>
        <SelectTrigger className="w-[130px] bg-white"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any balance</SelectItem>
          <SelectItem value="positive">Outstanding</SelectItem>
          <SelectItem value="zero">Settled</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm" variant="ghost" onClick={clearFilters}>Clear</Button>
    </div>
  );

  if (transactions.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        No transactions recorded
      </p>
    );
  }

  const pagination = (
    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Showing {sorted.length === 0 ? 0 : safePage * PER_PAGE + 1}–
        {Math.min((safePage + 1) * PER_PAGE, sorted.length)} of {sorted.length}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={safePage === 0}
          onClick={() => setPage(safePage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={safePage >= totalPages - 1}
          onClick={() => setPage(safePage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );

  const row = (m: StockMovement) => {
    const s = m.sale;
    const itemName = itemNameMap.get(m.itemId) ?? "Unknown";
    const qty = Math.abs(m.quantity);
    return {
      receipt: s?.receiptNumber ?? `TXN-${m.id.slice(0, 6).toUpperCase()}`,
      item: itemName,
      qty,
      total: s?.totalAmount ?? 0,
      deposit: s?.deposit ?? 0,
      balance: s?.balance ?? 0,
      method: s?.paymentMethod ?? "cash",
      customer: s?.customer ?? "Walk-in",
      staff: s?.staff ?? m.performedBy,
      status: (s?.status ?? "paid") as TransactionStatus,
      asset: s?.assetName ?? null,
      time: m.createdAt,
    };
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        {filterBar}
        <div className="space-y-3">
          {paged.map((m) => {
            const r = row(m);
            return (
              <Card key={m.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 text-primary p-1.5">
                        <Receipt className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{r.receipt}</p>
                        <p className="text-sm font-medium">{r.item}</p>
                        {r.asset && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Boxes className="h-3 w-3" />{r.asset}</p>}
                      </div>
                    </div>
                    <Badge variant="outline" className={STATUS_STYLES[r.status]}>
                      {r.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className="text-muted-foreground">Qty</div>
                    <div className="text-right font-mono">{r.qty}</div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="text-right font-mono font-medium">{fmtMoney(r.total)}</div>
                    <div className="text-muted-foreground">Deposit</div>
                    <div className="text-right font-mono">{fmtMoney(r.deposit)}</div>
                    <div className="text-muted-foreground">Balance</div>
                    <div className="text-right font-mono">{fmtMoney(r.balance)}</div>
                    <div className="text-muted-foreground">Method</div>
                    <div className="text-right">{METHOD_LABEL[r.method] ?? r.method}</div>
                    <div className="text-muted-foreground">Customer</div>
                    <div className="text-right">{r.customer}</div>
                    <div className="text-muted-foreground">Staff</div>
                    <div className="text-right">{r.staff}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {pagination}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filterBar}
      <div className="overflow-x-auto rounded-md border border-border bg-white">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead className="w-[140px]">Receipt #</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead className="w-[70px] text-right">Qty</TableHead>
              <TableHead className="w-[110px] text-right">Total</TableHead>
              <TableHead className="w-[110px] text-right">Deposit</TableHead>
              <TableHead className="w-[110px] text-right">Balance</TableHead>
              <TableHead className="w-[100px]">Method</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="w-[120px]">Staff</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow><TableCell colSpan={12} className="py-10 text-center text-sm text-muted-foreground">No transactions match these filters.</TableCell></TableRow>
            ) : paged.map((m) => {
              const r = row(m);
              return (
                <TableRow key={m.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 text-primary p-1">
                        <Receipt className="h-3.5 w-3.5" />
                      </span>
                      <div className="leading-tight">
                        <div className="font-mono text-xs">{r.receipt}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {format(new Date(r.time), "MMM d, HH:mm")}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{r.item}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.asset ? (
                      <span className="inline-flex items-center gap-1"><Boxes className="h-3 w-3" />{r.asset}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">{r.qty}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {fmtMoney(r.total)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-600">
                    {fmtMoney(r.deposit)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${
                      r.balance > 0 ? "text-amber-600" : "text-muted-foreground"
                    }`}
                  >
                    {fmtMoney(r.balance)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {METHOD_LABEL[r.method] ?? r.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{r.customer}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.staff}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_STYLES[r.status]}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" /> View receipt
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Printer className="mr-2 h-4 w-4" /> Print
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Ban className="mr-2 h-4 w-4" /> Void
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {pagination}
    </div>
  );
}
