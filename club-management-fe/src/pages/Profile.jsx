import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import api from '../api';
import { User, Lock, Phone, Mail, Award, Landmark, Check } from 'lucide-react';

export default function Profile() {
  const { user, token, login } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'
  
  // Profile state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast('Họ và tên không được để trống', 'error');
      return;
    }

    setUpdatingProfile(true);
    try {
      const res = await api.put('/users/me/profile', { fullName, phone });
      const updatedUser = res.data?.data || res.data;
      
      // Update local context
      login(updatedUser, token);
      toast('Cập nhật thông tin cá nhân thành công!', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Cập nhật thất bại', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast('Vui lòng điền đầy đủ các trường mật khẩu', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Mật khẩu mới và xác nhận mật khẩu không khớp', 'error');
      return;
    }
    if (newPassword.length < 6) {
      toast('Mật khẩu mới phải từ 6 ký tự trở lên', 'error');
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.put('/users/me/password', { oldPassword, newPassword });
      toast('Đổi mật khẩu thành công!', 'success');
      // Clear password fields
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast(err.response?.data?.message || 'Đổi mật khẩu thất bại', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const getInitials = (name) => name?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header">
        <h1>Cài đặt cá nhân</h1>
        <p>Cập nhật thông tin cá nhân và thay đổi mật khẩu tài khoản</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, marginTop: 24 }}>
        
        {/* Sidebar Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20, alignSelf: 'start', padding: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
            <div className="lb-avatar" style={{ width: 80, height: 80, fontSize: '2rem', background: 'var(--bg-3)', border: '2px solid var(--accent-light)' }}>
              {getInitials(user?.fullName)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.fullName}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{user?.email}</div>
            </div>
          </div>

          <div className="divider" style={{ margin: '8px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button 
              className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('profile')}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <User size={16} style={{ marginRight: 8 }} />
              <span>Thông tin cá nhân</span>
            </button>
            <button 
              className={`btn ${activeTab === 'password' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('password')}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <Lock size={16} style={{ marginRight: 8 }} />
              <span>Đổi mật khẩu</span>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="card" style={{ padding: 24 }}>
          {activeTab === 'profile' ? (
            <motion.form 
              onSubmit={handleUpdateProfile}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} />
                Thông tin cá nhân
              </h2>

              <div className="form-group">
                <label className="form-label">Họ và tên *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email (Không thể thay đổi)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={user?.email || ''} 
                    disabled 
                    style={{ background: 'var(--bg-3)', opacity: 0.7, cursor: 'not-allowed', paddingLeft: 36 }}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="tel" 
                    className="form-input" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    style={{ paddingLeft: 36 }}
                  />
                  <Phone size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Vai trò</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={user?.role || ''} 
                      disabled 
                      style={{ background: 'var(--bg-3)', opacity: 0.7, cursor: 'not-allowed', paddingLeft: 36 }}
                    />
                    <Award size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ban/Phân ban</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={user?.departmentName || 'Chưa phân ban'} 
                      disabled 
                      style={{ background: 'var(--bg-3)', opacity: 0.7, cursor: 'not-allowed', paddingLeft: 36 }}
                    />
                    <Landmark size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="submit" className="btn btn-primary" disabled={updatingProfile}>
                  {updatingProfile ? (
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
                  ) : (
                    <>
                      <Check size={16} style={{ marginRight: 6 }} />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form 
              onSubmit={handleChangePassword}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={18} />
                Đổi mật khẩu
              </h2>

              <div className="form-group">
                <label className="form-label">Mật khẩu hiện tại *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu mới *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu mới *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="submit" className="btn btn-primary" disabled={updatingPassword}>
                  {updatingPassword ? (
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
                  ) : (
                    <>
                      <Check size={16} style={{ marginRight: 6 }} />
                      Đổi mật khẩu
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </div>

      </div>
    </div>
  );
}
