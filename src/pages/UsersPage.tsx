import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Check, X, Eye, EyeOff, Loader2, UserPlus, Search } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  role?: string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [trainerName, setTrainerName] = useState("");
  const [trainerEmail, setTrainerEmail] = useState("");
  const [trainerPassword, setTrainerPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { toast } = useToast();

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = !searchQuery || u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (!profiles) return;
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const roleMap = new Map((roles || []).map((r) => [r.user_id, r.role]));
    setUsers(profiles.map((p) => ({ ...p, role: roleMap.get(p.user_id) || "parent" })));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateTrainer = async () => {
    if (!trainerName.trim() || !trainerEmail.trim() || !trainerPassword) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    if (trainerPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-trainer", {
        body: { email: trainerEmail.trim(), password: trainerPassword, full_name: trainerName.trim() },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Failed to create trainer");
      toast({ title: "Trainer created! ✅", description: `${trainerName} can now log in.` });
      setShowForm(false);
      setTrainerName("");
      setTrainerEmail("");
      setTrainerPassword("");
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const roleColors: Record<string, string> = {
    admin: "bg-primary/10 text-primary border-primary/20",
    trainer: "bg-accent/10 text-accent border-accent/20",
    parent: "bg-success/10 text-success border-success/20",
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold font-display">Users</h1>
          <Button variant="hero" size="sm" onClick={() => setShowForm(true)}>
            <UserPlus className="w-4 h-4" /> Add Trainer
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">All registered users</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[160px] rounded-xl">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="trainer">Trainer</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showForm && (
          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card mb-6">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" /> Create New Trainer
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={trainerName} onChange={(e) => setTrainerName(e.target.value)}
                  placeholder="e.g. John Doe" className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={trainerEmail} onChange={(e) => setTrainerEmail(e.target.value)}
                  placeholder="trainer@example.com" className="mt-1.5 rounded-xl" />
              </div>
            </div>
            <div className="mb-4 max-w-sm">
              <Label>Password *</Label>
              <div className="relative mt-1.5">
                <Input type={showPassword ? "text" : "password"} value={trainerPassword}
                  onChange={(e) => setTrainerPassword(e.target.value)}
                  placeholder="Min 6 characters" className="rounded-xl pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="hero" size="sm" onClick={handleCreateTrainer} disabled={creating}>
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Check className="w-4 h-4" /> Create Trainer</>}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}><X className="w-4 h-4" /> Cancel</Button>
            </div>
          </div>
        )}

        {users.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-8 text-center shadow-card">
            <p className="text-muted-foreground">No users yet.</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">#</TableHead>
                  <TableHead className="font-bold">Name</TableHead>
                  <TableHead className="font-bold">Phone</TableHead>
                  <TableHead className="font-bold">Role</TableHead>
                  <TableHead className="font-bold">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u, i) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-semibold">{u.full_name || "Unnamed"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleColors[u.role || "parent"] || ""}>
                        {u.role || "parent"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;
