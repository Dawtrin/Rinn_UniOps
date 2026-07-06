import { useAuth } from '../context/AuthContext';
import AdminDashboard from './dashboards/AdminDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';
import MemberDashboard from './dashboards/MemberDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  // Member dashboard manages its own page header (hero-style)
  if (role === 'MEMBER' || !role) {
    return <MemberDashboard user={user} />;
  }

  return (
    <div>
      {role === 'ADMIN'   && <AdminDashboard user={user} />}
      {role === 'MANAGER' && <ManagerDashboard user={user} />}
    </div>
  );
}
