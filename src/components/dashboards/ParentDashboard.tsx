import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, Calendar, ArrowRight, Clock, Link2 } from "lucide-react";
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
}

const ParentDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ children: 0, enrollments: 0, sessions: 0 });
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);

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

      const today = new Date().toISOString().split("T")[0];
      const { data: sessData } = await supabase
        .from("sessions")
        .select("id, date, start_time, end_time, status, meet_link")
        .eq("parent_id", user.id)
        .gte("date", today)
        .order("date")
        .limit(3);
      if (sessData) setUpcomingSessions(sessData);
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

      {/* Recent Enrollments */}
      <div className="grid lg:grid-cols-2 gap-6">
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

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-display">Upcoming Sessions</h2>
            <Link to="/dashboard/sessions" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border/50 p-6 text-center shadow-card">
              <p className="text-sm text-muted-foreground">No upcoming sessions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingSessions.map((s) => (
                <div key={s.id} className="bg-card rounded-xl border border-border/50 p-3 shadow-card flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold">
                        {new Date(s.date + "T00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</p>
                      {s.meet_link && (
                        <a href={s.meet_link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                          <Link2 className="w-3 h-3" /> Join Meeting
                        </a>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={statusColors[s.status] || ""}>{s.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
