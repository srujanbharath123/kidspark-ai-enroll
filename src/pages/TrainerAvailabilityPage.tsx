import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Check, X, Calendar, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Slot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

const TrainerAvailabilityPage = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSlots = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("trainer_availability")
      .select("*")
      .eq("trainer_id", user.id)
      .order("date", { ascending: true });
    if (data) setSlots(data);
    setLoading(false);
  };

  useEffect(() => { fetchSlots(); }, [user]);

  const handleAdd = async () => {
    if (!user || !date || !startTime || !endTime) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    if (startTime >= endTime) {
      toast({ title: "End time must be after start time", variant: "destructive" });
      return;
    }
    setSaving(true);
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
      setDate(""); setStartTime(""); setEndTime(""); setShowForm(false);
      fetchSlots();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("trainer_availability").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Slot removed" });
      fetchSlots();
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const upcoming = slots.filter((s) => s.date >= today);
  const past = slots.filter((s) => s.date < today);

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display">My Availability</h1>
            <p className="text-sm text-muted-foreground">Set your available time slots for sessions</p>
          </div>
          <Button variant="hero" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Add Slot
          </Button>
        </div>

        {showForm && (
          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card mb-6">
            <h3 className="font-display font-semibold mb-4">New Time Slot</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <Label>Date</Label>
                <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5 rounded-xl" />
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
              <Button variant="hero" size="sm" onClick={handleAdd} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-lg font-bold font-display mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Upcoming ({upcoming.length})
              </h2>
              {upcoming.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border/50 p-6 text-center shadow-card">
                  <p className="text-muted-foreground">No upcoming slots. Add one to let parents book sessions!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((slot) => (
                    <div key={slot.id} className="bg-card rounded-xl border border-border/50 p-4 shadow-card flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-semibold">{new Date(slot.date + "T00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={slot.is_booked ? "bg-accent/10 text-accent border-accent/20" : "bg-success/10 text-success border-success/20"}>
                          {slot.is_booked ? "Booked" : "Available"}
                        </Badge>
                        {!slot.is_booked && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(slot.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {past.length > 0 && (
              <div>
                <h2 className="text-lg font-bold font-display mb-3 text-muted-foreground">Past ({past.length})</h2>
                <div className="space-y-2 opacity-60">
                  {past.map((slot) => (
                    <div key={slot.id} className="bg-card rounded-xl border border-border/50 p-4 shadow-card flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{new Date(slot.date + "T00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</p>
                        <p className="text-xs text-muted-foreground">{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</p>
                      </div>
                      <Badge variant="outline" className="bg-muted text-muted-foreground">Past</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrainerAvailabilityPage;
