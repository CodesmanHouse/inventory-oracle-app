import type { UserRoleType } from "@/lib/roles";

/** Maps route paths to the minimum roles allowed */
const ROUTE_ACCESS: Record<string, UserRoleType[]> = {
  "/app/dashboard": ["admin", "manager", "requestor"],
  "/app/catalog": ["admin", "manager", "requestor"],
  "/app/requests": ["admin", "manager", "requestor"],
  "/app/movements": ["admin", "manager"],
  "/app/suppliers": ["admin", "manager"],
  "/app/purchase-orders": ["admin", "manager", "requestor"],
  "/app/orders": ["admin", "manager", "requestor"],
  "/app/customers": ["admin", "manager", "requestor"],
  "/app/bank": ["admin", "manager"],
  "/app/debtors": ["admin", "manager"],
  "/app/creditors": ["admin", "manager"],
  "/app/expenses": ["admin", "manager", "requestor"],
  "/app/employees": ["admin", "manager"],
  "/app/chat": ["admin", "manager", "requestor"],
  "/app/locations": ["admin", "manager", "requestor"],
  "/app/analytics": ["admin", "manager"],
  "/app/ai-insights": ["admin", "manager"],
  "/app/settings": ["admin"],
};

export function canAccessRoute(path: string, role: UserRoleType): boolean {
  const allowed = ROUTE_ACCESS[path];
  if (!allowed) return role === "admin";
  return allowed.includes(role);
}
