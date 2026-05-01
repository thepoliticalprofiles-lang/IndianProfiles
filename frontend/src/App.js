import { useEffect, useState, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

// Pages
import HomePage from "./pages/public/HomePage";
import StatePage from "./pages/public/StatePage";
import ConstituencyPage from "./pages/public/ConstituencyPage";
import DistrictPage from "./pages/public/DistrictPage";
import DivisionPage from "./pages/public/DivisionPage";
import LeaderProfilePage from "./pages/public/LeaderProfilePage";
import LeadersPage from "./pages/public/LeadersPage";
import ArticlePage from "./pages/public/ArticlePage";
import ArticlesPage from "./pages/public/ArticlesPage";
import GetInvolvedPage from "./pages/public/GetInvolvedPage";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import GeographyManager from "./pages/admin/GeographyManager";
import ProfileManager from "./pages/admin/ProfileManager";
import ArticleEditor from "./pages/admin/ArticleEditor";
import GrievanceDesk from "./pages/admin/GrievanceDesk";
import VolunteerManager from "./pages/admin/VolunteerManager";
import EventManager from "./pages/admin/EventManager";
import VoterAnalytics from "./pages/admin/VoterAnalytics";
import SocialHub from "./pages/admin/SocialHub";
import DataIngestion from "./pages/admin/DataIngestion";
import UserManagement from "./pages/admin/UserManagement";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// API helper with credentials
export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Error formatter with detailed logging
export const formatApiError = (error) => {
  // Log detailed error for debugging
  console.error("API Error Details:", {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message,
    url: error.config?.url
  });
  
  const detail = error.response?.data?.detail;
  if (detail == null) {
    // Check for other error formats
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.data?.error) return error.response.data.error;
    if (error.message) return error.message;
    return "Something went wrong. Please try again.";
  }
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (e) {
      setUser(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data);
    return data;
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/state/:id" element={<StatePage />} />
          <Route path="/constituency/:id" element={<ConstituencyPage />} />
          <Route path="/district/:id" element={<DistrictPage />} />
          <Route path="/division/:id" element={<DivisionPage />} />
          <Route path="/leaders" element={<LeadersPage />} />
          <Route path="/leader/:id" element={<LeaderProfilePage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/article/:id" element={<ArticlePage />} />
          <Route path="/get-involved" element={<GetInvolvedPage />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/voter-analytics" element={<ProtectedRoute><VoterAnalytics /></ProtectedRoute>} />
          <Route path="/admin/social-hub" element={<ProtectedRoute><SocialHub /></ProtectedRoute>} />
          <Route path="/admin/geography" element={<ProtectedRoute><GeographyManager /></ProtectedRoute>} />
          <Route path="/admin/leaders" element={<ProtectedRoute><ProfileManager /></ProtectedRoute>} />
          <Route path="/admin/leaders/:id" element={<ProtectedRoute><ProfileManager /></ProtectedRoute>} />
          <Route path="/admin/articles" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
          <Route path="/admin/articles/:id" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
          <Route path="/admin/grievances" element={<ProtectedRoute><GrievanceDesk /></ProtectedRoute>} />
          <Route path="/admin/volunteers" element={<ProtectedRoute><VolunteerManager /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute><EventManager /></ProtectedRoute>} />
          <Route path="/admin/data-ingestion" element={<ProtectedRoute><DataIngestion /></ProtectedRoute>} />
          <Route path="/admin/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
