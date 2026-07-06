import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import api from '../api';
import {
  LayoutDashboard, CalendarDays, CheckSquare, Star, Brain,
  CreditCard, BarChart3, LogOut, Zap, Users, Shield,
  MessageCircle, Network, UserCheck, Clock, ChevronRight,
  Bell, Trash2, Check, X, Sun, Moon,
  UserPlus, DollarSign, Package, FolderOpen, Vote
} from 'lucide-react';
import './Sidebar.css';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';
import logoImg from '../assets/logo.jpg';

// ─── Navigation config per role ─────────────────────────
const NAV_BY_ROLE = {
  ADMIN: [
    {
      sectionKey: 'sidebar.sections.overview',
      items: [
        { path: '/dashboard',    icon: <LayoutDashboard size={15} />, labelKey: 'sidebar.links.dashboard' },
        { path: '/org-chart',    icon: <Network size={15} />,          labelKey: 'sidebar.links.org_chart', badge: 'NEW' },
      ],
    },
    {
      sectionKey: 'sidebar.sections.hr',
      items: [
        { path: '/hr',           icon: <UserCheck size={15} />,        labelKey: 'sidebar.links.hr_assign', badge: 'NEW' },
        { path: '/recruitment',  icon: <UserPlus size={15} />,         labelKey: 'sidebar.links.recruitment', badge: 'NEW' },
        { path: '/evaluations',  icon: <BarChart3 size={15} />,        labelKey: 'sidebar.links.kpi' },
        { path: '/leaderboard',  icon: <Star size={15} />,             labelKey: 'sidebar.links.leaderboard' },
      ],
    },
    {
      sectionKey: 'sidebar.sections.events',
      items: [
        { path: '/schedule',     icon: <Clock size={15} />,            labelKey: 'sidebar.links.schedule', badge: 'NEW' },
        { path: '/events',       icon: <CalendarDays size={15} />,     labelKey: 'sidebar.links.events_list' },
      ],
    },
    {
      sectionKey: 'sidebar.sections.tasks',
      items: [
        { path: '/tasks',        icon: <CheckSquare size={15} />,      labelKey: 'sidebar.links.tasks_manage' },
      ],
    },
    {
      sectionKey: 'sidebar.sections.chat',
      items: [
        { path: '/chat',         icon: <MessageCircle size={15} />,    labelKey: 'sidebar.links.chat_messages', unread: true },
        { path: '/ai-assistant', icon: <Brain size={15} />,            labelKey: 'sidebar.links.ai_assistant' },
        { path: '/polls',        icon: <Vote size={15} />,             labelKey: 'sidebar.links.polls', badge: 'NEW' },
      ],
    },
    {
      sectionKey: 'sidebar.sections.system',
      items: [
        { path: '/members',      icon: <Shield size={15} />,           labelKey: 'sidebar.links.accounts', badge: 'NEW' },
        { path: '/audit-logs',   icon: <Clock size={15} />,            labelKey: 'sidebar.links.audit_logs', badge: 'NEW' },
        { path: '/payments',     icon: <CreditCard size={15} />,       labelKey: 'sidebar.links.payments' },
        { path: '/finance',      icon: <DollarSign size={15} />,       labelKey: 'sidebar.links.finance', badge: 'NEW' },
        { path: '/inventory',    icon: <Package size={15} />,          labelKey: 'sidebar.links.inventory', badge: 'NEW' },
        { path: '/resources',    icon: <FolderOpen size={15} />,       labelKey: 'sidebar.links.resources', badge: 'NEW' },
      ],
    },
  ],
  MANAGER: [
    {
      sectionKey: 'sidebar.sections.overview',
      items: [
        { path: '/dashboard',    icon: <LayoutDashboard size={15} />, labelKey: 'sidebar.links.dashboard' },
        { path: '/org-chart',    icon: <Network size={15} />,          labelKey: 'sidebar.links.org_chart_dept', badge: 'NEW' },
      ],
    },
    {
      sectionKey: 'sidebar.sections.hr',
      items: [
        { path: '/hr',           icon: <UserCheck size={15} />,        labelKey: 'sidebar.links.hr_assign', badge: 'NEW' },
        { path: '/recruitment',  icon: <UserPlus size={15} />,         labelKey: 'sidebar.links.recruitment', badge: 'NEW' },
        { path: '/evaluations',  icon: <BarChart3 size={15} />,        labelKey: 'sidebar.links.kpi_manager' },
        { path: '/leaderboard',  icon: <Star size={15} />,             labelKey: 'sidebar.links.leaderboard' },
      ],
    },
    {
      sectionKey: 'sidebar.sections.events',
      items: [
        { path: '/schedule',     icon: <Clock size={15} />,            labelKey: 'sidebar.links.schedule', badge: 'NEW' },
        { path: '/events',       icon: <CalendarDays size={15} />,     labelKey: 'sidebar.links.events_list' },
      ],
    },
    {
      sectionKey: 'sidebar.sections.tasks',
      items: [
        { path: '/tasks',        icon: <CheckSquare size={15} />,      labelKey: 'sidebar.links.tasks_manage' },
      ],
    },
    {
      sectionKey: 'sidebar.sections.chat',
      items: [
        { path: '/chat',         icon: <MessageCircle size={15} />,    labelKey: 'sidebar.links.chat_messages', unread: true },
        { path: '/ai-assistant', icon: <Brain size={15} />,            labelKey: 'sidebar.links.ai_assistant' },
        { path: '/polls',        icon: <Vote size={15} />,             labelKey: 'sidebar.links.polls', badge: 'NEW' },
      ],
    },
    {
      sectionKey: 'sidebar.sections.system',
      items: [
        { path: '/finance',      icon: <DollarSign size={15} />,       labelKey: 'sidebar.links.finance', badge: 'NEW' },
        { path: '/inventory',    icon: <Package size={15} />,          labelKey: 'sidebar.links.inventory', badge: 'NEW' },
        { path: '/resources',    icon: <FolderOpen size={15} />,       labelKey: 'sidebar.links.resources', badge: 'NEW' },
      ],
    },
  ],
  MEMBER: [
    {
      sectionKey: 'sidebar.sections.my_stuff',
      items: [
        { path: '/dashboard',    icon: <LayoutDashboard size={15} />, labelKey: 'sidebar.links.overview' },
        { path: '/schedule',     icon: <Clock size={15} />,            labelKey: 'sidebar.links.schedule_week', badge: 'NEW' },
        { path: '/tasks',        icon: <CheckSquare size={15} />,      labelKey: 'sidebar.links.tasks_mine' },
      ],
    },
    {
      sectionKey: 'sidebar.sections.community',
      items: [
        { path: '/chat',         icon: <MessageCircle size={15} />,    labelKey: 'sidebar.links.chat_messages', unread: true },
        { path: '/leaderboard',  icon: <Star size={15} />,             labelKey: 'sidebar.links.leaderboard' },
        { path: '/polls',        icon: <Vote size={15} />,             labelKey: 'sidebar.links.polls', badge: 'NEW' },
        { path: '/resources',    icon: <FolderOpen size={15} />,       labelKey: 'sidebar.links.resources', badge: 'NEW' },
      ],
    },
    {
      sectionKey: 'sidebar.sections.personal',
      items: [
        { path: '/evaluations',  icon: <BarChart3 size={15} />,        labelKey: 'sidebar.links.kpi_self' },
        { path: '/payments',     icon: <CreditCard size={15} />,       labelKey: 'sidebar.links.payments_pay' },
        { path: '/inventory',    icon: <Package size={15} />,          labelKey: 'sidebar.links.inventory', badge: 'NEW' },
      ],
    },
  ],
};

