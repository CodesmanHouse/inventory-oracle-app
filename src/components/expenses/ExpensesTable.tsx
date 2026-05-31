import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Search, Pencil, Copy, Trash2, CheckCircle2, XCircle, Send, Paperclip } from "lucide-react";
import type { Expense, ExpenseCategory, ExpenseStatus, ExpenseType } from "./expenses-store";

const STATUS_TONE: Record<ExpenseStatus, string> = {
  draft: "bg-muted text-muted-foreground border-muted-foreground/20",
  submitted: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
  reimbursed: "bg-indigo-100 text-indigo-800 border-indigo-200",
  paid: "bg-sky-100 text-sky-800 border-sky-200",
};

interface Props {
  title?: string;
  expenses: Expense[];
  categories: ExpenseCategory[];
  filterType?: ExpenseType;
  onAdd?: () => void;
  onEdit: (e: Expense) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onDecide: (id: string, decision: "approved" | "rejected") => void;
  onSubmitForApproval: (id: string) => void;
  onReimburse?: (id: string) => void;
}

export function ExpensesTable({ title, expenses, categories, filterType, onAdd, onEdit, onDuplicate, onRemove, onDecide, onSubmitForApproval, onReimburse }: Props) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const rows = useMemo(() => {
    return expenses
      .filter((e) => !filterType || e.type === filterType)
      .filter((e) => status === "all" || e.status === status)
      .filter((e) => {
        if (!q) return true;
        const t = q.toLowerCase();
        return e.reference.toLowerCase().includes(t) || e.employee.toLowerCase().includes(t)
          || e.vendor.toLowerCase().includes(t) || e.description.toLowerCase().includes(t);
      });
  }, [expenses, filterType, status, q]);

  const total = rows.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {title && <h2 className="mr-auto text-base font-semibold">{title}</h2>}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference, vendor, employee…" className="w-64 bg-white pl-8" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="reimbursed">Reimbursed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        {onAdd && <Button onClick={onAdd} className="gap-1.5"><Plus className="h-4 w-4" /> New expense</Button>}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Reference</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">No expenses match these filters.</TableCell></TableRow>
            ) : rows.map((e) => {
              const cat = catMap[e.categoryId];
              return (
                <TableRow key={e.id} className="text-sm">
                  <TableCell className="font-mono text-xs">{e.reference}{e.attachment && <Paperclip className="ml-1 inline h-3 w-3 text-muted-foreground" />}</TableCell>
                  <TableCell className="font-mono text-xs">{e.date}</TableCell>
                  <TableCell className="font-medium">{e.employee}</TableCell>
                  <TableCell className="text-muted-foreground">{e.department}</TableCell>
                  <TableCell>
                    {cat && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2 py-0.5 text-xs">
                        <span className="h-2 w-2 rounded-full" style={{ background: cat.color }} />{cat.name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.vendor || "—"}</TableCell>
                  <TableCell className="text-right font-mono">{e.currency} {e.amount.toLocaleString()}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{e.paymentMethod.replace("_", " ")}</TableCell>
                  <TableCell><Badge variant="outline" className={STATUS_TONE[e.status]}>{e.status}</Badge></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(e)}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(e.id)}><Copy className="mr-2 h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
                        {e.status === "draft" && <DropdownMenuItem onClick={() => onSubmitForApproval(e.id)}><Send className="mr-2 h-3.5 w-3.5" /> Submit</DropdownMenuItem>}
                        {e.status === "submitted" && <>
                          <DropdownMenuItem onClick={() => onDecide(e.id, "approved")}><CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Approve</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDecide(e.id, "rejected")}><XCircle className="mr-2 h-3.5 w-3.5" /> Reject</DropdownMenuItem>
                        </>}
                        {onReimburse && e.reimbursable && !e.reimbursed && e.status === "approved" && (
                          <DropdownMenuItem onClick={() => onReimburse(e.id)}><CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Mark reimbursed</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onRemove(e.id)} className="text-destructive"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-2 text-xs">
          <span className="text-muted-foreground">{rows.length} record{rows.length === 1 ? "" : "s"}</span>
          <span className="font-mono font-semibold">Total · KES {total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
