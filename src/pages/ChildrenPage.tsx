import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Child {
  id: string;
  name: string;
  age: number;
}

const ChildrenPage = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchChildren = async () => {
    if (!user) return;
    const { data } = await supabase.from("children").select("*").eq("parent_id", user.id).order("created_at");
    if (data) setChildren(data);
  };

  useEffect(() => { fetchChildren(); }, [user]);

  const handleSave = async () => {
    if (!user || !name.trim() || !age) return;
    const ageNum = parseInt(age);
    if (ageNum < 4 || ageNum > 18) {
      toast({ title: "Invalid age", description: "Age must be between 4 and 18", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      if (editingId) {
        await supabase.from("children").update({ name: name.trim(), age: ageNum }).eq("id", editingId);
        toast({ title: "Updated!" });
      } else {
        await supabase.from("children").insert({ parent_id: user.id, name: name.trim(), age: ageNum });
        toast({ title: "Child added! 🎉" });
      }
      setName(""); setAge(""); setShowForm(false); setEditingId(null);
      fetchChildren();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("children").delete().eq("id", id);
    toast({ title: "Removed" });
    fetchChildren();
  };

  const startEdit = (child: Child) => {
    setName(child.name); setAge(String(child.age)); setEditingId(child.id); setShowForm(true);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display">My Children</h1>
            <p className="text-sm text-muted-foreground">Add your children to enroll them in courses</p>
          </div>
          <Button variant="hero" size="sm" onClick={() => { setShowForm(true); setEditingId(null); setName(""); setAge(""); }}>
            <Plus className="w-4 h-4" /> Add Child
          </Button>
        </div>

        {showForm && (
          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card mb-6">
            <h3 className="font-display font-semibold mb-4">{editingId ? "Edit" : "Add"} Child</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Child's name" className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label>Age (8–16)</Label>
                <Input type="number" min={4} max={18} value={age} onChange={(e) => setAge(e.target.value)} placeholder="10" className="mt-1.5 rounded-xl" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="hero" size="sm" onClick={handleSave} disabled={isLoading}>
                <Check className="w-4 h-4" /> {editingId ? "Update" : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>
                <X className="w-4 h-4" /> Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {children.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border/50 p-8 text-center shadow-card">
              <p className="text-muted-foreground">No children added yet. Click "Add Child" to get started!</p>
            </div>
          ) : (
            children.map((child) => (
              <div key={child.id} className="bg-card rounded-2xl border border-border/50 p-4 shadow-card flex items-center justify-between">
                <div>
                  <p className="font-semibold">{child.name}</p>
                  <p className="text-sm text-muted-foreground">Age: {child.age}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(child)}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(child.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChildrenPage;
