import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Tasks from './pages/Tasks';
import Evaluations from './pages/Evaluations';
import Leaderboard from './pages/Leaderboard';
import AiAssistant from './pages/AiAssistant';
import Payments from './pages/Payments';
import Schedule from './pages/Schedule';
import Chat from './pages/Chat';
import HRManagement from './pages/HRManagement';
import OrgChart from './pages/OrgChart';
import MemberManagement from './pages/MemberManagement';
import Profile from './pages/Profile';
import AuditLogView from './pages/AuditLogView';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Apply from './pages/Apply';
import RecruitmentManagement from './pages/RecruitmentManagement';
import Finance from './pages/Finance';
import Inventory from './pages/Inventory';
import Resources from './pages/Resources';
import Polls from './pages/Polls';
import PublicEventDetail from './pages/PublicEventDetail';

// ─── Ambient Orbs (Admin/Manager only — hidden in member-mode via CSS) ────
function OrbBackground() {
  return (
    <>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </>
  );
}

// ─── Apply body class per role for theme switching ───────────────────────
function ThemeController() {
  const { user } = useAuth();
  useEffect(() => {
    const isMember = user?.role === 'MEMBER';
    document.body.classList.toggle('member-mode', isMember);
    return () => document.body.classList.remove('member-mode');
  }, [user?.role]);
  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
}

// ─── Page transition wrapper ─────────────────────────────────────────────
const pageVariants = {
  initial:  { opacity: 0, y: 10, filter: 'blur(4px)' },
  animate:  { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit:     { opacity: 0, y: -6, filter: 'blur(2px)', transition: { duration: 0.2,  ease: [0.4, 0, 1, 1] } },
};

function PageTransition({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Protected layout with sidebar (Outlet-based) ────────────────────────
function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <PageTransition><Outlet /></PageTransition>
      </main>
    </div>
  );
}

// ─── Guards (content wrappers) ───────────────────────────────────────────
function AdminGuard({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}

// ─── Guards (content wrappers) ───────────────────────────────────────────
function ManagerGuard({ children }) {
  const { user } = useAuth();
  if (!['ADMIN', 'MANAGER'].includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
      <Route path="/reset-password" element={user ? <Navigate to="/dashboard" /> : <ResetPassword />} />
      <Route path="/apply" element={<Apply />} />
      <Route path="/public/events/:id" element={<PublicEventDetail />} />

      {/* Protected Routes (share layout, prevents Sidebar remounting) */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard"    element={<Dashboard />} />
        <Route path="/events"       element={<Events />} />
        <Route path="/tasks"        element={<Tasks />} />
        <Route path="/evaluations"  element={<Evaluations />} />
        <Route path="/leaderboard"  element={<Leaderboard />} />
        <Route path="/ai-assistant" element={<AiAssistant />} />
        <Route path="/payments"     element={<Payments />} />
        <Route path="/finance"      element={<Finance />} />
        <Route path="/inventory"    element={<Inventory />} />
        <Route path="/resources"    element={<Resources />} />
        <Route path="/polls"        element={<Polls />} />

        {/* V2 features */}
        <Route path="/schedule"     element={<Schedule />} />
        <Route path="/chat"         element={<Chat />} />
        <Route path="/hr"           element={<ManagerGuard><HRManagement /></ManagerGuard>} />
        <Route path="/recruitment"  element={<ManagerGuard><RecruitmentManagement /></ManagerGuard>} />
        <Route path="/org-chart"    element={<OrgChart />} />
        <Route path="/members"      element={<AdminGuard><MemberManagement /></AdminGuard>} />
        <Route path="/audit-logs"   element={<AdminGuard><AuditLogView /></AdminGuard>} />
        <Route path="/profile"      element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <OrbBackground />
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ThemeController />
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
