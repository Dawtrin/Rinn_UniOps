import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, RefreshCw, Eye, EyeOff } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../context/LanguageContext';

export default function ResetPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    if (!token) {
      toast('Mã khôi phục không tìm thấy hoặc không hợp lệ. Vui lòng gửi lại yêu cầu.', 'error');
      navigate('/login');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;
    if (password !== confirmPassword) {
      toast('Mật khẩu xác nhận không khớp!', 'error');
      return;
    }
    if (password.length < 6) {
      toast('Mật khẩu mới phải có tối thiểu 6 ký tự!', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast('Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại!', 'success');
      navigate('/login');
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi đặt lại mật khẩu', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title" style={{ marginBottom: 10 }}>🔒 Đặt lại mật khẩu</h2>
        <p style={{ color: 'var(--text-2)', fontSize: '0.84rem', textAlign: 'center', marginBottom: 24 }}>
          Tạo mật khẩu mới cho tài khoản của bạn.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Mật khẩu mới</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: 42, paddingRight: 40 }}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(p => !p)} 
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Xác nhận mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input
                type="password"
                className="form-input"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ paddingLeft: 42 }}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ height: 42, marginTop: 8, gap: 8 }}>
            {loading ? <RefreshCw size={15} className="animate-spin" /> : null}
            Cập nhật mật khẩu
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button 
            onClick={() => navigate('/login')} 
            className="btn btn-ghost btn-sm" 
            style={{ gap: 6, fontSize: '0.82rem', color: 'var(--text-2)' }}
          >
            <ArrowLeft size={14} /> {t('login.back_to_login')}
          </button>
        </div>
      </div>
    </div>
  );
}
