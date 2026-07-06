import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// If stored user is from old format (missing role), clear it
function loadStoredUser() {
  try {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (stored && !stored.role) {
      // Old/corrupt session — wipe it
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      console.warn('[AuthContext] Cleared stale user (no role field)');
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);
  const [token, setToken] = useState(() =>
    localStorage.getItem('user') ? localStorage.getItem('token') : null
  );

  const login = (userData, jwtToken, refreshJwtToken) => {
    // Normalize: ensure we always have a flat user object with role at top level
    const normalized = {
      id:         userData.id,
      fullName:   userData.fullName || userData.full_name,
      email:      userData.email,
      role:       userData.role,          // ADMIN | MANAGER | MEMBER
      xp:         userData.xp ?? 0,
      level:      userData.level ?? 1,
      departmentId:   userData.departmentId,
      departmentName: userData.departmentName,
      avatarUrl:  userData.avatarUrl,
    };
    console.log('[AuthContext] normalized user:', normalized);
    setUser(normalized);
    setToken(jwtToken);
    localStorage.setItem('user', JSON.stringify(normalized));
    localStorage.setItem('token', jwtToken);
    if (refreshJwtToken) {
      localStorage.setItem('refreshToken', refreshJwtToken);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  const isAdmin   = () => user?.role === 'ADMIN';
  const isManager = () => user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const isMember  = () => user?.role === 'MEMBER';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isManager, isMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
