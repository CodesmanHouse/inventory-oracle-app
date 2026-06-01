import { useEffect, useState, useCallback } from "react";

export type CustomerType = "company" | "individual";
export type CustomerStage = "lead" | "prospect" | "active" | "vip" | "dormant";
export type CustomerTier = "bronze" | "silver" | "gold" | "platinum";

export interface CustomerInteraction {
  id: string;
  type: "call" | "email" | "meeting" | "order" | "note";
  summary: string;
  at: string;
  by?: string;
}

export interface Customer {
  id: string;
  reference: string;
  name: string;
  type: CustomerType;
  stage: CustomerStage;
  tier: CustomerTier;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  industry: string;
  taxId?: string;
  website?: string;
  contactPerson?: string;
  salesRep: string;
  paymentTerms: "prepaid" | "net_7" | "net_15" | "net_30" | "net_60";
  creditLimit: number;
  outstandingBalance: number;
  lifetimeValue: number;
  totalOrders: number;
  avgOrderValue: number;
  loyaltyPoints: number;
  tags: string[];
  notes: string;
  interactions: CustomerInteraction[];
  lastOrderAt?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "stackwise.customers.v1";

const todayISO = () => new Date().toISOString();
const daysAgo = (d: number) =>
  new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

const SEED: Customer[] = [
  {
    id: crypto.randomUUID(),
    reference: "CUS-00001",
    name: "Acme Holdings Ltd",
    type: "company",
    stage: "vip",
    tier: "platinum",
    email: "procurement@acme.co.ke",
    phone: "+254 711 220 145",
    address: "Riverside Drive 14",
    city: "Nairobi",
    country: "Kenya",
    industry: "Construction",
    taxId: "P051234567X",
    website: "acme.co.ke",
    contactPerson: "Esther Mwangi",
    salesRep: "Joyce Wanjiku",
    paymentTerms: "net_30",
    creditLimit: 1500000,
    outstandingBalance: 285000,
    lifetimeValue: 4820000,
    totalOrders: 47,
    avgOrderValue: 102553,
    loyaltyPoints: 4820,
    tags: ["strategic", "key-account"],
    notes: "Quarterly business review every Q.",
    interactions: [
      { id: crypto.randomUUID(), type: "order", summary: "LPO-2026-0042 confirmed · KES 184,500", at: daysAgo(2) },
      { id: crypto.randomUUID(), type: "call", summary: "Esther called re: pricing on bulk cement", at: daysAgo(5), by: "Joyce" },
      { id: crypto.randomUUID(), type: "meeting", summary: "QBR · expansion roadmap", at: daysAgo(18), by: "Joyce" },
    ],
    lastOrderAt: daysAgo(2),
    createdAt: daysAgo(420),
    updatedAt: daysAgo(2),
  },
  {
    id: crypto.randomUUID(),
    reference: "CUS-00002",
    name: "Pinnacle Engineering",
    type: "company",
    stage: "active",
    tier: "gold",
    email: "ops@pinnacle.co.ke",
    phone: "+254 722 845 901",
    address: "Mombasa Road, Sameer Park",
    city: "Nairobi",
    country: "Kenya",
    industry: "Engineering",
    taxId: "P052891011Y",
    contactPerson: "David Kariuki",
    salesRep: "Brian Otieno",
    paymentTerms: "net_15",
    creditLimit: 600000,
    outstandingBalance: 92700,
    lifetimeValue: 1180000,
    totalOrders: 18,
    avgOrderValue: 65555,
    loyaltyPoints: 1180,
    tags: ["recurring"],
    notes: "",
    interactions: [
      { id: crypto.randomUUID(), type: "order", summary: "LPO-2026-0041 confirmed", at: daysAgo(4) },
      { id: crypto.randomUUID(), type: "email", summary: "Quotation QT-3387 sent", at: daysAgo(9), by: "Brian" },
    ],
    lastOrderAt: daysAgo(4),
    createdAt: daysAgo(220),
    updatedAt: daysAgo(4),
  },
  {
    id: crypto.randomUUID(),
    reference: "CUS-00003",
    name: "Coastline Foods",
    type: "company",
    stage: "active",
    tier: "silver",
    email: "supplies@coastline.co.ke",
    phone: "+254 733 102 887",
    address: "Nyali Centre",
    city: "Mombasa",
    country: "Kenya",
    industry: "Food & Beverage",
    contactPerson: "Halima Said",
    salesRep: "Mary Achieng",
    paymentTerms: "net_7",
    creditLimit: 400000,
    outstandingBalance: 0,
    lifetimeValue: 645000,
    totalOrders: 12,
    avgOrderValue: 53750,
    loyaltyPoints: 645,
    tags: ["coast-region"],
    notes: "",
    interactions: [
      { id: crypto.randomUUID(), type: "order", summary: "LPO-2026-0040 delivered", at: daysAgo(10) },
    ],
    lastOrderAt: daysAgo(10),
    createdAt: daysAgo(180),
    updatedAt: daysAgo(10),
  },
  {
    id: crypto.randomUUID(),
    reference: "CUS-00004",
    name: "James Mutiso",
    type: "individual",
    stage: "prospect",
    tier: "bronze",
    email: "j.mutiso@gmail.com",
    phone: "+254 700 998 211",
    address: "Kileleshwa",
    city: "Nairobi",
    country: "Kenya",
    industry: "Retail",
    salesRep: "Brian Otieno",
    paymentTerms: "prepaid",
    creditLimit: 0,
    outstandingBalance: 0,
    lifetimeValue: 28000,
    totalOrders: 1,
    avgOrderValue: 28000,
    loyaltyPoints: 28,
    tags: ["walk-in"],
    notes: "Interested in solar kits.",
    interactions: [
      { id: crypto.randomUUID(), type: "note", summary: "Requested catalog", at: daysAgo(7), by: "Brian" },
    ],
    lastOrderAt: daysAgo(35),
    createdAt: daysAgo(45),
    updatedAt: daysAgo(7),
  },
  {
    id: crypto.randomUUID(),
    reference: "CUS-00005",
    name: "Savannah Logistics",
    type: "company",
    stage: "dormant",
    tier: "silver",
    email: "accounts@savannah.co.ke",
    phone: "+254 720 334 110",
    address: "ICD Road",
    city: "Nairobi",
    country: "Kenya",
    industry: "Logistics",
    contactPerson: "Patrick Ngugi",
    salesRep: "Joyce Wanjiku",
    paymentTerms: "net_30",
    creditLimit: 500000,
    outstandingBalance: 0,
    lifetimeValue: 412000,
    totalOrders: 9,
    avgOrderValue: 45777,
    loyaltyPoints: 412,
    tags: ["re-engage"],
    notes: "No orders in 90+ days. Consider win-back campaign.",
    interactions: [
      { id: crypto.randomUUID(), type: "email", summary: "Win-back offer drafted", at: daysAgo(15) },
    ],
    lastOrderAt: daysAgo(112),
    createdAt: daysAgo(540),
    updatedAt: daysAgo(15),
  },
  {
    id: crypto.randomUUID(),
    reference: "CUS-00006",
    name: "Brightway Schools",
    type: "company",
    stage: "lead",
    tier: "bronze",
    email: "admin@brightway.ac.ke",
    phone: "+254 712 556 008",
    address: "Karen",
    city: "Nairobi",
    country: "Kenya",
    industry: "Education",
    contactPerson: "Ruth Mumo",
    salesRep: "Mary Achieng",
    paymentTerms: "prepaid",
    creditLimit: 0,
    outstandingBalance: 0,
    lifetimeValue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    loyaltyPoints: 0,
    tags: ["education", "new"],
    notes: "Discovery call scheduled.",
    interactions: [
      { id: crypto.randomUUID(), type: "meeting", summary: "Discovery call booked", at: daysAgo(1), by: "Mary" },
    ],
    createdAt: daysAgo(6),
    updatedAt: daysAgo(1),
  },
];

function load(): Customer[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    return JSON.parse(raw) as Customer[];
  } catch {
    return SEED;
  }
}

function save(list: Customer[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function nextReference(list: Customer[]): string {
  const nums = list
    .map((c) => parseInt(c.reference.split("-").pop() || "0", 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `CUS-${String(next).padStart(5, "0")}`;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    setCustomers(load());
  }, []);

  const persist = useCallback((next: Customer[]) => {
    setCustomers(next);
    save(next);
  }, []);

  const add = useCallback((c: Customer) => persist([c, ...load()]), [persist]);
  const update = useCallback(
    (id: string, patch: Partial<Customer>) =>
      persist(load().map((c) => (c.id === id ? { ...c, ...patch, updatedAt: todayISO() } : c))),
    [persist],
  );
  const remove = useCallback(
    (id: string) => persist(load().filter((c) => c.id !== id)),
    [persist],
  );
  const addInteraction = useCallback(
    (id: string, interaction: CustomerInteraction) => {
      const list = load();
      persist(
        list.map((c) =>
          c.id === id
            ? { ...c, interactions: [interaction, ...c.interactions], updatedAt: todayISO() }
            : c,
        ),
      );
    },
    [persist],
  );

  return { customers, add, update, remove, addInteraction };
}
