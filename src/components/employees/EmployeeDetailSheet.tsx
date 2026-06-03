import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Briefcase, Calendar, Wallet, Award, MessageSquare, Pencil } from "lucide-react";
import type { Employee } from "./employees-store";
import { employeeInitials, STATUS_LABEL } from "./employees-store";
import { Link } from "@tanstack/react-router";

interface Props {
  employee: Employee | null;
  onClose: () => void;
  onEdit: (e: Employee) => void;
}

function tenure(joined: string) {
  const d = new Date(joined);
  const now = new Date();
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y && `${y}y`, m && `${m}mo`].filter(Boolean).join(" ") || "<1mo";
}

export function EmployeeDetailSheet({ employee, onClose, onEdit }: Props) {
  if (!employee) return null;
  const e = employee;
  return (
    <Sheet open={!!employee} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white">
        <SheetHeader>
          <SheetTitle className="sr-only">{e.name}</SheetTitle>
        </SheetHeader>
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold text-lg">
            {employeeInitials(e.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold truncate">{e.name}</h2>
              <Badge variant="secondary" className="font-mono text-[10px]">{e.code}</Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{e.role} · {e.department}</p>
            <div className="mt-2 flex gap-1.5">
              <Badge className="bg-emerald-500/10 text-emerald-700">{STATUS_LABEL[e.status]}</Badge>
              <Badge variant="outline" className="capitalize">{e.employmentType.replace("_", " ")}</Badge>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Row icon={<Mail className="h-3.5 w-3.5" />} label="Email">{e.email}</Row>
          <Row icon={<Phone className="h-3.5 w-3.5" />} label="Phone">{e.phone}</Row>
          <Row icon={<MapPin className="h-3.5 w-3.5" />} label="Location">{e.location}</Row>
          <Row icon={<Briefcase className="h-3.5 w-3.5" />} label="Manager">{e.manager || "—"}</Row>
          <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Tenure">{tenure(e.joinedAt)} · since {e.joinedAt}</Row>
          <Row icon={<Wallet className="h-3.5 w-3.5" />} label="Salary">KES {e.salary.toLocaleString()}</Row>
        </div>

        {e.skills.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1.5"><Award className="h-3 w-3" /> Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {e.skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
            </div>
          </div>
        )}

        {e.bio && <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{e.bio}</p>}

        <div className="mt-5 flex gap-1.5">
          <Button onClick={() => onEdit(e)}><Pencil className="h-4 w-4 mr-1.5" />Edit</Button>
          <Button variant="outline" asChild><Link to="/app/chat"><MessageSquare className="h-4 w-4 mr-1.5" />Message</Link></Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
      <div className="mt-0.5 font-medium truncate">{children}</div>
    </div>
  );
}
