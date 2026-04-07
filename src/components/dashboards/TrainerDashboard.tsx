import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, CheckCircle } from "lucide-react";

const TrainerDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ slots: 0, pendingSessions: 0, completedSessions: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
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
    };
    fetchStats();
  }, [user]);

  const cards = [
    { label: "Time Slots", value: stats.slots, icon: Calendar, color: "text-primary bg-primary/10" },
    { label: "Pending Sessions", value: stats.pendingSessions, icon: Users, color: "text-accent bg-accent/10" },
    { label: "Completed", value: stats.completedSessions, icon: CheckCircle, color: "text-success bg-success/10" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-2">
        Hello, {profile?.full_name?.split(" ")[0] || "Trainer"} 🎓
      </h1>
      <p className="text-muted-foreground mb-8">Manage your sessions and availability</p>

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

export default TrainerDashboard;