const ROLE_META = {
  ADMIN:   { labelKey: 'sidebar.roles.admin',  avatarClass: 'sidebar-avatar-admin',   icon: <Shield size={14}/>,  color: '#c084fc' },
  MANAGER: { labelKey: 'sidebar.roles.manager', avatarClass: 'sidebar-avatar-manager', icon: <Users size={14}/>,   color: '#38bdf8' },
  MEMBER:  { labelKey: 'sidebar.roles.member',  avatarClass: 'sidebar-avatar-member',  icon: <Zap size={14}/>,     color: '#34d399' },
};

const sidebarVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, toggleLanguage } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const role = user?.role || 'MEMBER';
  const navGroups = NAV_BY_ROLE[role] || NAV_BY_ROLE.MEMBER;
  const meta = ROLE_META[role] || ROLE_META.MEMBER;
  const getInitials = (name) => name?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?';
  const fullName = user?.fullName || user?.full_name || 'User';

  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data?.data?.unreadCount ?? res.data?.unreadCount ?? 0);
    } catch (err) {
      console.error('Lỗi khi tải số thông báo chưa đọc:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách thông báo:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 45000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleOpenNotifications = () => {
    loadNotifications();
    setShowNotif(true);
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Lỗi khi đọc thông báo:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Lỗi khi đọc tất cả thông báo:', err);
    }
  };

  const handleDeleteNotif = async (id, isRead) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (!isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Lỗi khi xóa thông báo:', err);
    }
  };

  return (
    <motion.aside
      className="sidebar"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon" style={{ background: 'none', boxShadow: 'none' }}>
          <img src={logoImg} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
        </div>
        <div>
          <div className="logo-title">Club OS</div>
          <div className="logo-sub">v2.0</div>
        </div>
      </div>

      {/* Navigation — grouped by section */}
      <nav className="sidebar-nav">
        {navGroups.map((group, gi) => (
          <div key={group.sectionKey}>
            <div className="sidebar-nav-section">{t(group.sectionKey)}</div>
            {group.items.map((item, ii) => (
              <motion.div
                key={item.path}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.05 + gi * 0.04 + ii * 0.03, duration: 0.3, ease: [0.16,1,0.3,1] }}
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span>{t(item.labelKey)}</span>
                  {item.badge === 'NEW' && <span className="sidebar-new-badge">NEW</span>}
                  {item.unread && <span className="sidebar-unread">2</span>}
                </NavLink>
              </motion.div>
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <motion.div
        className="sidebar-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.55, duration: 0.4 } }}
      >
        <div className="sidebar-user" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }} title="Xem trang cá nhân">
          <div className={`sidebar-avatar ${meta.avatarClass}`} style={{ border: `1.5px solid ${meta.color}40` }}>
            {getInitials(fullName)}
          </div>
          <div className="sidebar-userinfo">
            <div className="sidebar-username">{fullName}</div>
            <div className="sidebar-role-label" style={{ color: meta.color }}>{t(meta.labelKey)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <motion.button
            onClick={toggleLanguage}
            className="sidebar-logout"
            title={lang === 'vi' ? 'English' : 'Tiếng Việt'}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{ fontSize: '0.66rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
          >
            {lang === 'vi' ? 'EN' : 'VI'}
          </motion.button>
          <motion.button
            onClick={toggleTheme}
            className="sidebar-logout"
            title={theme === 'dark' ? t('sidebar.links.theme_light') || 'Chế độ sáng' : t('sidebar.links.theme_dark') || 'Chế độ tối'}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </motion.button>
          <motion.button
            onClick={handleOpenNotifications}
            className="sidebar-logout"
            title={t('sidebar.links.notif') || 'Thông báo'}
            style={{ position: 'relative' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'var(--danger)',
                color: '#fff',
                fontSize: '0.62rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 2px var(--bg-surface)'
              }}>
                {unreadCount}
              </span>
            )}
          </motion.button>
          <motion.button
            onClick={handleLogout}
            className="sidebar-logout"
            title={t('sidebar.links.logout') || 'Đăng xuất'}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LogOut size={14} />
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showNotif && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotif(false)}
              className="drawer-overlay"
              style={{ zIndex: 1000 }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="drawer"
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 'min(400px, 90vw)',
                background: 'var(--bg-2)',
                borderLeft: '1px solid var(--border-color)',
                boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
                zIndex: 1001,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={18} className="text-purple" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Thông báo</h3>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowNotif(false)}>
                  <X size={16} />
                </button>
              </div>

              {unreadCount > 0 && (
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={handleMarkAllRead} 
                  style={{ alignSelf: 'flex-start', fontSize: '0.74rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Check size={12} /> Đánh dấu đọc tất cả
                </button>
              )}

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notifications.length === 0 ? (
                  <div className="empty-state" style={{ margin: 'auto' }}>
                    <Bell size={36} className="text-muted" style={{ opacity: 0.5 }} />
                    <p style={{ fontSize: '0.84rem' }}>Không có thông báo mới</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                      className={`attention-item ${!n.isRead ? 'unread' : ''}`}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: !n.isRead ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-3)',
                        borderLeft: !n.isRead ? '3px solid var(--accent)' : '3px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        position: 'relative',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: 20 }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: !n.isRead ? 600 : 500, color: 'var(--text-1)' }}>{n.title}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteNotif(n.id, n.isRead); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            opacity: 0.6,
                            position: 'absolute',
                            right: 8,
                            top: 8,
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>{n.message}</p>
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-3)', alignSelf: 'flex-end', fontFamily: 'monospace' }}>
                        {new Date(n.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
