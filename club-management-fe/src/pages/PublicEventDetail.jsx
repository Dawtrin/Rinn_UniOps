import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { 
  CalendarDays, MapPin, Clock, Ticket, User, Mail, Phone, 
  CheckCircle, Zap, ChevronLeft, Download
} from 'lucide-react';

export default function PublicEventDetail() {
  const { id } = useParams();
  const toast = useToast();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState(null); // stores generated ticket info on success

  useEffect(() => {
    api.get(`/public/events/${id}`)
      .then(res => {
        setEvent(res.data?.data || res.data);
      })
      .catch(err => {
        toast('Không tìm thấy sự kiện công khai này!', 'error');
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast('Vui lòng nhập đầy đủ các trường thông tin!', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/public/events/${id}/register`, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone
      });
      setTicket(res.data?.data || res.data);
      toast('Đăng ký nhận vé thành công! 🎟️', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi đăng ký vé sự kiện', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: '#fff', padding: 20 }}>
        <h2 style={{ marginBottom: 12 }}>Không tìm thấy sự kiện!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Sự kiện này có thể không tồn tại hoặc đã được chuyển về chế độ nội bộ.</p>
        <a href="/" className="btn btn-primary">Quay lại trang chủ</a>
      </div>
    );
  }

  const qrCodeUrl = ticket ? `https://quickchart.io/qr?text=${ticket.ticketCode}&size=200` : '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', fontFamily: 'var(--font-family)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header style={{ padding: '20px 40px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--neon-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Zap size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Club OS Events</span>
        </div>
        <a href="/login" className="btn btn-ghost btn-sm">Đăng nhập Thành viên</a>
      </header>

      <main style={{ flex: 1, maxWidth: 900, width: '100%', margin: '40px auto', padding: '0 20px' }}>
        {/* Back Link */}
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.86rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 24 }}>
          <ChevronLeft size={16} /> Quay lại trang chủ
        </a>

        {!ticket ? (
          /* Event Details + Registration form */
          <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 40, alignItems: 'flex-start' }}>
            {/* Event Detail details */}
            <div className="flex-col gap-4">
              <span className="badge badge-purple" style={{ alignSelf: 'flex-start' }}>SỰ KIỆN CÔNG KHAI</span>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 }}>{event.title}</h1>
              
              <div className="flex-col gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarDays size={16} className="text-purple" />
                  <span>Thời gian bắt đầu: {new Date(event.startTime).toLocaleString('vi-VN')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} className="text-purple" />
                  <span>Thời gian kết thúc: {new Date(event.endTime).toLocaleString('vi-VN')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={16} className="text-purple" />
                  <span>Địa điểm: <strong style={{ color: 'var(--text-primary)' }}>{event.location}</strong></span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 10 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 600 }}>Mô tả sự kiện:</h4>
                <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{event.description || 'Không có mô tả chi tiết.'}</p>
              </div>
            </div>

            {/* Ticket registration card */}
            <div className="bento-card accent-blue" style={{ padding: 28, background: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ticket size={20} className="text-blue" />
                Đăng ký Vé vào cửa
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 20 }}>Mỗi email chỉ được đăng ký tối đa 1 vé miễn phí. Mã vé QR sẽ được hiển thị ngay sau khi gửi thành công.</p>

              <form onSubmit={handleRegister} className="flex-col gap-4">
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

                <div className="form-group">
                  <label className="form-label">Số điện thoại *</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input className="form-input" style={{ paddingLeft: 36 }} name="phone" value={formData.phone} onChange={handleChange} placeholder="0987654321" required />
                  </div>
                </div>

                <button className="btn btn-primary btn-lg" type="submit" disabled={submitting} style={{ justifyContent: 'center', marginTop: 10 }}>
                  {submitting ? 'Đang xuất vé...' : 'Đăng Ký Nhận Vé Miễn Phí'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Ticket output visual (Bento / Neo-brutalism design) */
          <div className="flex justify-center" style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <div className="bento-card accent-green" style={{ maxWidth: 450, width: '100%', padding: 32, background: 'var(--bg-surface)', textAlign: 'center' }}>
              <CheckCircle size={54} className="text-green" style={{ margin: '0 auto 16px auto', display: 'block' }} />
              <h2 style={{ fontSize: '1.4rem', marginBottom: 6 }}>Đăng Ký Vé Thành Công!</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 24 }}>Đường dẫn vé và mã QR cũng đã được gửi đến email: <strong>{ticket.email}</strong></p>

              {/* Physical ticket mockup */}
              <div style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 12,
                padding: 24,
                background: 'var(--bg-main)',
                textAlign: 'center',
                position: 'relative'
              }}>
                <h4 style={{ margin: '0 0 4px 0', color: 'var(--neon-purple)', letterSpacing: 1, fontSize: '0.8rem' }}>VE VAP CUA SU KIEN</h4>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 700 }}>{event.title}</h3>

                {/* QR Code embed */}
                <div style={{ background: '#fff', padding: 10, borderRadius: 8, display: 'inline-block', marginBottom: 16 }}>
                  <img src={qrCodeUrl} alt="Mã QR Vé" style={{ width: 160, height: 160, display: 'block' }} />
                </div>

                <div style={{ fontSize: '0.82rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Mã vé:</span> <code style={{ color: 'var(--neon-blue)', fontWeight: 700, fontSize: '0.9rem' }}>{ticket.ticketCode}</code>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Khách mời:</span> <strong style={{ color: 'var(--text-primary)' }}>{ticket.fullName}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Địa điểm:</span> <strong style={{ color: 'var(--text-primary)' }}>{event.location}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Thời gian:</span> <strong style={{ color: 'var(--text-primary)' }}>{new Date(event.startTime).toLocaleString('vi-VN')}</strong>
                  </div>
                </div>
              </div>

              <button className="btn btn-ghost" onClick={() => window.print()} style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8, margin: '24px auto 0 auto' }}>
                <Download size={14} /> In hoặc lưu vé PDF
              </button>
            </div>
          </div>
        )}
      </main>

      <footer style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', background: 'var(--bg-surface)' }}>
        © {new Date().getFullYear()} Rin_UniOps Club Management System. Đã đăng ký bản quyền.
      </footer>
    </div>
  );
}
