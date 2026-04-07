import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, CheckCircle, Clock, ArrowRight } from "lucide-react";
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

const TrainerDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ slots: 0, pendingSessions: 0, completedSessions: 0 });
  const [pendingSessions, setPendingSessions] = useState<PendingSession[]>([]);

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
        .select("id, date, start_time, end_time, status")
        .eq("trainer_id", user.id)
        .eq("status", "pending")
        .order("date")
        .limit(5);
      if (sessData) setPendingSessions(sessData);
    };
    fetchData();
  }, [user]);

  const cards = [
    { label: "Time Slots", value: stats.slots, icon: Calendar, color: "text-primary bg-primary/10", link: "/dashboard/availability" },
    { label: "Pending Sessions", value: stats.pendingSessions, icon: Users, color: "text-accent bg-accent/10", link: "/dashboard/sessions" },
    { label: "Completed", value: stats.completedSessions, icon: CheckCircle, color: "text-success bg-success/10", link: "/dashboard/sessions" },
  ];

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
