import { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { 
  Users, UserCheck, Shield, Trash2, Search, 
  Edit2, UserPlus, X, Check, Lock, Unlock, ShieldAlert,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function MemberManagement() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTab, setEditTab] = useState('info');
  
  const [newUser, setNewUser] = useState({ fullName: '', email: '', phone: '', password: '', role: 'MEMBER', departmentId: '' });
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Reset page to 1 when any filter changes
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, deptFilter, activeFilter]);

  // Load departments
  const loadDepartments = () => {
    api.get('/departments')
      .then(r => {
        const rawData = r.data?.data || r.data;
        setDepartments(Array.isArray(rawData) ? rawData : []);
      })
      .catch(() => {
        toast('Không thể tải danh sách ban hoạt động', 'error');
        setDepartments([]);
      });
  };

  // Load users
  const loadUsers = () => {
    setLoading(true);
    api.get('/users')
      .then(r => {
        const rawData = r.data?.data || r.data;
        setUsers(Array.isArray(rawData) ? rawData : []);
      })
      .catch(() => {
        toast('Không thể tải danh sách thành viên', 'error');
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
    loadDepartments();
  }, []);

  // Update user role, department, active state
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.fullName?.trim()) {
      toast('Họ và tên không được để trống', 'error');
      setEditTab('info');
      return;
    }
    if (!editingUser.email?.trim()) {
      toast('Địa chỉ Email không được để trống', 'error');
      setEditTab('account');
      return;
    }
    try {
      await api.put(`/users/${editingUser.id}`, {
        fullName: editingUser.fullName,
        phone: editingUser.phone,
        role: editingUser.role,
        departmentId: editingUser.departmentId || null,
        isActive: editingUser.isActive,
        email: editingUser.email,
        password: editingUser.password || null
      });
      toast('Cập nhật tài khoản thành công', 'success');
      loadUsers();
      setShowEditModal(false);
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi cập nhật tài khoản', 'error');
    }
  };

  // Lock or unlock user
  const handleToggleLock = async (user) => {
    const nextActive = !user.isActive;
    try {
      await api.put(`/users/${user.id}`, {
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        departmentId: user.department?.id || null,
        isActive: nextActive
      });
      toast(`Đã ${nextActive ? 'mở khóa' : 'khóa'} tài khoản thành công`, 'success');
      loadUsers();
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi thay đổi trạng thái tài khoản', 'error');
    }
  };

  // Add new user from admin dashboard
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.email || !newUser.password) {
      toast('Vui lòng điền đầy đủ các trường bắt buộc', 'error');
      return;
    }
    try {
      const res = await api.post('/auth/register', {
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        password: newUser.password
      });
      
      const createdUser = res.data?.data?.user || res.data?.user;
      if (createdUser && createdUser.id) {
        // If Admin specified a custom role or department, update them immediately
        if (newUser.role !== 'MEMBER' || newUser.departmentId) {
          await api.put(`/users/${createdUser.id}`, {
            fullName: newUser.fullName,
            phone: newUser.phone,
            role: newUser.role,
            departmentId: newUser.departmentId || null,
            isActive: true
          });
        }
      }
      
      toast('Tạo tài khoản mới thành công', 'success');
      loadUsers();
      setShowAddModal(false);
      setNewUser({ fullName: '', email: '', phone: '', password: '', role: 'MEMBER', departmentId: '' });
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi tạo tài khoản mới', 'error');
    }
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search);
      
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesActive = activeFilter === 'ALL' || 
      (activeFilter === 'ACTIVE' && u.isActive) || 
      (activeFilter === 'LOCKED' && !u.isActive);

    const matchesDept = deptFilter === 'ALL' ||
      (deptFilter === 'NONE' && !u.department) ||
      (u.department?.id === parseInt(deptFilter));

    return matchesSearch && matchesRole && matchesActive && matchesDept;
  }).sort((a, b) => b.id - a.id);

  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / pageSize);
  const currentUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1>⚙️ Quản lý tài khoản</h1>
          <p>Quản trị thành viên, cấp vai trò và kiểm soát tài khoản toàn CLB</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)} style={{ gap: 6 }}>
          <UserPlus size={14} /> Thêm tài khoản
        </button>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            placeholder="Tìm theo tên, email hoặc SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 34, height: 38, background: 'var(--glass-thick)', border: '0.5px solid var(--border-glass-default)', borderRadius: 8, color: 'var(--text-1)', fontSize: '0.84rem', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <select 
            value={roleFilter} 
            onChange={e => setRoleFilter(e.target.value)}
            style={{ height: 38, padding: '0 12px', background: 'var(--glass-thick)', border: '0.5px solid var(--border-glass-default)', borderRadius: 8, color: 'var(--text-1)', fontSize: '0.84rem', outline: 'none' }}
          >
            <option value="ALL">Tất cả chức vụ</option>
            <option value="ADMIN">Chủ nhiệm (Admin)</option>
            <option value="MANAGER">Trưởng ban (Manager)</option>
            <option value="MEMBER">Thành viên (Member)</option>
          </select>

          <select 
            value={deptFilter} 
            onChange={e => setDeptFilter(e.target.value)}
            style={{ height: 38, padding: '0 12px', background: 'var(--glass-thick)', border: '0.5px solid var(--border-glass-default)', borderRadius: 8, color: 'var(--text-1)', fontSize: '0.84rem', outline: 'none' }}
          >
            <option value="ALL">Tất cả phân ban</option>
            <option value="NONE">Chưa phân ban</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select 
            value={activeFilter} 
            onChange={e => setActiveFilter(e.target.value)}
            style={{ height: 38, padding: '0 12px', background: 'var(--glass-thick)', border: '0.5px solid var(--border-glass-default)', borderRadius: 8, color: 'var(--text-1)', fontSize: '0.84rem', outline: 'none' }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Bị khóa</option>
          </select>
        </div>
      </div>

      {/* User Table Grid */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>Thành viên</th>
              <th>Địa chỉ Email</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Ban hoạt động</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right', paddingRight: 20 }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map(user => (
              <tr key={user.id} style={{ opacity: user.isActive ? 1 : 0.55 }}>
                <td style={{ paddingLeft: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="chat-avatar-sm" style={{ background: user.role === 'ADMIN' ? 'linear-gradient(135deg,#c084fc,#8b5cf6)' : user.role === 'MANAGER' ? 'linear-gradient(135deg,#38bdf8,#3b82f6)' : 'linear-gradient(135deg,#34d399,#10b981)', fontSize: '0.72rem', flexShrink: 0 }}>
                      {user.fullName?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.84rem' }}>{user.fullName}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Cấp độ {user.level || 1} ({user.xp || 0} XP)</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.84rem', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{user.email}</td>
                <td style={{ fontSize: '0.84rem', color: 'var(--text-2)' }}>{user.phone || '—'}</td>
                <td>
                  <span className={`badge ${user.role === 'ADMIN' ? 'badge-purple' : user.role === 'MANAGER' ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ fontSize: '0.84rem', color: 'var(--text-2)' }}>{user.department?.name || 'Chưa phân ban'}</td>
                <td>
                  <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                    {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', paddingRight: 20 }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-ghost btn-icon btn-sm" 
                      onClick={() => { 
                        setEditingUser({ 
                          ...user, 
                          departmentId: user.department?.id || '', 
                          email: user.email, 
                          password: '' 
                        }); 
                        setEditTab('info');
                        setShowEditModal(true); 
                      }}
                      title="Chỉnh sửa tài khoản"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      className={`btn btn-icon btn-sm ${user.isActive ? 'btn-ghost' : 'btn-danger'}`} 
                      onClick={() => handleToggleLock(user)}
                      title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      style={user.isActive ? { color: 'var(--warning)' } : {}}
                    >
                      {user.isActive ? <Lock size={13} /> : <Unlock size={13} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {totalUsers === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-3)' }}>
                  Không tìm thấy thành viên nào khớp bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 8px', marginBottom: 12 }}>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-3)' }}>
            Hiển thị dòng <strong style={{ color: 'var(--text-2)' }}>{(page - 1) * pageSize + 1}</strong> đến <strong style={{ color: 'var(--text-2)' }}>{Math.min(page * pageSize, totalUsers)}</strong> trong tổng số <strong style={{ color: 'var(--text-2)' }}>{totalUsers}</strong> thành viên
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              className="btn btn-ghost btn-sm btn-icon" 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              style={{ borderRadius: 6 }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-2)' }}>
              Trang <strong>{page}</strong> / {totalPages}
            </span>
            <button 
              className="btn btn-ghost btn-sm btn-icon" 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
              style={{ borderRadius: 6 }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && editingUser && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)}>
            <motion.div className="modal-box" initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 8 }}>
                <div className="modal-title">Chỉnh sửa thành viên</div>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setShowEditModal(false)}><X size={15} /></button>
              </div>

              {/* Modern tabs bar */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-glass-default)',
                marginBottom: 16,
                padding: '0 4px',
                gap: 16
              }}>
                <button
                  type="button"
                  onClick={() => setEditTab('info')}
                  style={{
                    padding: '8px 0 12px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: editTab === 'info' ? '2px solid var(--border-glass-accent)' : '2px solid transparent',
                    color: editTab === 'info' ? 'var(--text-1)' : 'var(--text-3)',
                    fontWeight: editTab === 'info' ? 600 : 500,
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    transition: 'all 0.2s',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Users size={14} style={{ opacity: editTab === 'info' ? 1 : 0.6 }} />
                  Thông tin cá nhân
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab('account')}
                  style={{
                    padding: '8px 0 12px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: editTab === 'account' ? '2px solid var(--border-glass-accent)' : '2px solid transparent',
                    color: editTab === 'account' ? 'var(--text-1)' : 'var(--text-3)',
                    fontWeight: editTab === 'account' ? 600 : 500,
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    transition: 'all 0.2s',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Lock size={14} style={{ opacity: editTab === 'account' ? 1 : 0.6 }} />
                  Tài khoản & Bảo mật
                </button>
              </div>

              <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {editTab === 'info' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Họ và tên *</label>
                      <input className="form-input" value={editingUser.fullName} onChange={e => setEditingUser(p => ({ ...p, fullName: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Số điện thoại</label>
                      <input className="form-input" value={editingUser.phone || ''} onChange={e => setEditingUser(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Chức vụ *</label>
                      <select className="form-select" value={editingUser.role} onChange={e => setEditingUser(p => ({ ...p, role: e.target.value }))}>
                        <option value="ADMIN">ADMIN (Chủ nhiệm)</option>
                        <option value="MANAGER">MANAGER (Trưởng ban)</option>
                        <option value="MEMBER">MEMBER (Thành viên)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phân ban hoạt động</label>
                      <select className="form-select" value={editingUser.departmentId} onChange={e => setEditingUser(p => ({ ...p, departmentId: e.target.value }))}>
                        <option value="">Chưa phân ban</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <input type="checkbox" id="isActive" checked={editingUser.isActive} onChange={e => setEditingUser(p => ({ ...p, isActive: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                      <label htmlFor="isActive" style={{ fontSize: '0.84rem', color: 'var(--text-1)', cursor: 'pointer', fontWeight: 500 }}>Cho phép tài khoản hoạt động</label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Địa chỉ Email (Tài khoản đăng nhập) *</label>
                      <input type="email" className="form-input" value={editingUser.email || ''} onChange={e => setEditingUser(p => ({ ...p, email: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mật khẩu mới (Reset Password)</label>
                      <input type="password" placeholder="Nhập mật khẩu mới nếu muốn đổi" className="form-input" value={editingUser.password || ''} onChange={e => setEditingUser(p => ({ ...p, password: e.target.value }))} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4, display: 'block', lineHeight: '1.4' }}>
                        Để trống nếu bạn không muốn thay đổi mật khẩu của tài khoản này. Mật khẩu phải có độ dài tối thiểu là 6 ký tự.
                      </span>
                    </div>
                  </>
                )}
                
                <div className="modal-footer" style={{ marginTop: 8 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowEditModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary btn-sm">Lưu cập nhật</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)}>
            <motion.div className="modal-box" initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <div className="modal-header">
                <div className="modal-title">Thêm tài khoản mới</div>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}><X size={15} /></button>
              </div>
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Họ và tên *</label>
                  <input className="form-input" placeholder="VD: Lê Hoài Nam" value={newUser.fullName} onChange={e => setNewUser(p => ({ ...p, fullName: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Địa chỉ Email *</label>
                  <input className="form-input" type="email" placeholder="email@club.com" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input className="form-input" placeholder="VD: 0912345678" value={newUser.phone} onChange={e => setNewUser(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mật khẩu ban đầu *</label>
                  <input className="form-input" type="password" placeholder="••••••••" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Vai trò</label>
                    <select className="form-select" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                      <option value="MEMBER">MEMBER (Thành viên)</option>
                      <option value="MANAGER">MANAGER (Trưởng ban)</option>
                      <option value="ADMIN">ADMIN (Chủ nhiệm)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phân ban</label>
                    <select className="form-select" value={newUser.departmentId} onChange={e => setNewUser(p => ({ ...p, departmentId: e.target.value }))}>
                      <option value="">Chưa phân ban</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer" style={{ marginTop: 8 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary btn-sm">Tạo tài khoản</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
