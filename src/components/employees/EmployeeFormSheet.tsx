import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Employee, EmployeeStatus, EmploymentType } from "./employees-store";
import { DEPARTMENTS } from "./employees-store";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Employee | null;
  onSave: (e: Omit<Employee, "id" | "code"> | Employee) => void;
}

const EMPTY: Omit<Employee, "id" | "code"> = {
  name: "", email: "", phone: "", role: "", department: "Operations", location: "Nairobi HQ",
  employmentType: "full_time", status: "active", joinedAt: new Date().toISOString().slice(0, 10),
  salary: 0, skills: [], manager: "", bio: "",
};

export function EmployeeFormSheet({ open, onOpenChange, initial, onSave }: Props) {
  const [f, setF] = useState<Omit<Employee, "id" | "code"> | Employee>(EMPTY);
  const [skillsText, setSkillsText] = useState("");

  useEffect(() => {
    if (initial) {
      setF(initial);
      setSkillsText(initial.skills.join(", "));
    } else {
      setF(EMPTY);
      setSkillsText("");
    }
  }, [initial, open]);

  function submit() {
    if (!f.name || !f.email) return;
    onSave({ ...f, skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean) });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white">
        <SheetHeader>
          <SheetTitle>{initial ? "Edit employee" : "Add employee"}</SheetTitle>
          <SheetDescription>Personnel record for HR and access control</SheetDescription>
        </SheetHeader>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Full name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div><Label>Role</Label><Input value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></div>
          <div>
            <Label>Department</Label>
            <Select value={f.department} onValueChange={(v) => setF({ ...f, department: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Manager</Label><Input value={f.manager ?? ""} onChange={(e) => setF({ ...f, manager: e.target.value })} /></div>
          <div><Label>Location</Label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
          <div>
            <Label>Employment</Label>
            <Select value={f.employmentType} onValueChange={(v) => setF({ ...f, employmentType: v as EmploymentType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full-time</SelectItem>
                <SelectItem value="part_time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="intern">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as EmployeeStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On leave</SelectItem>
                <SelectItem value="probation">Probation</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Joined</Label><Input type="date" value={f.joinedAt} onChange={(e) => setF({ ...f, joinedAt: e.target.value })} /></div>
          <div><Label>Salary (KES)</Label><Input type="number" value={f.salary} onChange={(e) => setF({ ...f, salary: Number(e.target.value) })} /></div>
          <div className="col-span-2"><Label>Skills (comma separated)</Label><Input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} /></div>
          <div className="col-span-2"><Label>Bio</Label><Textarea rows={3} value={f.bio ?? ""} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
        </div>
        <div className="mt-5 flex justify-end gap-1.5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save changes" : "Create employee"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
