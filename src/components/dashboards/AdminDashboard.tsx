import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, CreditCard, Calendar, ArrowRight, TrendingUp } from "lucide-react";
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

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, courses: 0, enrollments: 0, sessions: 0 });
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [profilesRes, coursesRes, enrollmentsRes, sessionsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("courses").select("id", { count: "exact" }),
        supabase.from("enrollments").select("id", { count: "exact" }),
        supabase.from("sessions").select("id", { count: "exact" }),
      ]);
      setStats({
        users: profilesRes.count || 0,
        courses: coursesRes.count || 0,
        enrollments: enrollmentsRes.count || 0,
        sessions: sessionsRes.count || 0,
      });

      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("id, payment_status, created_at, courses(title), children(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (enrollData) setRecentEnrollments(enrollData as unknown as RecentEnrollment[]);
    };
    fetchData();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-primary bg-primary/10", link: "/dashboard/users" },
    { label: "Courses", value: stats.courses, icon: BookOpen, color: "text-secondary bg-secondary/10", link: "/dashboard/manage-courses" },
    { label: "Enrollments", value: stats.enrollments, icon: CreditCard, color: "text-accent bg-accent/10", link: "/dashboard/enrollments" },
    { label: "Sessions", value: stats.sessions, icon: Calendar, color: "text-success bg-success/10", link: "/dashboard/sessions" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-accent/10 text-accent border-accent/20",
    completed: "bg-success/10 text-success border-success/20",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-2">Admin Dashboard 📊</h1>
      <p className="text-muted-foreground mb-8">Platform overview and management</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Button variant="hero" size="lg" asChild className="h-auto py-4">
          <Link to="/dashboard/manage-courses" className="flex items-center gap-3">
            <BookOpen className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">Manage Courses</p>
              <p className="text-xs opacity-80">Add, edit, or remove</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
        </Button>
        <Button variant="hero-outline" size="lg" asChild className="h-auto py-4">
          <Link to="/dashboard/users" className="flex items-center gap-3">
            <Users className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">View Users</p>
              <p className="text-xs opacity-80">All registered users</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild className="h-auto py-4">
          <Link to="/dashboard/enrollments" className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">Enrollments</p>
              <p className="text-xs opacity-80">Track enrollments</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
        </Button>
      </div>

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
              <div key={e.id} className="bg-card rounded-xl border border-border/50 p-4 shadow-card flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{e.courses?.title}</p>
                  <p className="text-xs text-muted-foreground">{e.children?.name} · {new Date(e.created_at).toLocaleDateString()}</p>
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

export default AdminDashboard;
