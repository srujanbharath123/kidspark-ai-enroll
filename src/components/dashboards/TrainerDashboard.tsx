import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, CheckCircle, Clock, ArrowRight, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PendingSession {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface AssignedStudent {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  child_name: string;
  child_age: number;
  child_class: string | null;
  child_school: string | null;
  course_title: string;
  parent_name: string;
}

const TrainerDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ slots: 0, pendingSessions: 0, completedSessions: 0 });
  const [pendingSessions, setPendingSessions] = useState<PendingSession[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudent[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [slotsRes, pendingRes, completedRes] = await Promise.all([
        supabase.from("trainer_availability").select("id", { count: "exact" }).eq("trainer_id", user.id),
        supabase.from("sessions").select("id", { count: "exact" }).eq("trainer_id", user.id).eq("status", "pending"),
        supabase.from("sessions").select("id", { count: "exact" }).eq("trainer_id", user.id).eq("status", "completed"),
      ]);
      setStats({
        slots: slotsRes.count || 0,
        pendingSessions: pendingRes.count || 0,
        completedSessions: completedRes.count || 0,
      });

      const { data: sessData } = await supabase
        .from("sessions")
        .select("id, date, start_time, end_time, status, child_id, course_id, parent_id")
        .eq("trainer_id", user.id)
        .order("date", { ascending: false });

      if (sessData) {
        const pending = sessData.filter((s) => s.status === "pending").slice(0, 5);
        setPendingSessions(pending);

        // Fetch child, course, parent details for all sessions
        const childIds = [...new Set(sessData.filter((s) => s.child_id).map((s) => s.child_id!))];
        const courseIds = [...new Set(sessData.filter((s) => s.course_id).map((s) => s.course_id!))];
        const parentIds = [...new Set(sessData.map((s) => s.parent_id))];

        const [childRes, courseRes, parentRes] = await Promise.all([
          childIds.length > 0 ? supabase.from("children").select("id, name, age, class, school").in("id", childIds) : { data: [] },
          courseIds.length > 0 ? supabase.from("courses").select("id, title").in("id", courseIds) : { data: [] },
          parentIds.length > 0 ? supabase.from("profiles").select("user_id, full_name").in("user_id", parentIds) : { data: [] },
        ]);

        const childMap = new Map((childRes.data || []).map((c) => [c.id, c]));
        const courseMap = new Map((courseRes.data || []).map((c) => [c.id, c.title]));
        const parentMap = new Map((parentRes.data || []).map((p) => [p.user_id, p.full_name]));

        const assigned: AssignedStudent[] = sessData
          .filter((s) => s.child_id && (s.status === "approved" || s.status === "pending"))
          .map((s) => {
            const child = childMap.get(s.child_id!);
            return {
              id: s.id,
              date: s.date,
              start_time: s.start_time,
              end_time: s.end_time,
              status: s.status,
              child_name: child?.name || "Unknown",
              child_age: child?.age || 0,
              child_class: child?.class || null,
              child_school: child?.school || null,
              course_title: s.course_id ? courseMap.get(s.course_id) || "N/A" : "N/A",
              parent_name: parentMap.get(s.parent_id) || "Unknown",
            };
          });
        setAssignedStudents(assigned);
      }
    };
    fetchData();
  }, [user]);

  const cards = [
    { label: "Time Slots", value: stats.slots, icon: Calendar, color: "text-primary bg-primary/10", link: "/dashboard/availability" },
    { label: "Pending Sessions", value: stats.pendingSessions, icon: Users, color: "text-accent bg-accent/10", link: "/dashboard/sessions" },
    { label: "Completed", value: stats.completedSessions, icon: CheckCircle, color: "text-success bg-success/10", link: "/dashboard/sessions" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-accent/10 text-accent border-accent/20",
    approved: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-2">
        Hello, {profile?.full_name?.split(" ")[0] || "Trainer"} 🎓
      </h1>
      <p className="text-muted-foreground mb-8">Manage your sessions and availability</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className="bg-card rounded-2xl border border-border/50 p-6 shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold font-display">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </Link>
        ))}
      </div>

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

      {/* Assigned Students */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold font-display flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" /> Assigned Students
          </h2>
          <Link to="/dashboard/sessions" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        {assignedStudents.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-6 text-center shadow-card">
            <p className="text-sm text-muted-foreground">No students assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignedStudents.map((s) => (
              <div key={s.id} className="bg-card rounded-2xl border border-border/50 p-4 shadow-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold">{s.child_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Age {s.child_age} · {s.child_class || "N/A"} · {s.child_school || "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Course: <span className="font-medium text-foreground">{s.course_title}</span> · Parent: {s.parent_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(s.date + "T00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })} · {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                    </p>
                  </div>
                  <Badge variant="outline" className={statusColors[s.status] || ""}>{s.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingSessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-display">Pending Approvals</h2>
            <Link to="/dashboard/sessions" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {pendingSessions.map((s) => (
              <div key={s.id} className="bg-card rounded-xl border border-border/50 p-4 shadow-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold">
                      {new Date(s.date + "T00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Pending</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerDashboard;
