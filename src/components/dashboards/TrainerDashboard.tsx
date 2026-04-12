import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, CheckCircle, Clock, ArrowRight, GraduationCap, Link2, MessageCircle, Mail, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface AssignedStudent {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  meet_link: string | null;
  availability_id: string | null;
  child_name: string;
  child_age: number;
  child_class: string | null;
  child_school: string | null;
  course_title: string;
  parent_name: string;
  parent_phone: string;
}

interface SlotWithStudents {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  booked_count: number;
  max_capacity: number;
  students: AssignedStudent[];
}

const TrainerDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({ slots: 0, pendingSessions: 0, completedSessions: 0, totalEnrolled: 0 });
  const [slotsWithStudents, setSlotsWithStudents] = useState<SlotWithStudents[]>([]);
  const [unlinkedStudents, setUnlinkedStudents] = useState<AssignedStudent[]>([]);
  const [editingMeetLink, setEditingMeetLink] = useState<string | null>(null);
  const [meetLinkValue, setMeetLinkValue] = useState("");
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [slotsCountRes, pendingRes, completedRes, availRes] = await Promise.all([
      supabase.from("trainer_availability").select("id", { count: "exact" }).eq("trainer_id", user.id),
      supabase.from("sessions").select("id", { count: "exact" }).eq("trainer_id", user.id).eq("status", "pending"),
      supabase.from("sessions").select("id", { count: "exact" }).eq("trainer_id", user.id).eq("status", "completed"),
      supabase.from("trainer_availability").select("id, date, start_time, end_time, booked_count, max_capacity").eq("trainer_id", user.id).gte("date", new Date().toISOString().split("T")[0]).order("date"),
    ]);

    const upcomingSlots = availRes.data || [];
    const totalEnrolled = upcomingSlots.reduce((sum, s) => sum + (s.booked_count || 0), 0);

    setStats({
      slots: slotsCountRes.count || 0,
      pendingSessions: pendingRes.count || 0,
      completedSessions: completedRes.count || 0,
      totalEnrolled,
    });

    // Fetch all sessions with child/course/parent details
    const { data: sessData } = await supabase
      .from("sessions")
      .select("id, date, start_time, end_time, status, child_id, course_id, parent_id, meet_link, availability_id")
      .eq("trainer_id", user.id)
      .in("status", ["pending", "approved"])
      .order("date", { ascending: true });

    if (!sessData || sessData.length === 0) {
      setSlotsWithStudents(upcomingSlots.map(s => ({ ...s, students: [] })));
      setUnlinkedStudents([]);
      return;
    }

    const childIds = [...new Set(sessData.filter(s => s.child_id).map(s => s.child_id!))];
    const courseIds = [...new Set(sessData.filter(s => s.course_id).map(s => s.course_id!))];
    const parentIds = [...new Set(sessData.map(s => s.parent_id))];

    const [childRes, courseRes, parentRes] = await Promise.all([
      childIds.length > 0 ? supabase.from("children").select("id, name, age, class, school").in("id", childIds) : { data: [] },
      courseIds.length > 0 ? supabase.from("courses").select("id, title").in("id", courseIds) : { data: [] },
      parentIds.length > 0 ? supabase.from("profiles").select("user_id, full_name, phone").in("user_id", parentIds) : { data: [] },
    ]);

    const childMap = new Map((childRes.data || []).map((c: any) => [c.id, c]));
    const courseMap = new Map((courseRes.data || []).map((c: any) => [c.id, c.title]));
    const parentMap = new Map((parentRes.data || []).map((p: any) => [p.user_id, p]));

    const allStudents: AssignedStudent[] = sessData
      .filter(s => s.child_id)
      .map(s => {
        const child = childMap.get(s.child_id!);
        const parent = parentMap.get(s.parent_id);
        return {
          id: s.id,
          date: s.date,
          start_time: s.start_time,
          end_time: s.end_time,
          status: s.status,
          meet_link: s.meet_link,
          availability_id: s.availability_id,
          child_name: child?.name || "Unknown",
          child_age: child?.age || 0,
          child_class: child?.class || null,
          child_school: child?.school || null,
          course_title: s.course_id ? courseMap.get(s.course_id) || "N/A" : "N/A",
          parent_name: parent?.full_name || "Unknown",
          parent_phone: parent?.phone || "",
        };
      });

    // Group students by slot
    const slotMap = new Map<string, SlotWithStudents>();
    for (const slot of upcomingSlots) {
      slotMap.set(slot.id, { ...slot, students: [] });
    }
    const unlinked: AssignedStudent[] = [];
    for (const student of allStudents) {
      if (student.availability_id && slotMap.has(student.availability_id)) {
        slotMap.get(student.availability_id)!.students.push(student);
      } else {
        unlinked.push(student);
      }
    }

    setSlotsWithStudents(Array.from(slotMap.values()));
    setUnlinkedStudents(unlinked);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime: listen for new enrollments (sessions) and slot updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("trainer-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions", filter: `trainer_id=eq.${user.id}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "trainer_availability", filter: `trainer_id=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchData]);

  const toggleSlot = (slotId: string) => {
    setExpandedSlots(prev => {
      const next = new Set(prev);
      next.has(slotId) ? next.delete(slotId) : next.add(slotId);
      return next;
    });
  };

  const buildInvitationMessage = (s: AssignedStudent) =>
    `📚 *Class Invitation*\n\n👧 Student: ${s.child_name}\n📖 Course: ${s.course_title}\n📅 Date: ${s.date}\n🕐 Time: ${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}\n👨‍🏫 Trainer: ${profile?.full_name || "Trainer"}\n${s.meet_link ? `\n🔗 Meeting Link: ${s.meet_link}` : ""}\n\nPlease join on time. Thank you!`;

  const handleSendWhatsApp = (s: AssignedStudent) => {
    const phone = s.parent_phone?.replace(/[^0-9]/g, "") || "";
    if (!phone) {
      toast({ title: "No phone number", description: "Parent has no phone number on file.", variant: "destructive" });
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildInvitationMessage(s))}`, "_blank");
  };

  const handleCopyEmail = (s: AssignedStudent) => {
    navigator.clipboard.writeText(buildInvitationMessage(s).replace(/\*/g, ""));
    toast({ title: "Copied! 📋", description: "Invitation details copied to clipboard." });
  };

  const handleSaveMeetLink = async (sessionId: string) => {
    const { error } = await supabase.from("sessions").update({ meet_link: meetLinkValue }).eq("id", sessionId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Meeting link saved! ✅" });
      setEditingMeetLink(null);
      setMeetLinkValue("");
      fetchData();
    }
  };

  const cards = [
    { label: "Time Slots", value: stats.slots, icon: Calendar, color: "text-primary bg-primary/10", link: "/dashboard/availability" },
    { label: "Enrolled Students", value: stats.totalEnrolled, icon: GraduationCap, color: "text-secondary bg-secondary/10", link: "/dashboard/availability" },
    { label: "Pending Sessions", value: stats.pendingSessions, icon: Users, color: "text-accent bg-accent/10", link: "/dashboard/sessions" },
    { label: "Completed", value: stats.completedSessions, icon: CheckCircle, color: "text-success bg-success/10", link: "/dashboard/sessions" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-accent/10 text-accent border-accent/20",
    approved: "bg-primary/10 text-primary border-primary/20",
  };

  const renderStudentCard = (s: AssignedStudent) => (
    <div key={s.id} className="bg-muted/30 rounded-xl border border-border/30 p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold">{s.child_name}</p>
          <p className="text-xs text-muted-foreground">Age {s.child_age} · {s.child_class || "N/A"} · {s.child_school || "N/A"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Course: <span className="font-medium text-foreground">{s.course_title}</span> · Parent: {s.parent_name}
          </p>
          {s.meet_link && (
            <a href={s.meet_link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
              <Link2 className="w-3 h-3" /> {s.meet_link}
            </a>
          )}
        </div>
        <Badge variant="outline" className={statusColors[s.status] || ""}>{s.status}</Badge>
      </div>

      {editingMeetLink === s.id ? (
        <div className="mt-2 flex items-center gap-2">
          <Input value={meetLinkValue} onChange={e => setMeetLinkValue(e.target.value)} placeholder="https://meet.google.com/..." className="rounded-xl text-sm flex-1" />
          <Button variant="hero" size="sm" onClick={() => handleSaveMeetLink(s.id)}><Check className="w-4 h-4" /> Save</Button>
          <Button variant="outline" size="sm" onClick={() => setEditingMeetLink(null)}><X className="w-4 h-4" /></Button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditingMeetLink(s.id); setMeetLinkValue(s.meet_link || ""); }}>
            <Link2 className="w-4 h-4" /> {s.meet_link ? "Edit Link" : "Add Meet Link"}
          </Button>
          {s.meet_link && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleSendWhatsApp(s)} className="text-success">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleCopyEmail(s)} className="text-primary">
                <Mail className="w-4 h-4" /> Copy
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-2">
        Hello, {profile?.full_name?.split(" ")[0] || "Trainer"} 🎓
      </h1>
      <p className="text-muted-foreground mb-8">Manage your sessions and availability</p>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {cards.map(card => (
          <Link key={card.label} to={card.link} className="bg-card rounded-2xl border border-border/50 p-6 shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold font-display">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Button variant="hero" size="lg" asChild className="h-auto py-4">
          <Link to="/dashboard/availability" className="flex items-center gap-3">
            <Calendar className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">Manage Availability</p>
              <p className="text-xs opacity-80">Add or remove time slots</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
        </Button>
        <Button variant="hero-outline" size="lg" asChild className="h-auto py-4">
          <Link to="/dashboard/sessions" className="flex items-center gap-3">
            <Users className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">View Sessions</p>
              <p className="text-xs opacity-80">Approve or manage bookings</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
        </Button>
      </div>

      {/* Slots with Enrolled Students */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold font-display flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" /> Available Slots & Enrolled Students
          </h2>
          <Link to="/dashboard/sessions" className="text-xs text-primary hover:underline">View all →</Link>
        </div>

        {slotsWithStudents.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-6 text-center shadow-card">
            <p className="text-sm text-muted-foreground">No upcoming slots. Add availability to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {slotsWithStudents.map(slot => {
              const pct = slot.max_capacity > 0 ? Math.round((slot.booked_count / slot.max_capacity) * 100) : 0;
              const isFull = slot.booked_count >= slot.max_capacity;
              const isExpanded = expandedSlots.has(slot.id);

              return (
                <div key={slot.id} className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
                  {/* Slot Header */}
                  <button
                    onClick={() => toggleSlot(slot.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="text-sm font-semibold">
                          {new Date(slot.date + "T00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${isFull ? "bg-accent" : "bg-primary"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <Badge variant="outline" className={isFull ? "bg-accent/10 text-accent border-accent/20" : "bg-success/10 text-success border-success/20"}>
                          {slot.booked_count}/{slot.max_capacity}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.students.length > 0 && (
                        <Badge variant="secondary" className="text-xs">{slot.students.length} student{slot.students.length !== 1 ? "s" : ""}</Badge>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded Student List */}
                  {isExpanded && (
                    <div className="border-t border-border/30 p-4 space-y-2">
                      {slot.students.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">No students enrolled in this slot yet.</p>
                      ) : (
                        slot.students.map(renderStudentCard)
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unlinked Students (sessions without a slot) */}
      {unlinkedStudents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold font-display flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-accent" /> Other Assigned Students
          </h2>
          <div className="space-y-2">
            {unlinkedStudents.map(renderStudentCard)}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerDashboard;
