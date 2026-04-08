import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Calendar, Clock, Users, UserPlus, Loader2, Check, X, Link2, Send, MessageCircle, Mail,
} from "lucide-react";

interface Trainer {
  user_id: string;
  full_name: string;
}

interface Slot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  trainer_id: string;
  trainer_name?: string;
}

interface Enrollment {
  id: string;
  parent_id: string;
  child_id: string;
  course_id: string;
  payment_status: string;
  children: { name: string; age: number; class: string | null; school: string | null } | null;
  courses: { title: string } | null;
  parent_name?: string;
}

interface Session {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  trainer_id: string;
  parent_id: string;
  child_id: string | null;
  course_id: string | null;
  meet_link: string | null;
  trainer_name?: string;
  child_name?: string;
  course_title?: string;
  parent_phone?: string;
  parent_email?: string;
}

const AdminSessionsPage = () => {
  const { role } = useAuth();
  const { toast } = useToast();

  // Slot creation
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);

  // Assignments
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [assignTrainer, setAssignTrainer] = useState<Record<string, string>>({});
  const [assignSlot, setAssignSlot] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState<string | null>(null);
  const [editingMeetLink, setEditingMeetLink] = useState<string | null>(null);
  const [meetLinkValue, setMeetLinkValue] = useState("");

  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);

    // Fetch trainers
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "trainer");
    const trainerIds = roleData?.map((r) => r.user_id) || [];

    let trainerProfiles: Trainer[] = [];
    if (trainerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", trainerIds);
      trainerProfiles = profiles || [];
    }
    setTrainers(trainerProfiles);

    const trainerMap = new Map(trainerProfiles.map((t) => [t.user_id, t.full_name]));

    // Fetch all slots
    const { data: slotsData } = await supabase
      .from("trainer_availability")
      .select("*")
      .order("date", { ascending: true });
    if (slotsData) {
      setSlots(slotsData.map((s) => ({ ...s, trainer_name: trainerMap.get(s.trainer_id) || "Unknown" })));
    }

    // Fetch enrollments that don't have a session assigned yet
    const { data: enrollData } = await supabase
      .from("enrollments")
      .select("id, parent_id, child_id, course_id, payment_status, children(name, age, class, school), courses(title)")
      .eq("payment_status", "completed")
      .order("created_at", { ascending: false });

    // Fetch all sessions to know which enrollments already have assignments
    const { data: sessData } = await supabase
      .from("sessions")
      .select("id, date, start_time, end_time, status, trainer_id, parent_id, child_id, course_id, meet_link")
      .order("date", { ascending: false });

    const assignedChildCourses = new Set(
      (sessData || []).map((s) => `${s.child_id}_${s.course_id}`)
    );

    // Get parent names and contact info for both enrollments and sessions
    const allParentIds = [...new Set([
      ...(enrollData || []).map((e) => e.parent_id),
      ...(sessData || []).map((s) => s.parent_id),
    ])];
    let parentMap = new Map<string, string>();
    let parentPhoneMap = new Map<string, string>();
    if (allParentIds.length > 0) {
      const { data: parentProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", allParentIds);
      parentMap = new Map((parentProfiles || []).map((p) => [p.user_id, p.full_name]));
      parentPhoneMap = new Map((parentProfiles || []).map((p) => [p.user_id, p.phone || ""]));
    }

    const unassigned = (enrollData || [])
      .filter((e) => !assignedChildCourses.has(`${e.child_id}_${e.course_id}`))
      .map((e) => ({
        ...e,
        children: e.children as Enrollment["children"],
        courses: e.courses as Enrollment["courses"],
        parent_name: parentMap.get(e.parent_id) || "Unknown",
      }));
    setEnrollments(unassigned);

    // Sessions with names
    if (sessData) {
      const childIds = [...new Set(sessData.filter((s) => s.child_id).map((s) => s.child_id!))];
      const courseIds = [...new Set(sessData.filter((s) => s.course_id).map((s) => s.course_id!))];
      let childMap = new Map<string, string>();
      let courseMap = new Map<string, string>();
      if (childIds.length > 0) {
        const { data: ch } = await supabase.from("children").select("id, name").in("id", childIds);
        childMap = new Map((ch || []).map((c) => [c.id, c.name]));
      }
      if (courseIds.length > 0) {
        const { data: co } = await supabase.from("courses").select("id, title").in("id", courseIds);
        courseMap = new Map((co || []).map((c) => [c.id, c.title]));
      }
      setSessions(
        sessData.map((s) => ({
          ...s,
          trainer_name: trainerMap.get(s.trainer_id) || "Unknown",
          child_name: s.child_id ? childMap.get(s.child_id) || "Unknown" : "N/A",
          course_title: s.course_id ? courseMap.get(s.course_id) || "Unknown" : "N/A",
          parent_phone: parentPhoneMap.get(s.parent_id) || "",
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  if (role !== "admin") return null;

  const handleAddSlot = async () => {
    if (!selectedTrainer || !date || !startTime || !endTime) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    if (startTime >= endTime) {
      toast({ title: "End time must be after start time", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("trainer_availability").insert({
      trainer_id: selectedTrainer,
      date,
      start_time: startTime,
      end_time: endTime,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Slot created! ✅" });
      setShowSlotForm(false);
      setDate("");
      setStartTime("");
      setEndTime("");
      fetchAll();
    }
  };

  const handleDeleteSlot = async (id: string) => {
    const { error } = await supabase.from("trainer_availability").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Slot deleted" });
      fetchAll();
    }
  };

  const handleAssignStudent = async (enrollment: Enrollment) => {
    const trainerId = assignTrainer[enrollment.id];
    const slotId = assignSlot[enrollment.id];
    if (!trainerId) {
      toast({ title: "Select a trainer", variant: "destructive" });
      return;
    }

    setAssigning(enrollment.id);
    try {
      // Find selected slot details (if slot selected)
      let sessionDate = new Date().toISOString().split("T")[0];
      let sessionStart = "09:00";
      let sessionEnd = "10:00";

      if (slotId) {
        const slot = slots.find((s) => s.id === slotId);
        if (slot) {
          sessionDate = slot.date;
          sessionStart = slot.start_time;
          sessionEnd = slot.end_time;
          // Mark slot as booked
          await supabase.from("trainer_availability").update({ is_booked: true }).eq("id", slotId);
        }
      }

      // Create session
      const { error } = await supabase.from("sessions").insert({
        parent_id: enrollment.parent_id,
        trainer_id: trainerId,
        child_id: enrollment.child_id,
        course_id: enrollment.course_id,
        availability_id: slotId || null,
        date: sessionDate,
        start_time: sessionStart,
        end_time: sessionEnd,
        status: "approved",
      });

      if (error) throw error;
      toast({ title: "Student assigned! ✅", description: `${enrollment.children?.name} assigned to trainer.` });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Assignment failed", description: err.message, variant: "destructive" });
    } finally {
      setAssigning(null);
    }
  };

  const handleSaveMeetLink = async (sessionId: string) => {
    const { error } = await supabase.from("sessions").update({ meet_link: meetLinkValue }).eq("id", sessionId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Meeting link saved! ✅" });
      setEditingMeetLink(null);
      setMeetLinkValue("");
      fetchAll();
    }
  };

  const buildInvitationMessage = (s: Session) => {
    return `📚 *Class Invitation*\n\n👧 Student: ${s.child_name}\n📖 Course: ${s.course_title}\n📅 Date: ${s.date}\n🕐 Time: ${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}\n👨‍🏫 Trainer: ${s.trainer_name}\n${s.meet_link ? `\n🔗 Meeting Link: ${s.meet_link}` : ""}\n\nPlease join on time. Thank you!`;
  };

  const handleSendWhatsApp = (s: Session) => {
    const phone = s.parent_phone?.replace(/[^0-9]/g, "") || "";
    if (!phone) {
      toast({ title: "No phone number", description: "Parent has no phone number on file.", variant: "destructive" });
      return;
    }
    const message = encodeURIComponent(buildInvitationMessage(s));
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const handleCopyEmail = (s: Session) => {
    const message = buildInvitationMessage(s).replace(/\*/g, "");
    navigator.clipboard.writeText(message);
    toast({ title: "Copied! 📋", description: "Invitation details copied to clipboard. Paste in your email." });
  };

  const statusColors: Record<string, string> = {
    pending: "bg-accent/10 text-accent border-accent/20",
    approved: "bg-primary/10 text-primary border-primary/20",
    completed: "bg-success/10 text-success border-success/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const availableSlotsForTrainer = (trainerId: string) =>
    slots.filter((s) => s.trainer_id === trainerId && !s.is_booked && s.date >= new Date().toISOString().split("T")[0]);

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold font-display mb-2">Session Management</h1>
        <p className="text-sm text-muted-foreground mb-8">Create slots, assign students to trainers</p>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Section 1: Create Slots */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-display flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Session Slots
                </h2>
                <Button variant="hero" size="sm" onClick={() => setShowSlotForm(true)}>
                  <Plus className="w-4 h-4" /> Create Slot
                </Button>
              </div>

              {showSlotForm && (
                <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card mb-4">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <Label>Trainer *</Label>
                      <select
                        value={selectedTrainer}
                        onChange={(e) => setSelectedTrainer(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm mt-1.5"
                      >
                        <option value="">Select trainer</option>
                        {trainers.map((t) => (
                          <option key={t.user_id} value={t.user_id}>{t.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Date *</Label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5 rounded-xl" />
                    </div>
                    <div>
                      <Label>Start Time *</Label>
                      <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1.5 rounded-xl" />
                    </div>
                    <div>
                      <Label>End Time *</Label>
                      <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1.5 rounded-xl" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="hero" size="sm" onClick={handleAddSlot}><Check className="w-4 h-4" /> Create</Button>
                    <Button variant="outline" size="sm" onClick={() => setShowSlotForm(false)}><X className="w-4 h-4" /> Cancel</Button>
                  </div>
                </div>
              )}

              {slots.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border/50 p-6 text-center shadow-card">
                  <p className="text-sm text-muted-foreground">No slots created yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {slots.filter((s) => s.date >= new Date().toISOString().split("T")[0]).map((slot) => (
                    <div key={slot.id} className="bg-card rounded-xl border border-border/50 p-3 shadow-card flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-semibold">{slot.date} · {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</p>
                          <p className="text-xs text-muted-foreground">{slot.trainer_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={slot.is_booked ? "bg-accent/10 text-accent" : "bg-success/10 text-success"}>
                          {slot.is_booked ? "Booked" : "Available"}
                        </Badge>
                        {!slot.is_booked && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteSlot(slot.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Assign Students to Trainers */}
            <div className="mb-10">
              <h2 className="text-lg font-bold font-display mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" /> Assign Students to Trainers
              </h2>

              {enrollments.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border/50 p-6 text-center shadow-card">
                  <p className="text-sm text-muted-foreground">All enrolled students have been assigned.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((enrollment) => {
                    const trainerForThis = assignTrainer[enrollment.id] || "";
                    const trainerSlots = trainerForThis ? availableSlotsForTrainer(trainerForThis) : [];
                    return (
                      <div key={enrollment.id} className="bg-card rounded-2xl border border-border/50 p-5 shadow-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">{enrollment.children?.name || "Student"}</p>
                            <p className="text-xs text-muted-foreground">
                              Age {enrollment.children?.age} · {enrollment.children?.class || "N/A"} · {enrollment.children?.school || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Course: <span className="font-medium text-foreground">{enrollment.courses?.title}</span> · Parent: {enrollment.parent_name}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 grid sm:grid-cols-3 gap-3 items-end">
                          <div>
                            <Label className="text-xs">Assign Trainer *</Label>
                            <select
                              value={trainerForThis}
                              onChange={(e) => {
                                setAssignTrainer((prev) => ({ ...prev, [enrollment.id]: e.target.value }));
                                setAssignSlot((prev) => ({ ...prev, [enrollment.id]: "" }));
                              }}
                              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm mt-1"
                            >
                              <option value="">Select trainer</option>
                              {trainers.map((t) => (
                                <option key={t.user_id} value={t.user_id}>{t.full_name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs">Select Slot (optional)</Label>
                            <select
                              value={assignSlot[enrollment.id] || ""}
                              onChange={(e) => setAssignSlot((prev) => ({ ...prev, [enrollment.id]: e.target.value }))}
                              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm mt-1"
                              disabled={!trainerForThis}
                            >
                              <option value="">No slot / manual</option>
                              {trainerSlots.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.date} · {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Button
                            variant="hero"
                            size="sm"
                            disabled={!trainerForThis || assigning === enrollment.id}
                            onClick={() => handleAssignStudent(enrollment)}
                            className="w-full sm:w-auto"
                          >
                            {assigning === enrollment.id ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</>
                            ) : (
                              <><UserPlus className="w-4 h-4" /> Assign</>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 3: All Sessions */}
            <div>
              <h2 className="text-lg font-bold font-display mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> All Sessions
              </h2>
              {sessions.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border/50 p-6 text-center shadow-card">
                  <p className="text-sm text-muted-foreground">No sessions yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s.id} className="bg-card rounded-xl border border-border/50 p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{s.child_name} – {s.course_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.date} · {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)} · Trainer: {s.trainer_name}
                        </p>
                      </div>
                      <Badge variant="outline" className={statusColors[s.status] || ""}>{s.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminSessionsPage;
