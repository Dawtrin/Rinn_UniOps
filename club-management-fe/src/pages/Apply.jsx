import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { User, Mail, Phone, Link2, FileText, ChevronRight, CheckCircle, Zap } from 'lucide-react';

export default function Apply() {
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    cvUrl: '',
    introduction: '',
    departmentId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get('/departments')
      .then(res => {
        setDepartments(res.data?.data || res.data || []);
      })
      .catch(err => {
        console.error('Lỗi khi tải danh sách ban:', err);
      })
      .finally(() => {
        setLoadingDepts(false);
      });
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast('Vui lòng điền đầy đủ các thông tin bắt buộc!', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/public/recruitment/apply', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        cvUrl: formData.cvUrl,
        introduction: formData.introduction,
        departmentId: formData.departmentId ? Number(formData.departmentId) : null
      });
      setSubmitted(true);
      toast('Nộp hồ sơ ứng tuyển thành công! 🎉', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi nộp hồ sơ ứng tuyển', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: 20 }}>
        <div className="bento-card accent-green" style={{ maxWidth: 500, width: '100%', padding: 40, textAlign: 'center' }}>
          <CheckCircle size={64} className="text-green" style={{ margin: '0 auto 20px auto', display: 'block' }} />
          <h2 style={{ fontSize: '1.6rem', marginBottom: 12 }}>Nộp Hồ Sơ Thành Công!</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
            Cảm ơn bạn đã quan tâm ứng tuyển vào câu lạc bộ của chúng tôi. Hệ thống đã tiếp nhận hồ sơ của bạn. 
            Mọi thông tin liên hệ và lịch phỏng vấn sẽ được gửi về địa chỉ email: <strong style={{ color: 'var(--neon-blue)' }}>{formData.email}</strong>.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Quay lại trang đăng ký
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', fontFamily: 'var(--font-family)', color: 'var(--text-primary)' }}>
      {/* Navbar header */}
      <header style={{ padding: '20px 40px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--neon-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Zap size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Club OS Recruitment</span>
        </div>
        <a href="/login" className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>Đăng nhập Thành viên</a>
      </header>

      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 40, maxWidth: 1200, width: '100%', margin: '40px auto', padding: '0 20px' }}>
        {/* Intro Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span className="badge badge-purple" style={{ alignSelf: 'flex-start', marginBottom: 16 }}>TUYỂN THÀNH VIÊN MỚI</span>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Gia nhập Đội ngũ <br />
            <span style={{
              background: 'linear-gradient(90deg, var(--neon-blue), var(--neon-purple))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Sáng tạo nghệ thuật</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 24 }}>
            Chào mừng bạn đến với đợt tuyển thành viên lớn nhất trong năm của câu lạc bộ chúng tôi. 
            Nếu bạn có niềm đam mê với nghệ thuật biểu diễn, truyền thông sự kiện, hoặc mong muốn phát triển bản thân trong môi trường đội nhóm năng động, hãy nộp đơn ứng tuyển ngay hôm nay!
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { title: 'Ban Chuyên môn (Dance / Sing / Theater)', desc: 'Nơi tập luyện chuyên sâu, biểu diễn trên các sân khấu lớn của trường và đối ngoại.' },
              { title: 'Ban Truyền thông (Content / Design / Media)', desc: 'Xây dựng hình ảnh CLB, lên ý tưởng chiến dịch truyền thông và chụp ảnh/quay phim sự kiện.' },
              { title: 'Ban Hậu cần & Sự kiện (Event Ops / Logistics)', desc: 'Lập kế hoạch tổ chức sự kiện, điều phối âm thanh ánh sáng và hỗ trợ đạo cụ sân khấu.' }
            ].map((b, idx) => (
              <div key={idx} className="bento-card" style={{ padding: 16, borderLeft: '3px solid var(--neon-blue)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>{b.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Apply Form Card */}
        <div className="bento-card accent-purple" style={{ padding: 32, background: 'var(--bg-surface)' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText className="text-purple" size={20} />
            Đơn Đăng Ký Ứng Tuyển
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Họ và Tên *</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input className="form-input" style={{ paddingLeft: 36 }} name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Nguyễn Văn A" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ Email *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input className="form-input" style={{ paddingLeft: 36 }} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="annguyen@gmail.com" required />
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Số Điện Thoại *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input className="form-input" style={{ paddingLeft: 36 }} name="phone" value={formData.phone} onChange={handleChange} placeholder="0987654321" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ban Nguyện Vọng</label>
                <select className="form-select" name="departmentId" value={formData.departmentId} onChange={handleChange}>
                  <option value="">-- Chọn ban muốn tham gia --</option>
                  {loadingDepts ? (
                    <option disabled>Đang tải danh sách ban...</option>
                  ) : (
                    departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Link CV (nếu có - ví dụ Google Drive, Canva...)</label>
              <div style={{ position: 'relative' }}>
                <Link2 size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input className="form-input" style={{ paddingLeft: 36 }} name="cvUrl" value={formData.cvUrl} onChange={handleChange} placeholder="https://drive.google.com/..." />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Giới thiệu bản thân & Lý do muốn gia nhập CLB</label>
              <textarea className="form-input" name="introduction" value={formData.introduction} onChange={handleChange} placeholder="Hãy viết một vài dòng giới thiệu bản thân, tài năng đặc biệt và lý do bạn ứng tuyển nhé..." rows={4} style={{ resize: 'vertical' }} />
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={submitting} style={{ justifyContent: 'center', marginTop: 10 }}>
              {submitting ? 'Đang nộp hồ sơ...' : 'Nộp Đơn Ứng Tuyển'}
              <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </main>

      <footer style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', background: 'var(--bg-surface)' }}>
        © {new Date().getFullYear()} Rin_UniOps Club Management System. Đã đăng ký bản quyền.
      </footer>
    </div>
  );
}
