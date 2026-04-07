import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import ParentDashboard from "@/components/dashboards/ParentDashboard";
import TrainerDashboard from "@/components/dashboards/TrainerDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";

const Dashboard = () => {
  const { role } = useAuth();

  return (
    <DashboardLayout>
      {role === "admin" && <AdminDashboard />}
      {role === "trainer" && <TrainerDashboard />}
      {role === "parent" && <ParentDashboard />}
    </DashboardLayout>
  );
};

export default Dashboard;
