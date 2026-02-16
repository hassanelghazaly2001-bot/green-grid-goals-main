import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchFixturesForLeagues } from "@/services/footballService";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import Index from "./pages/Index";
import MatchPage from "./pages/MatchPage";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
 

const queryClient = new QueryClient();

const AdminAccessButton = () => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate("/admin-panel")}
      className="fixed top-5 left-5 z-[9999] bg-red-600 text-white px-3 py-2 rounded-md shadow hover:bg-red-700"
    >
      Admin
    </button>
  );
};

const App = () => {
  useEffect(() => {
    fetchFixturesForLeagues()
      .then((data) => {
        console.log("FINAL_API_CHECK:", data);
        if (Array.isArray(data) && data.length > 0) {
          queryClient.setQueryData(["supabase-matches"], data);
        }
      })
      .catch((err) => {
        console.warn("FINAL_API_CHECK_ERROR:", err);
      });
  }, []);

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AdminAccessButton />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/match/:id" element={<MatchPage />} />
              <Route path="/admin-panel" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
};

export default App;
