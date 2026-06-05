import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Receipt, User, CreditCard, Package, Boxes } from "lucide-react";
import { MovementType } from "@/types/inventory";
import type {
  Item,
  StockMovement,
  PaymentMethod,
  TransactionStatus,
} from "@/types/inventory";
import { useCreateMovement } from "@/hooks/useInventoryMutations";
import { useMovements } from "@/hooks/useInventoryData";
import { useEmployees } from "@/components/employees/employees-store";
import { useAssetsStore } from "@/components/assets/assets-store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Item[];
}

const VAT_RATE = 0.18;
const WALK_IN = "Walk-in";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile", label: "Mobile money" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "credit", label: "Credit / on account" },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

export function AddSaleSheet({ open, onOpenChange, items }: Props) {
  const { mutate, isLoading } = useCreateMovement();
  const { data: movements } = useMovements();
  const { employees } = useEmployees();
  const assetsStore = useAssetsStore();

  const [itemId, setItemId] = useState("");
  const [assetId, setAssetId] = useState<string>("__none__");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [deposit, setDeposit] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountTendered, setAmountTendered] = useState("0");
  const [staff, setStaff] = useState<string>("");
  const [customer, setCustomer] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selected = items.find((i) => i.id === itemId);
  const activeStaff = employees.filter((e) => e.status === "active");

  useEffect(() => {
    if (open) {
      setItemId("");
      setAssetId("__none__");
      setQuantity("1");
      setUnitPrice("0");
      setDiscount("0");
      setVatEnabled(false);
      setDeposit("0");
      setPaymentMethod("cash");
      setAmountTendered("0");
      setStaff(activeStaff[0]?.name ?? "");
      setCustomer("");
      setTelephone("");
      setEmail("");
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (selected) setUnitPrice(String(selected.sellingPrice));
  }, [selected]);

  const qty = Math.max(0, parseInt(quantity, 10) || 0);
  const price = Math.max(0, parseFloat(unitPrice) || 0);
  const disc = Math.max(0, parseFloat(discount) || 0);
  const dep = Math.max(0, parseFloat(deposit) || 0);
  const tendered = Math.max(0, parseFloat(amountTendered) || 0);

  const subTotal = qty * price;
  const afterDiscount = Math.max(0, subTotal - disc);
  const vat = vatEnabled ? afterDiscount * VAT_RATE : 0;
  const totalAmount = afterDiscount + vat;

  const cumulativeAmount = useMemo(() => {
    const today = new Date().toDateString();
    const todaySales = movements
      .filter((m) => m.sale && new Date(m.createdAt).toDateString() === today)
      .reduce((s, m) => s + (m.sale?.totalAmount ?? 0), 0);
    return todaySales + totalAmount;
  }, [movements, totalAmount]);

  const balance = Math.max(0, totalAmount - dep);
  const changeDue = Math.max(0, tendered - dep);

  const status: TransactionStatus =
    balance === 0 ? "paid" : dep > 0 ? "partial" : "pending";

  const receiptNumber = useMemo(
    () => `RCP-${Date.now().toString().slice(-7)}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!itemId) e.itemId = "Item is required";
    if (qty <= 0) e.quantity = "Quantity must be greater than 0";
    if (selected && qty > selected.currentStock)
      e.quantity = `Only ${selected.currentStock} in stock`;
    if (price <= 0) e.unitPrice = "Unit price required";
    if (!staff.trim()) e.staff = "Staff is required";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const customerName = customer.trim() || WALK_IN;
    const linkedAsset = assetId !== "__none__" ? assetsStore.assets.find((a) => a.id === assetId) : null;

    const movement: StockMovement = {
      id: crypto.randomUUID(),
      itemId,
      type: MovementType.Shipped,
      quantity: -qty,
      fromLocationId: null,
      toLocationId: null,
      reference: receiptNumber,
      notes: `Sale to ${customerName}`,
      performedBy: staff,
      createdAt: new Date().toISOString(),
      sale: {
        receiptNumber,
        unitPrice: price,
        totalAmount,
        discount: disc,
        vat,
        vatRate: vatEnabled ? VAT_RATE : 0,
        cumulativeAmount,
        deposit: dep,
        balance,
        paymentMethod,
        amountTendered: tendered,
        changeDue,
        staff,
        customer: customerName,
        telephone,
        email,
        status,
        assetId: linkedAsset?.id ?? null,
        assetName: linkedAsset?.name ?? null,
      },
    };

    mutate(movement, {
      onSuccess: () => {
        toast.success(`Sale recorded · ${receiptNumber}`, { duration: 4000 });
        onOpenChange(false);
      },
      onError: (e) => toast.error(e.message || "Failed to record sale"),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[460px] sm:max-w-[520px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" /> New sale
          </SheetTitle>
          <SheetDescription className="font-mono text-xs">
            Receipt {receiptNumber}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Item section */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Package className="h-3.5 w-3.5" /> Item
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Item *</Label>
              <Select value={itemId || "__none__"} onValueChange={(v) => setItemId(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" disabled>Select item</SelectItem>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} · {i.currentStock} in stock
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.itemId && <p className="mt-1 text-xs text-destructive">{errors.itemId}</p>}
            </div>

            <div>
              <Label className="mb-1.5 flex items-center gap-1.5 text-sm">
                <Boxes className="h-3.5 w-3.5 text-muted-foreground" /> Asset (optional)
              </Label>
              <Select value={assetId} onValueChange={setAssetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {assetsStore.assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.tag} · {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm">Unit price *</Label>
                <Input type="number" min={0} step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
                {errors.unitPrice && <p className="mt-1 text-xs text-destructive">{errors.unitPrice}</p>}
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Quantity *</Label>
                <Input type="number" min={1} step={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                {errors.quantity && <p className="mt-1 text-xs text-destructive">{errors.quantity}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm">Discount</Label>
                <Input type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-2 text-sm">
                  <Checkbox checked={vatEnabled} onCheckedChange={(c) => setVatEnabled(Boolean(c))} id="vat-toggle" />
                  <label htmlFor="vat-toggle" className="cursor-pointer">VAT 18% (optional)</label>
                </Label>
                <Input value={fmt(vat)} disabled className="font-mono" />
              </div>
            </div>
          </section>

          {/* Totals card */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{fmt(subTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">After discount</span>
              <span className="font-mono">{fmt(afterDiscount)}</span>
            </div>
            {vatEnabled && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (18%)</span>
                <span className="font-mono">{fmt(vat)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total amount</span>
              <span className="font-mono font-bold text-primary">{fmt(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs pt-1">
              <span className="text-muted-foreground">Cumulative (today)</span>
              <span className="font-mono">{fmt(cumulativeAmount)}</span>
            </div>
          </div>

          {/* Payment */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" /> Payment
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Method of payment</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm">Deposit</Label>
                <Input type="number" min={0} step="0.01" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Balance</Label>
                <Input value={fmt(balance)} disabled className={`font-mono ${balance > 0 ? "text-amber-600" : ""}`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm">Amount tendered</Label>
                <Input type="number" min={0} step="0.01" value={amountTendered} onChange={(e) => setAmountTendered(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Change due</Label>
                <Input value={fmt(changeDue)} disabled className="font-mono text-emerald-600" />
              </div>
            </div>
          </section>

          {/* People */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <User className="h-3.5 w-3.5" /> Customer & staff
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm">Staff *</Label>
                <Select value={staff} onValueChange={setStaff}>
                  <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                  <SelectContent>
                    {activeStaff.map((e) => (
                      <SelectItem key={e.id} value={e.name}>{e.name} · {e.role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.staff && <p className="mt-1 text-xs text-destructive">{errors.staff}</p>}
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Customer</Label>
                <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder={WALK_IN} />
                <p className="mt-1 text-[10px] text-muted-foreground">Leave blank for walk-in</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm">Telephone</Label>
                <Input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+254 700 000 000" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>
          </section>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading ? "Saving…" : `Complete sale · ${fmt(totalAmount)}`}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
