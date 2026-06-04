import { useEffect, useState, useCallback } from "react";

export type AssetStatus = "active" | "idle" | "maintenance" | "retired";
export type AssetCondition = "excellent" | "good" | "fair" | "poor";
export type MeterUnit = "km" | "hours" | "kwh" | "litres" | "cycles" | "pages";

export interface MeterReading {
  id: string;
  date: string;       // YYYY-MM-DD
  value: number;
  recordedBy: string;
  note?: string;
}

export interface ServiceRecord {
  id: string;
  date: string;
  type: "preventive" | "corrective" | "inspection" | "upgrade";
  performedBy: string;
  cost: number;
  notes: string;
  nextDueDate?: string;
  nextDueMeter?: number;
}

export interface Asset {
  id: string;
  tag: string;                 // ASSET-XXXX
  name: string;
  category: string;            // Vehicle, Generator, Machinery, IT, Furniture
  serialNumber: string;
  manufacturer: string;
  model: string;
  location: string;
  assignedTo: string;
  purchaseDate: string;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeYears: number;     // straight-line depreciation
  status: AssetStatus;
  condition: AssetCondition;
  meterUnit: MeterUnit;
  serviceIntervalMeter: number; // e.g. every 5000 km
  serviceIntervalDays: number;  // e.g. every 90 days
  lastServiceDate?: string;
  lastServiceMeter?: number;
  warrantyExpiry?: string;
  insuranceExpiry?: string;
  notes?: string;
  meterReadings: MeterReading[];
  services: ServiceRecord[];
  createdAt: string;
}

const KEY = "stackwise.assets.v1";

const COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#6366F1", "#EC4899", "#14B8A6"];
export const CATEGORY_COLOR = (cat: string) => COLORS[Math.abs(hash(cat)) % COLORS.length];
function hash(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }

const todayISO = () => new Date().toISOString().slice(0, 10);
const isoOffset = (d: number) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

function seed(): Asset[] {
  const mk = (i: number, partial: Partial<Asset>): Asset => ({
    id: crypto.randomUUID(),
    tag: `AST-${String(1000 + i).padStart(4, "0")}`,
    name: "",
    category: "Equipment",
    serialNumber: "",
    manufacturer: "",
    model: "",
    location: "Headquarters",
    assignedTo: "Operations",
    purchaseDate: isoOffset(-365),
    purchaseCost: 0,
    salvageValue: 0,
    usefulLifeYears: 5,
    status: "active",
    condition: "good",
    meterUnit: "km",
    serviceIntervalMeter: 5000,
    serviceIntervalDays: 90,
    meterReadings: [],
    services: [],
    createdAt: new Date().toISOString(),
    ...partial,
  });

  const v1 = mk(1, {
    name: "Toyota Hilux · KCA 442X", category: "Vehicle", serialNumber: "AHTFR22G80",
    manufacturer: "Toyota", model: "Hilux 2.4 D-4D", location: "Nairobi Yard", assignedTo: "Brian Otieno",
    purchaseDate: isoOffset(-720), purchaseCost: 3_850_000, salvageValue: 600_000, usefulLifeYears: 8,
    meterUnit: "km", serviceIntervalMeter: 5000, serviceIntervalDays: 90,
    lastServiceDate: isoOffset(-85), lastServiceMeter: 48_200,
    warrantyExpiry: isoOffset(360), insuranceExpiry: isoOffset(40),
  });
  for (let i = 14; i >= 0; i--) {
    v1.meterReadings.push({ id: crypto.randomUUID(), date: isoOffset(-i), value: 48_200 + (14 - i) * 78, recordedBy: "Brian O." });
  }
  v1.services.push({ id: crypto.randomUUID(), date: isoOffset(-85), type: "preventive", performedBy: "Toyota Kenya", cost: 18_400, notes: "5,000 km service", nextDueDate: isoOffset(5), nextDueMeter: 53_200 });

  const g1 = mk(2, {
    name: "Cummins 60kVA Generator", category: "Generator", serialNumber: "CMS-60K-8821",
    manufacturer: "Cummins", model: "C60D5", location: "Industrial Area", assignedTo: "Facilities",
    purchaseDate: isoOffset(-1100), purchaseCost: 1_420_000, salvageValue: 200_000, usefulLifeYears: 10,
    meterUnit: "hours", serviceIntervalMeter: 250, serviceIntervalDays: 120,
    lastServiceDate: isoOffset(-110), lastServiceMeter: 1_840,
    warrantyExpiry: isoOffset(-30), insuranceExpiry: isoOffset(180),
  });
  for (let i = 10; i >= 0; i--) g1.meterReadings.push({ id: crypto.randomUUID(), date: isoOffset(-i * 2), value: 1_840 + (10 - i) * 7, recordedBy: "Sam K." });

  const m1 = mk(3, {
    name: "Heidelberg Offset Press", category: "Machinery", serialNumber: "HD-PM52-9911",
    manufacturer: "Heidelberg", model: "Printmaster PM52", location: "Printworks Floor", assignedTo: "Production",
    purchaseDate: isoOffset(-1600), purchaseCost: 6_200_000, salvageValue: 800_000, usefulLifeYears: 12,
    meterUnit: "cycles", serviceIntervalMeter: 50_000, serviceIntervalDays: 60,
    lastServiceDate: isoOffset(-40), lastServiceMeter: 312_500, status: "active", condition: "good",
  });
  for (let i = 9; i >= 0; i--) m1.meterReadings.push({ id: crypto.randomUUID(), date: isoOffset(-i), value: 312_500 + (9 - i) * 2400, recordedBy: "Faith N." });

  const it1 = mk(4, {
    name: "MacBook Pro 16″ · Design", category: "IT", serialNumber: "C02ZK1XYMD6T",
    manufacturer: "Apple", model: "MBP16 M3 Pro", location: "Design Studio", assignedTo: "Wanjiru Mwangi",
    purchaseDate: isoOffset(-220), purchaseCost: 380_000, salvageValue: 60_000, usefulLifeYears: 4,
    meterUnit: "hours", serviceIntervalMeter: 2000, serviceIntervalDays: 365,
    warrantyExpiry: isoOffset(510),
  });

  const f1 = mk(5, {
    name: "Forklift · Linde H30", category: "Machinery", serialNumber: "LD-H30-22810",
    manufacturer: "Linde", model: "H30D", location: "Warehouse B", assignedTo: "Logistics",
    purchaseDate: isoOffset(-900), purchaseCost: 2_100_000, salvageValue: 350_000, usefulLifeYears: 10,
    meterUnit: "hours", serviceIntervalMeter: 500, serviceIntervalDays: 90,
    lastServiceDate: isoOffset(-130), lastServiceMeter: 3_240, status: "maintenance", condition: "fair",
  });
  for (let i = 8; i >= 0; i--) f1.meterReadings.push({ id: crypto.randomUUID(), date: isoOffset(-i * 2), value: 3_240 + (8 - i) * 6, recordedBy: "Kevin K." });

  return [v1, g1, m1, it1, f1];
}

