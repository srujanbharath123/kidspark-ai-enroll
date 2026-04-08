import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ChildrenPage from "./pages/ChildrenPage";
import CoursesPage from "./pages/CoursesPage";
import AdminCoursesPage from "./pages/AdminCoursesPage";
import EnrollmentsPage from "./pages/EnrollmentsPage";
import SessionsPage from "./pages/SessionsPage";
import TrainerAvailabilityPage from "./pages/TrainerAvailabilityPage";
import UsersPage from "./pages/UsersPage";
import EnrollPage from "./pages/EnrollPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/children" element={<ProtectedRoute allowedRoles={["parent"]}><ChildrenPage /></ProtectedRoute>} />
            <Route path="/dashboard/courses" element={<ProtectedRoute allowedRoles={["parent"]}><CoursesPage /></ProtectedRoute>} />
            <Route path="/dashboard/manage-courses" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCoursesPage /></ProtectedRoute>} />
            <Route path="/dashboard/enrollments" element={<ProtectedRoute allowedRoles={["parent", "admin"]}><EnrollmentsPage /></ProtectedRoute>} />
            <Route path="/dashboard/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
            <Route path="/dashboard/availability" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerAvailabilityPage /></ProtectedRoute>} />
            <Route path="/dashboard/users" element={<ProtectedRoute allowedRoles={["admin"]}><UsersPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
