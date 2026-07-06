import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../context/LanguageContext';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast(t('login.reset_link_sent') || 'Đã gửi link khôi phục mật khẩu. Vui lòng kiểm tra email của bạn!', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Không thể gửi yêu cầu khôi phục mật khẩu', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title" style={{ marginBottom: 10 }}>🔑 {t('login.forgot_pwd')}</h2>
        
        {!submitted ? (
          <>
            <p style={{ color: 'var(--text-2)', fontSize: '0.84rem', textAlign: 'center', marginBottom: 24, lineHeight: 1.4 }}>
              Nhập email đăng ký của bạn. Chúng tôi sẽ gửi một liên kết để bạn đặt lại mật khẩu mới.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">{t('login.email')}</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="email@club.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ paddingLeft: 42 }}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ height: 42, marginTop: 8, gap: 8 }}>
                {loading ? <RefreshCw size={15} className="animate-spin" /> : null}
                Gửi yêu cầu khôi phục
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✉️</div>
            <h4 style={{ color: 'var(--text-1)', marginBottom: 8, fontWeight: 600 }}>Kiểm tra hòm thư của bạn</h4>
            <p style={{ color: 'var(--text-2)', fontSize: '0.84rem', lineHeight: 1.4, marginBottom: 20 }}>
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc hòm thư rác).
            </p>
          </div>
        )}

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
