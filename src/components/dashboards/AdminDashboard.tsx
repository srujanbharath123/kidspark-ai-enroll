import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, CreditCard, Calendar } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, courses: 0, enrollments: 0, sessions: 0 });

  useEffect(() => {
    const fetchStats = async () => {
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
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-primary bg-primary/10" },
    { label: "Courses", value: stats.courses, icon: BookOpen, color: "text-secondary bg-secondary/10" },
    { label: "Enrollments", value: stats.enrollments, icon: CreditCard, color: "text-accent bg-accent/10" },
    { label: "Sessions", value: stats.sessions, icon: Calendar, color: "text-success bg-success/10" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-2">Admin Dashboard 📊</h1>
      <p className="text-muted-foreground mb-8">Platform overview and management</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold font-display">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
