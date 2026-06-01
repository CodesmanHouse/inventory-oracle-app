import { useEffect, useState } from "react";
import { Building2, User as UserIcon, Mail, Phone, MapPin, Briefcase, CreditCard } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Customer, CustomerStage, CustomerTier, CustomerType } from "./customers-store";
import { nextReference } from "./customers-store";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing: Customer[];
  editing?: Customer | null;
  onSave: (c: Customer) => void;
}

const blank = (ref: string): Customer => ({
  id: crypto.randomUUID(),
  reference: ref,
  name: "",
  type: "company",
  stage: "lead",
  tier: "bronze",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "Kenya",
  industry: "",
  contactPerson: "",
  salesRep: "",
  paymentTerms: "prepaid",
  creditLimit: 0,
  outstandingBalance: 0,
  lifetimeValue: 0,
  totalOrders: 0,
  avgOrderValue: 0,
  loyaltyPoints: 0,
  tags: [],
  notes: "",
  interactions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export function CustomerFormSheet({ open, onOpenChange, existing, editing, onSave }: Props) {
  const [c, setC] = useState<Customer>(blank(nextReference(existing)));
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setC(editing);
      setTagsInput(editing.tags.join(", "));
    } else {
      setC(blank(nextReference(existing)));
      setTagsInput("");
    }
  }, [open, editing, existing]);

  function set<K extends keyof Customer>(key: K, value: Customer[K]) {
    setC((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    if (!c.name.trim()) return;
    onSave({
      ...c,
      name: c.name.trim(),
      email: c.email.trim(),
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[620px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit customer" : "New customer"}</SheetTitle>
          <SheetDescription>
            {editing ? "Update customer details." : `Reference ${c.reference} · creates a 360° contact record.`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" icon={c.type === "company" ? Building2 : UserIcon}>
              <Select value={c.type} onValueChange={(v) => set("type", v as CustomerType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reference" icon={Briefcase}>
              <Input value={c.reference} onChange={(e) => set("reference", e.target.value)} className="font-mono" />
            </Field>
          </div>

          <Field label={c.type === "company" ? "Company name" : "Full name"} icon={Building2}>
            <Input value={c.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Acme Holdings Ltd" />
          </Field>

          {c.type === "company" && (
            <Field label="Contact person" icon={UserIcon}>
              <Input
                value={c.contactPerson || ""}
                onChange={(e) => set("contactPerson", e.target.value)}
                placeholder="Primary contact"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" icon={Mail}>
              <Input type="email" value={c.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Phone" icon={Phone}>
              <Input value={c.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
          </div>

          <Field label="Address" icon={MapPin}>
            <Input value={c.address} onChange={(e) => set("address", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City"><Input value={c.city} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="Country"><Input value={c.country} onChange={(e) => set("country", e.target.value)} /></Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Industry"><Input value={c.industry} onChange={(e) => set("industry", e.target.value)} /></Field>
            <Field label="Sales rep"><Input value={c.salesRep} onChange={(e) => set("salesRep", e.target.value)} /></Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Stage">
              <Select value={c.stage} onValueChange={(v) => set("stage", v as CustomerStage)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["lead", "prospect", "active", "vip", "dormant"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tier">
              <Select value={c.tier} onValueChange={(v) => set("tier", v as CustomerTier)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["bronze", "silver", "gold", "platinum"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Payment terms" icon={CreditCard}>
              <Select value={c.paymentTerms} onValueChange={(v) => set("paymentTerms", v as Customer["paymentTerms"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prepaid">Prepaid</SelectItem>
                  <SelectItem value="net_7">Net 7</SelectItem>
                  <SelectItem value="net_15">Net 15</SelectItem>
                  <SelectItem value="net_30">Net 30</SelectItem>
                  <SelectItem value="net_60">Net 60</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Credit limit (KES)">
              <Input
                type="number"
                value={c.creditLimit}
                onChange={(e) => set("creditLimit", parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Tax ID">
              <Input value={c.taxId || ""} onChange={(e) => set("taxId", e.target.value)} />
            </Field>
          </div>

          <Field label="Tags (comma separated)">
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="vip, recurring, coast" />
          </Field>

          <Field label="Internal notes">
            <Textarea value={c.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </Field>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!c.name.trim()}>
            {editing ? "Save changes" : "Create customer"}
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
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </Label>
      {children}
    </div>
  );
}
