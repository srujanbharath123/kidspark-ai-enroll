import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, X, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Slot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

interface Session {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  meet_link: string | null;
  profiles?: { full_name: string } | null;
  parent_profile?: { full_name: string } | null;
  children?: { name: string } | null;
}

const SessionsPage = () => {
  const { user, role } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<(Slot & { trainer_name: string; trainer_id: string })[]>([]);
  const [selectedChild, setSelectedChild] = useState("");
  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    if (!user) return;

    // Fetch sessions
    let sessionsQuery = supabase
      .from("sessions")
      .select("id, date, start_time, end_time, status, meet_link")
      .order("date", { ascending: false });

    if (role === "parent") sessionsQuery = sessionsQuery.eq("parent_id", user.id);
    if (role === "trainer") sessionsQuery = sessionsQuery.eq("trainer_id", user.id);

    const { data: sessionsData } = await sessionsQuery;
    if (sessionsData) setSessions(sessionsData);

    // Trainer: fetch own slots
    if (role === "trainer") {
      const { data: slotsData } = await supabase
        .from("trainer_availability")
        .select("*")
        .eq("trainer_id", user.id)
        .order("date");
      if (slotsData) setSlots(slotsData);
    }

    // Parent: fetch available slots for booking
    if (role === "parent") {
      const { data: availData } = await supabase
        .from("trainer_availability")
        .select("id, date, start_time, end_time, trainer_id")
        .eq("is_booked", false)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date");

      if (availData) {
        // Get trainer names
        const trainerIds = [...new Set(availData.map((s) => s.trainer_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", trainerIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
        setAvailableSlots(
          availData.map((s) => ({
            ...s,
            is_booked: false,
            trainer_name: profileMap.get(s.trainer_id) || "Trainer",
          }))
        );
      }

      const { data: childrenData } = await supabase.from("children").select("id, name").eq("parent_id", user.id);
      if (childrenData) setChildren(childrenData);
    }
  };

  useEffect(() => { fetchData(); }, [user, role]);

  const addSlot = async () => {
    if (!user || !date || !startTime || !endTime) return;
    const { error } = await supabase.from("trainer_availability").insert({
      trainer_id: user.id,
      date,
      start_time: startTime,
      end_time: endTime,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Slot added! ✅" });
      setShowSlotForm(false); setDate(""); setStartTime(""); setEndTime("");
      fetchData();
    }
  };

  const bookSession = async (slot: (typeof availableSlots)[0]) => {
    if (!user || !selectedChild) {
      toast({ title: "Select a child first", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("sessions").insert({
      parent_id: user.id,
      trainer_id: slot.trainer_id,
      child_id: selectedChild,
      availability_id: slot.id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
    });
    if (error) {
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
    } else {
      // Mark slot as booked
      await supabase.from("trainer_availability").update({ is_booked: true }).eq("id", slot.id);
      toast({ title: "Session booked! 🎉" });
      fetchData();
    }
  };

  const updateSessionStatus = async (sessionId: string, status: "pending" | "approved" | "completed" | "rejected") => {
    const { error } = await supabase.from("sessions").update({ status }).eq("id", sessionId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Session ${status}` });
      fetchData();
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-accent/10 text-accent border-accent/20",
    approved: "bg-primary/10 text-primary border-primary/20",
    completed: "bg-success/10 text-success border-success/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold font-display mb-2">Sessions</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {role === "trainer" ? "Manage your availability and sessions" : role === "parent" ? "Book and view sessions" : "All sessions"}
        </p>

        {/* Trainer: Add availability */}
        {role === "trainer" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-display">Your Availability</h2>
              <Button variant="hero" size="sm" onClick={() => setShowSlotForm(true)}>
                <Plus className="w-4 h-4" /> Add Slot
              </Button>
            </div>

            {showSlotForm && (
              <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card mb-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5 rounded-xl" />
                  </div>
                  <div>
                    <Label>Start Time</Label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1.5 rounded-xl" />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1.5 rounded-xl" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="hero" size="sm" onClick={addSlot}><Check className="w-4 h-4" /> Save</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowSlotForm(false)}><X className="w-4 h-4" /> Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {slots.map((slot) => (
                <div key={slot.id} className="bg-card rounded-xl border border-border/50 p-3 shadow-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{slot.date} · {slot.start_time} - {slot.end_time}</span>
                  </div>
                  <Badge variant="outline" className={slot.is_booked ? "bg-accent/10 text-accent" : "bg-success/10 text-success"}>
                    {slot.is_booked ? "Booked" : "Available"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parent: Book sessions */}
        {role === "parent" && availableSlots.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold font-display mb-4">Available Slots</h2>
            {children.length > 0 && (
              <div className="mb-4">
                <Label>Select Child</Label>
                <select
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="w-full max-w-xs rounded-xl border border-border bg-background px-3 py-2.5 text-sm mt-1.5"
                >
                  <option value="">Choose a child</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              {availableSlots.map((slot) => (
                <div key={slot.id} className="bg-card rounded-xl border border-border/50 p-4 shadow-card flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{slot.trainer_name}</p>
                    <p className="text-xs text-muted-foreground">{slot.date} · {slot.start_time} - {slot.end_time}</p>
                  </div>
                  <Button variant="hero" size="sm" onClick={() => bookSession(slot)} disabled={!selectedChild}>
                    Book
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All: Sessions list */}
        <div>
          <h2 className="text-lg font-bold font-display mb-4">
            {role === "trainer" ? "Your Sessions" : "Booking History"}
          </h2>
          {sessions.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border/50 p-8 text-center shadow-card">
              <p className="text-muted-foreground">No sessions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="bg-card rounded-2xl border border-border/50 p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{s.date} · {s.start_time} - {s.end_time}</p>
                    {s.meet_link && <a href={s.meet_link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Join Meeting</a>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColors[s.status] || ""}>{s.status}</Badge>
                    {role === "trainer" && s.status === "pending" && (
                      <div className="flex gap-1">
                        <Button variant="default" size="sm" onClick={() => updateSessionStatus(s.id, "approved")}>Approve</Button>
                        <Button variant="destructive" size="sm" onClick={() => updateSessionStatus(s.id, "rejected")}>Reject</Button>
                      </div>
                    )}
                    {role === "trainer" && s.status === "approved" && (
                      <Button variant="outline" size="sm" onClick={() => updateSessionStatus(s.id, "completed")}>Mark Complete</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SessionsPage;
