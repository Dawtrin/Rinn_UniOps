import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import api from '../api';
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';
import loginBanner from '../assets/login_banner_premium.png';
import logoImg from '../assets/logo.jpg';
import './Login.css';

const QUICK_ACCOUNTS = [
  { role: 'Admin',   email: 'admin@club.com',    roleClass: 'q-admin' },
  { role: 'Manager', email: 'son.tran@club.com',  roleClass: 'q-manager' },
  { role: 'Member',  email: 'anh.pham@club.com',  roleClass: 'q-member' },
];

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast('Vui lòng điền đầy đủ thông tin', 'error'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const payload  = res.data?.data || res.data;
      const token    = payload.token;
      const refreshToken = payload.refreshToken;
      const userData = payload.user || payload;
      if (!token) { toast('Máy chủ không trả về token. Kiểm tra lại backend.', 'error'); return; }
      if (!userData?.role) { toast('Không xác định được quyền hạn của tài khoản.', 'error'); return; }
      login(userData, token, refreshToken);
      toast(`Chào mừng, ${userData.fullName}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      toast(err.response?.data?.message || 'Email hoặc mật khẩu không đúng', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container-split">
      {/* Left Column: Brand Showcase */}
      <div className="login-hero-side" style={{ backgroundImage: `url(${loginBanner})` }}>
        <div className="login-hero-overlay" />
        <div className="login-hero-glow-1" />
        <div className="login-hero-glow-2" />
        <div className="login-hero-content">
          <div className="login-hero-brand">
            <div className="login-hero-logo" style={{ background: 'none', boxShadow: 'none' }}>
              <img src={logoImg} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
            </div>
            <span className="login-hero-brand-name">Club OS</span>
          </div>
          
          <h1 className="login-hero-title">
            {t('login.slogan_1')}<br />
            <span>{t('login.slogan_2')}</span>
          </h1>
          
          <p className="login-hero-description">
            {t('login.desc')}
          </p>

          <div className="login-hero-tags">
            <span className="hero-tag">✦ KPI Gamification</span>
            <span className="hero-tag">✦ AI Copilot</span>
            <span className="hero-tag">✦ Interactive Schedules</span>
          </div>
        </div>
      </div>

      {/* Right Column: Form Card */}
      <div className="login-form-side">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="login-header">
            <h2>{t('login.title')}</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">{t('login.email')}</label>
              <input
                className="form-input"
                type="email"
                placeholder="email@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">{t('login.password')}</label>
              <div className="login-pass-wrap">
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="login-eye" onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="login-forgot-container">
              <button 
                type="button" 
                onClick={() => navigate('/forgot-password')} 
                className="login-forgot-btn"
              >
                {t('login.forgot_pwd')}
              </button>
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary btn-lg login-btn"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading
                ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 1.5 }} />
                : <><span>{t('login.btn_login')}</span><ArrowRight size={16} /></>
              }
            </motion.button>
          </form>

          {/* Quick accounts */}
          <div className="login-quick">
            <div className="login-quick-label">Tài khoản thử nghiệm (Mật khẩu: password123)</div>
            <div className="login-quick-row">
              {QUICK_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  className={`login-quick-pill ${a.roleClass}`}
                  onClick={() => { setEmail(a.email); setPassword('password123'); }}
                >
                  {a.role}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
