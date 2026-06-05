import { useState, useMemo, useRef } from "react";
import { Plus, Banknote, FileText, Smartphone, Search, Paperclip, Upload, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BankAccount, BankTxn, DepositType, WithdrawalType, MobileProvider, ReceiptAttachment } from "./bank-store";
import { fmt } from "./bank-store";


type Direction = "deposit" | "withdrawal";

interface Props {
  direction: Direction;
  accounts: BankAccount[];
  txns: BankTxn[];
  onAdd: (t: Omit<BankTxn, "id" | "createdAt" | "reconciled">) => void;
}

const DEPOSIT_TYPES: { value: DepositType; label: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "cheque", label: "Cheque", icon: FileText },
  { value: "mobile_money", label: "Mobile money", icon: Smartphone },
];
const WITHDRAWAL_TYPES: { value: WithdrawalType; label: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "cheque", label: "Cheque", icon: FileText },
  { value: "transfer", label: "Bank transfer", icon: FileText },
  { value: "mobile_money", label: "Mobile money", icon: Smartphone },
];

export function CashFlowPanel({ direction, accounts, txns, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const isDeposit = direction === "deposit";

  const filtered = useMemo(() => {
    const rel = txns.filter((t) => (isDeposit ? t.amount > 0 : t.amount < 0));
    if (!q) return rel;
    const s = q.toLowerCase();
    return rel.filter((t) =>
      [t.reference, t.party, t.description].some((v) => v.toLowerCase().includes(s)),
    );
  }, [txns, q, isDeposit]);

  const totals = useMemo(() => {
    const all = txns.filter((t) => (isDeposit ? t.amount > 0 : t.amount < 0));
    const total = all.reduce((s, t) => s + Math.abs(t.amount), 0);
    const today = all
      .filter((t) => t.date === new Date().toISOString().slice(0, 10))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const mobile = all.filter((t) => t.subtype === "mobile_money").reduce((s, t) => s + Math.abs(t.amount), 0);
    return { total, today, mobile, count: all.length };
  }, [txns, isDeposit]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={`Total ${isDeposit ? "deposits" : "withdrawals"}`} value={fmt(totals.total)} />
        <Stat label="Today" value={fmt(totals.today)} />
        <Stat label="Mobile money" value={fmt(totals.mobile)} />
        <Stat label="Entries" value={String(totals.count)} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference, party…" className="bg-white pl-9" />
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New {isDeposit ? "deposit" : "withdrawal"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-white">
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>{isDeposit ? "From" : "To"}</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => {
              const acc = accounts.find((a) => a.id === t.accountId);
              return (
                <TableRow key={t.id}>
                  <TableCell className="text-sm text-muted-foreground">{t.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1 capitalize">
                      {t.subtype === "mobile_money" ? <Smartphone className="h-3 w-3" /> : t.subtype === "cheque" ? <FileText className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                      {t.subtype?.replace("_", " ")}
                      {t.mobileProvider ? ` · ${t.mobileProvider}` : ""}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                  <TableCell className="text-sm">{t.party}</TableCell>
                  <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">{t.description}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{acc?.accountName ?? "—"}</TableCell>
                  <TableCell>
                    {t.attachment ? (
                      <a
                        href={t.attachment.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] text-primary hover:bg-muted"
                        title={t.attachment.name}
                      >
                        <Paperclip className="h-3 w-3" />
                        view
                      </a>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className={cn("text-right font-mono text-sm font-semibold", isDeposit ? "text-emerald-600" : "text-destructive")}>
                    {fmt(t.amount, acc?.currency)}
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No {isDeposit ? "deposits" : "withdrawals"} yet.</TableCell></TableRow>
            )}
          </TableBody>

        </Table>
      </div>

      <CashFlowSheet
        open={open}
        onOpenChange={setOpen}
        direction={direction}
        accounts={accounts}
        onSubmit={(t) => {
          onAdd(t);
          toast.success(`${isDeposit ? "Deposit" : "Withdrawal"} recorded`);
          setOpen(false);
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function CashFlowSheet({
  open, onOpenChange, direction, accounts, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  direction: Direction;
  accounts: BankAccount[];
  onSubmit: (t: Omit<BankTxn, "id" | "createdAt" | "reconciled">) => void;
}) {
  const isDeposit = direction === "deposit";
  const types = isDeposit ? DEPOSIT_TYPES : WITHDRAWAL_TYPES;
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [subtype, setSubtype] = useState<string>(types[0].value);
  const [reference, setReference] = useState("");
  const [party, setParty] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [provider, setProvider] = useState<MobileProvider>("M-Pesa");
  const [attachment, setAttachment] = useState<ReceiptAttachment | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const valid = accountId && reference && party && parseFloat(amount) > 0;

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Receipt too large (max 5 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAttachment({
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: String(reader.result ?? ""),
    });
    reader.readAsDataURL(file);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New {isDeposit ? "deposit" : "withdrawal"}</SheetTitle>
          <SheetDescription>
            {isDeposit ? "Money coming into a bank account." : "Money leaving a bank account."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          <Field label="Account">
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Choose account" /></SelectTrigger>
              <SelectContent>
                {accounts.filter((a) => a.status === "active").map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.accountName} · {a.bankName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Type">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {types.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSubtype(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs transition-colors",
                      subtype === t.value
                        ? "border-primary bg-primary/5 text-primary font-semibold"
                        : "border-border bg-white text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {subtype === "mobile_money" && (
            <Field label="Mobile provider">
              <Select value={provider} onValueChange={(v) => setProvider(v as MobileProvider)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["M-Pesa", "Airtel Money", "T-Kash"] as MobileProvider[]).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Amount"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></Field>
          </div>

          <Field label="Reference"><Input className="font-mono" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="RCP / CHQ / EFT / Mpesa code" /></Field>
          <Field label={isDeposit ? "From (payer)" : "To (payee)"}><Input value={party} onChange={(e) => setParty(e.target.value)} placeholder="Customer or supplier name" /></Field>
          <Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional notes" /></Field>

          <Field label="Receipt (image or PDF)">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                {attachment ? "Replace receipt" : "Upload receipt"}
              </Button>
              {attachment && (
                <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs">
                  <Paperclip className="h-3 w-3" />
                  <span className="max-w-[140px] truncate">{attachment.name}</span>
                  <a href={attachment.dataUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    <Eye className="h-3 w-3" />
                  </a>
                  <button type="button" onClick={() => setAttachment(null)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </Field>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!valid}
            onClick={() => {
              const amt = parseFloat(amount);
              onSubmit({
                accountId,
                date,
                type: isDeposit ? "deposit" : "withdrawal",
                subtype: subtype as DepositType | WithdrawalType,
                reference: reference.trim(),
                description: description.trim(),
                amount: isDeposit ? amt : -amt,
                party: party.trim(),
                mobileProvider: subtype === "mobile_money" ? provider : undefined,
                attachment,
              });
              setAttachment(null);
            }}
          >
            Record
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
