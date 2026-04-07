import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, Calendar, CreditCard } from "lucide-react";

const ParentDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ children: 0, enrollments: 0, sessions: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
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
    };
    fetchStats();
  }, [user]);

  const cards = [
    { label: "Children", value: stats.children, icon: Users, color: "text-primary bg-primary/10" },
    { label: "Enrollments", value: stats.enrollments, icon: BookOpen, color: "text-secondary bg-secondary/10" },
    { label: "Sessions", value: stats.sessions, icon: Calendar, color: "text-accent bg-accent/10" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-2">
        Welcome back, {profile?.full_name?.split(" ")[0] || "Parent"} 👋
      </h1>
      <p className="text-muted-foreground mb-8">Here's your bootcamp overview</p>

      <div className="grid sm:grid-cols-3 gap-4">
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

export default ParentDashboard;
