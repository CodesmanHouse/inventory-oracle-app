import { createContext, useContext, useState, type ReactNode, createElement } from "react";

export type EmployeeStatus = "active" | "on_leave" | "probation" | "inactive";
export type EmploymentType = "full_time" | "part_time" | "contract" | "intern";

export interface Employee {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: string;
  department: string;
  manager?: string;
  location: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  joinedAt: string;
  salary: number;
  skills: string[];
  emergencyContact?: string;
  bio?: string;
}

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const SEED: Employee[] = [
  { id: "e1", code: "EMP-001", name: "Aisha Mwangi", email: "aisha@stackwise.io", phone: "+254 712 884 221", role: "Head of Operations", department: "Operations", location: "Nairobi HQ", employmentType: "full_time", status: "active", joinedAt: "2022-03-14", salary: 285000, skills: ["Leadership", "SCM", "Lean"], bio: "Drives warehouse throughput and last-mile reliability." },
  { id: "e2", code: "EMP-002", name: "Brian Otieno", email: "brian@stackwise.io", phone: "+254 720 110 998", role: "Inventory Manager", department: "Warehouse", manager: "Aisha Mwangi", location: "Mombasa DC", employmentType: "full_time", status: "active", joinedAt: "2023-07-02", salary: 165000, skills: ["WMS", "Cycle Counts"] },
  { id: "e3", code: "EMP-003", name: "Cynthia Wairimu", email: "cynthia@stackwise.io", phone: "+254 733 442 117", role: "Finance Lead", department: "Finance", location: "Nairobi HQ", employmentType: "full_time", status: "active", joinedAt: "2021-11-09", salary: 245000, skills: ["AP/AR", "Reconciliation", "Tax"] },
  { id: "e4", code: "EMP-004", name: "David Kiplagat", email: "david@stackwise.io", phone: "+254 701 553 008", role: "Procurement Officer", department: "Procurement", manager: "Aisha Mwangi", location: "Nairobi HQ", employmentType: "full_time", status: "on_leave", joinedAt: "2022-06-20", salary: 135000, skills: ["RFQ", "Vendor Mgmt"] },
  { id: "e5", code: "EMP-005", name: "Esther Naliaka", email: "esther@stackwise.io", phone: "+254 722 901 334", role: "Sales Executive", department: "Sales", location: "Kisumu Branch", employmentType: "full_time", status: "active", joinedAt: "2024-01-15", salary: 95000, skills: ["B2B", "CRM"] },
  { id: "e6", code: "EMP-006", name: "Felix Mutua", email: "felix@stackwise.io", phone: "+254 715 220 776", role: "Warehouse Associate", department: "Warehouse", manager: "Brian Otieno", location: "Mombasa DC", employmentType: "contract", status: "probation", joinedAt: "2026-02-01", salary: 52000, skills: ["Forklift", "Picking"] },
  { id: "e7", code: "EMP-007", name: "Grace Akinyi", email: "grace@stackwise.io", phone: "+254 728 116 553", role: "HR Business Partner", department: "People", location: "Nairobi HQ", employmentType: "full_time", status: "active", joinedAt: "2020-09-01", salary: 195000, skills: ["L&D", "Comp & Ben"] },
  { id: "e8", code: "EMP-008", name: "Hassan Abdi", email: "hassan@stackwise.io", phone: "+254 735 008 221", role: "IT Support", department: "IT", location: "Nairobi HQ", employmentType: "full_time", status: "active", joinedAt: "2023-04-18", salary: 110000, skills: ["Networking", "Helpdesk"] },
  { id: "e9", code: "EMP-009", name: "Irene Chebet", email: "irene@stackwise.io", phone: "+254 707 884 002", role: "Marketing Designer", department: "Marketing", location: "Remote", employmentType: "part_time", status: "active", joinedAt: "2024-08-05", salary: 75000, skills: ["Figma", "Brand"] },
  { id: "e10", code: "EMP-010", name: "Joseph Karanja", email: "joseph@stackwise.io", phone: "+254 711 552 998", role: "Driver", department: "Logistics", manager: "Brian Otieno", location: "Nairobi HQ", employmentType: "full_time", status: "inactive", joinedAt: "2019-05-22", salary: 48000, skills: ["Long-haul"] },
  { id: "e11", code: "EMP-011", name: "Khadija Yusuf", email: "khadija@stackwise.io", phone: "+254 716 220 117", role: "Customer Success", department: "Sales", location: "Nairobi HQ", employmentType: "full_time", status: "active", joinedAt: "2023-10-10", salary: 105000, skills: ["NPS", "Onboarding"] },
  { id: "e12", code: "EMP-012", name: "Leonard Wafula", email: "leonard@stackwise.io", phone: "+254 733 110 884", role: "Data Analyst", department: "IT", location: "Remote", employmentType: "full_time", status: "active", joinedAt: "2024-03-04", salary: 145000, skills: ["SQL", "PowerBI"] },
];

interface Ctx {
  employees: Employee[];
  add: (e: Omit<Employee, "id" | "code">) => Employee;
  update: (id: string, patch: Partial<Employee>) => void;
  remove: (id: string) => void;
}

const EmployeesCtx = createContext<Ctx | null>(null);

export function EmployeesProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(SEED);
  const value: Ctx = {
    employees,
    add: (e) => {
      const next: Employee = { ...e, id: `e${Date.now()}`, code: `EMP-${String(employees.length + 1).padStart(3, "0")}` };
      setEmployees((p) => [next, ...p]);
      return next;
    },
    update: (id, patch) => setEmployees((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    remove: (id) => setEmployees((p) => p.filter((x) => x.id !== id)),
  };
  return createElement(EmployeesCtx.Provider, { value }, children);
}

export function useEmployees(): Ctx {
  const ctx = useContext(EmployeesCtx);
  const [employees, setEmployees] = useState<Employee[]>(SEED);
  if (ctx) return ctx;
  return {
    employees,
    add: (e) => {
      const next: Employee = { ...e, id: `e${Date.now()}`, code: `EMP-${String(employees.length + 1).padStart(3, "0")}` };
      setEmployees((p) => [next, ...p]);
      return next;
    },
    update: (id, patch) => setEmployees((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    remove: (id) => setEmployees((p) => p.filter((x) => x.id !== id)),
  };
}

export const employeeInitials = initials;

export const DEPARTMENTS = ["Operations", "Warehouse", "Finance", "Procurement", "Sales", "People", "IT", "Marketing", "Logistics"];

export const STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: "Active",
  on_leave: "On leave",
  probation: "Probation",
  inactive: "Inactive",
};