export function useAssetsStore() {
  const [assets, setAssets] = useState<Asset[] | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setAssets(raw ? JSON.parse(raw) : seed());
    } catch { setAssets(seed()); }
  }, []);

  useEffect(() => { if (assets) localStorage.setItem(KEY, JSON.stringify(assets)); }, [assets]);

  const addAsset = useCallback((a: Omit<Asset, "id" | "tag" | "createdAt" | "meterReadings" | "services">) => {
    setAssets((prev) => {
      const list = prev ?? [];
      const tag = `AST-${String(1000 + list.length + 1).padStart(4, "0")}`;
      return [{ ...a, id: crypto.randomUUID(), tag, createdAt: new Date().toISOString(), meterReadings: [], services: [] }, ...list];
    });
  }, []);

  const updateAsset = useCallback((id: string, patch: Partial<Asset>) => {
    setAssets((prev) => prev?.map((a) => a.id === id ? { ...a, ...patch } : a) ?? null);
  }, []);

  const removeAsset = useCallback((id: string) => {
    setAssets((prev) => prev?.filter((a) => a.id !== id) ?? null);
  }, []);

  const addReading = useCallback((id: string, r: Omit<MeterReading, "id">) => {
    setAssets((prev) => prev?.map((a) => a.id === id ? { ...a, meterReadings: [{ ...r, id: crypto.randomUUID() }, ...a.meterReadings] } : a) ?? null);
  }, []);

  const addService = useCallback((id: string, s: Omit<ServiceRecord, "id">) => {
    setAssets((prev) => prev?.map((a) => a.id === id ? {
      ...a,
      services: [{ ...s, id: crypto.randomUUID() }, ...a.services],
      lastServiceDate: s.date,
      lastServiceMeter: a.meterReadings[0]?.value ?? a.lastServiceMeter,
    } : a) ?? null);
  }, []);

  return {
    ready: assets !== null,
    assets: assets ?? [],
    addAsset, updateAsset, removeAsset, addReading, addService,
  };
}

// --- Computations ---
export function currentMeter(a: Asset): number {
  return a.meterReadings[0]?.value ?? a.lastServiceMeter ?? 0;
}

export function ageYears(a: Asset): number {
  return (Date.now() - new Date(a.purchaseDate).getTime()) / (365 * 86400_000);
}

export function bookValue(a: Asset): number {
  const annual = (a.purchaseCost - a.salvageValue) / Math.max(1, a.usefulLifeYears);
  const v = a.purchaseCost - annual * ageYears(a);
  return Math.max(a.salvageValue, v);
}

export function nextServiceDueDate(a: Asset): string | null {
  if (!a.lastServiceDate) return null;
  const d = new Date(a.lastServiceDate);
  d.setDate(d.getDate() + a.serviceIntervalDays);
  return d.toISOString().slice(0, 10);
}

export function nextServiceDueMeter(a: Asset): number | null {
  if (a.lastServiceMeter == null) return null;
  return a.lastServiceMeter + a.serviceIntervalMeter;
}

export interface ServiceHealth {
  daysToService: number | null;
  meterToService: number | null;
  /** 0..1, 1 = overdue, 0 = fresh */
  pressure: number;
  state: "ok" | "due_soon" | "overdue";
}

export function serviceHealth(a: Asset): ServiceHealth {
  const due = nextServiceDueDate(a);
  const cur = currentMeter(a);
  const meterDue = nextServiceDueMeter(a);
  const days = due ? Math.round((new Date(due).getTime() - Date.now()) / 86400_000) : null;
  const meterLeft = meterDue != null ? meterDue - cur : null;

  const dayPressure = days != null ? 1 - days / a.serviceIntervalDays : 0;
  const meterPressure = meterLeft != null ? 1 - meterLeft / a.serviceIntervalMeter : 0;
  const pressure = Math.max(0, Math.min(1.2, Math.max(dayPressure, meterPressure)));
  const state: ServiceHealth["state"] = pressure >= 1 ? "overdue" : pressure >= 0.8 ? "due_soon" : "ok";
  return { daysToService: days, meterToService: meterLeft, pressure, state };
}

export const fmtKES = (n: number) =>
  `KES ${Math.round(n).toLocaleString()}`;
