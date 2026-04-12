import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, Calendar, ArrowRight, Clock, Link2, FileText, Video, Bell, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RecentEnrollment {
  id: string;
  payment_status: string;
  created_at: string;
  courses: { title: string } | null;
  children: { name: string } | null;
}

interface UpcomingSession {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  meet_link: string | null;
  trainer_name: string;
  child_name: string;
  course_title: string;
}

interface SessionMaterial {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  material_type: string;
  created_at: string;
  session_date: string;
  trainer_name: string;
}

const materialIcon = (type: string) => {
  switch (type) {
    case "pdf": return <FileText className="w-4 h-4 text-destructive" />;
    case "video": return <Video className="w-4 h-4 text-primary" />;
    case "link": return <Link2 className="w-4 h-4 text-secondary" />;
    default: return <Bell className="w-4 h-4 text-accent" />;
  }
};

const materialBadgeColor: Record<string, string> = {
  pdf: "bg-destructive/10 text-destructive border-destructive/20",
  video: "bg-primary/10 text-primary border-primary/20",
  link: "bg-secondary/10 text-secondary border-secondary/20",
  notification: "bg-accent/10 text-accent border-accent/20",
};

const ParentDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ children: 0, enrollments: 0, sessions: 0 });
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [materials, setMaterials] = useState<SessionMaterial[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [childrenRes, enrollRes, sessionsRes] = await Promise.all([
        supabase.from("children").select("id", { count: "exact" }).eq("parent_id", user.id),
        supabase.from("enrollments").select("id", { count: "exact" }).eq("parent_id", user.id),
        supabase.from("sessions").select("id", { count: "exact" }).eq("parent_id", user.id),
      ]);
      setStats({
        children: childrenRes.count || 0,
        enrollments: enrollRes.count || 0,
        sessions: sessionsRes.count || 0,
      });

      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("id, payment_status, created_at, courses(title), children(name)")
        .eq("parent_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (enrollData) setRecentEnrollments(enrollData as unknown as RecentEnrollment[]);

      // Fetch ALL sessions (upcoming + recent past) for display
      const { data: allSessions } = await supabase
        .from("sessions")
        .select("id, date, start_time, end_time, status, meet_link, trainer_id, child_id, course_id")
        .eq("parent_id", user.id)
        .order("date", { ascending: false })
        .limit(30);

      if (allSessions && allSessions.length > 0) {
        const trainerIds = [...new Set(allSessions.map(s => s.trainer_id))];
        const childIds = [...new Set(allSessions.filter(s => s.child_id).map(s => s.child_id!))];
        const courseIds = [...new Set(allSessions.filter(s => s.course_id).map(s => s.course_id!))];

        const [trainerRes, childRes, courseRes] = await Promise.all([
          trainerIds.length > 0 ? supabase.from("profiles").select("user_id, full_name").in("user_id", trainerIds) : { data: [] },
          childIds.length > 0 ? supabase.from("children").select("id, name").in("id", childIds) : { data: [] },
          courseIds.length > 0 ? supabase.from("courses").select("id, title").in("id", courseIds) : { data: [] },
        ]);

        const trainerMap = new Map((trainerRes.data || []).map((t: any) => [t.user_id, t.full_name]));
        const childMap = new Map((childRes.data || []).map((c: any) => [c.id, c.name]));
        const courseMap = new Map((courseRes.data || []).map((c: any) => [c.id, c.title]));

        const today = new Date().toISOString().split("T")[0];
        const upcomingOnly = allSessions
          .filter(s => s.date >= today)
          .sort((a, b) => a.date.localeCompare(b.date));

        setUpcomingSessions(upcomingOnly.slice(0, 5).map(s => ({
          id: s.id,
          date: s.date,
          start_time: s.start_time,
          end_time: s.end_time,
          status: s.status,
          meet_link: s.meet_link,
          trainer_name: trainerMap.get(s.trainer_id) || "Trainer",
          child_name: s.child_id ? childMap.get(s.child_id) || "" : "",
          course_title: s.course_id ? courseMap.get(s.course_id) || "" : "",
        })));

        // Fetch materials for ALL sessions in one query
        const allSessionIds = allSessions.map(s => s.id);
        const { data: matData } = await supabase
          .from("session_materials")
          .select("id, title, description, file_url, material_type, created_at, session_id, trainer_id")
          .in("session_id", allSessionIds)
          .order("created_at", { ascending: false })
          .limit(20);

        if (matData && matData.length > 0) {
          const matTrainerIds = [...new Set(matData.map(m => m.trainer_id))];
          const { data: matTrainers } = await supabase.from("profiles").select("user_id, full_name").in("user_id", matTrainerIds);
          const matTrainerMap = new Map((matTrainers || []).map((t: any) => [t.user_id, t.full_name]));
          const sessionDateMap = new Map(allSessions.map(s => [s.id, s.date]));

          setMaterials(matData.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            file_url: m.file_url,
            material_type: m.material_type,
            created_at: m.created_at,
            session_date: sessionDateMap.get(m.session_id) || "",
            trainer_name: matTrainerMap.get(m.trainer_id) || "Trainer",
          })));
        }
      }
    };
    fetchData();
  }, [user]);

  const cards = [
    { label: "Children", value: stats.children, icon: Users, color: "text-primary bg-primary/10", link: "/dashboard/children" },
    { label: "Enrollments", value: stats.enrollments, icon: BookOpen, color: "text-secondary bg-secondary/10", link: "/dashboard/enrollments" },
    { label: "Sessions", value: stats.sessions, icon: Calendar, color: "text-accent bg-accent/10", link: "/dashboard/sessions" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-accent/10 text-accent border-accent/20",
    completed: "bg-success/10 text-success border-success/20",
    approved: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-2">
        Welcome back, {profile?.full_name?.split(" ")[0] || "Parent"} 👋
      </h1>
      <p className="text-muted-foreground mb-8">Here's your bootcamp overview</p>

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

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Button variant="hero" size="lg" asChild className="h-auto py-4">
          <Link to="/dashboard/courses" className="flex items-center gap-3">
            <BookOpen className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">Browse Courses</p>
              <p className="text-xs opacity-80">Enroll your child in a program</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
        </Button>
        <Button variant="hero-outline" size="lg" asChild className="h-auto py-4">
          <Link to="/dashboard/sessions" className="flex items-center gap-3">
            <Calendar className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">Book a Session</p>
              <p className="text-xs opacity-80">Schedule time with a trainer</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
        </Button>
      </div>

      {/* Upcoming Sessions with Meeting Links */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold font-display flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Upcoming Sessions
          </h2>
          <Link to="/dashboard/sessions" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        {upcomingSessions.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-6 text-center shadow-card">
            <p className="text-sm text-muted-foreground">No upcoming sessions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map((s) => (
              <div key={s.id} className="bg-card rounded-2xl border border-border/50 p-4 shadow-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold">
                        {new Date(s.date + "T00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      <Badge variant="outline" className={statusColors[s.status] || ""}>{s.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                    </p>
                    {s.trainer_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">Trainer: <span className="font-medium text-foreground">{s.trainer_name}</span></p>
                    )}
                    {s.child_name && (
                      <p className="text-xs text-muted-foreground">Student: <span className="font-medium text-foreground">{s.child_name}</span></p>
                    )}
                    {s.course_title && (
                      <p className="text-xs text-muted-foreground">Course: <span className="font-medium text-foreground">{s.course_title}</span></p>
                    )}
                  </div>
                  {s.meet_link && (
                    <a
                      href={s.meet_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" /> Join Meeting
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Materials & Notifications from Trainer */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold font-display flex items-center gap-2">
            <Bell className="w-5 h-5 text-accent" /> Materials & Notifications
          </h2>
        </div>
        {materials.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-6 text-center shadow-card">
            <p className="text-sm text-muted-foreground">No materials or notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {materials.map((m) => (
              <div key={m.id} className="bg-card rounded-xl border border-border/50 p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{materialIcon(m.material_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold truncate">{m.title}</p>
                      <Badge variant="outline" className={`text-[10px] ${materialBadgeColor[m.material_type] || ""}`}>
                        {m.material_type}
                      </Badge>
                    </div>
                    {m.description && (
                      <p className="text-xs text-muted-foreground mb-1">{m.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      From {m.trainer_name} · Session {m.session_date ? new Date(m.session_date + "T00:00").toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : ""} · {new Date(m.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {m.file_url && (
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs font-medium hover:bg-muted/80 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Enrollments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold font-display">Recent Enrollments</h2>
          <Link to="/dashboard/enrollments" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        {recentEnrollments.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-6 text-center shadow-card">
            <p className="text-sm text-muted-foreground">No enrollments yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentEnrollments.map((e) => (
              <div key={e.id} className="bg-card rounded-xl border border-border/50 p-3 shadow-card flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{e.courses?.title}</p>
                  <p className="text-xs text-muted-foreground">{e.children?.name}</p>
                </div>
                <Badge variant="outline" className={statusColors[e.payment_status] || ""}>{e.payment_status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
