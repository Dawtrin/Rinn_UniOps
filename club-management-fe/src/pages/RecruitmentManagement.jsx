import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { UserPlus, Star, Calendar, MessageSquare, Check, X, FileText, ExternalLink, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function RecruitmentManagement() {
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [evalData, setEvalData] = useState({
    score: 0,
    comments: '',
    status: '',
    interviewTime: ''
  });
  const [updating, setUpdating] = useState(false);
  const [approving, setApproving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appRes, deptRes] = await Promise.all([
        api.get('/recruitment'),
        api.get('/departments')
      ]);
      setApplications(appRes.data?.data || appRes.data || []);
      setDepartments(deptRes.data?.data || deptRes.data || []);
    } catch (err) {
      toast('Lỗi khi tải thông tin ứng tuyển', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getDeptName = (id) => {
    const d = departments.find(item => item.id === id);
    return d ? d.name : 'Chưa đăng ký ban';
  };

  const handleSelectApp = (app) => {
    setSelectedApp(app);
    setEvalData({
      score: app.score || 0,
      comments: app.comments || '',
      status: app.status || 'SUBMITTED',
      interviewTime: app.interviewTime ? app.interviewTime.substring(0, 16) : ''
    });
  };

  const handleUpdateEvaluation = async () => {
    if (!selectedApp) return;
    setUpdating(true);
    try {
      const res = await api.put(`/recruitment/${selectedApp.id}/evaluate`, {
        score: evalData.score,
        comments: evalData.comments,
        status: evalData.status,
        interviewTime: evalData.interviewTime || null
      });
      toast('Cập nhật đánh giá thành công!', 'success');
      // Refresh item in list
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? res.data.data : a));
      setSelectedApp(res.data.data);
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi lưu đánh giá', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setApproving(true);
    try {
      await api.post(`/recruitment/${selectedApp.id}/approve`);
      toast('Đã phê duyệt ứng viên làm thành viên! Mật khẩu và thư chào mừng đã được gửi.', 'success');
      loadData();
      setSelectedApp(null);
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi phê duyệt thành viên', 'error');
    } finally {
      setApproving(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return { background: 'rgba(0, 255, 102, 0.15)', color: '#00ff66' };
      case 'REJECTED':
        return { background: 'rgba(255, 92, 0, 0.15)', color: '#ff5c00' };
      case 'INTERVIEW_SCHEDULED':
        return { background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff' };
      case 'REVIEWED':
        return { background: 'rgba(189, 0, 255, 0.15)', color: '#bd00ff' };
      default:
        return { background: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'Đã nhận';
      case 'REJECTED': return 'Từ chối';
      case 'INTERVIEW_SCHEDULED': return 'Hẹn phỏng vấn';
      case 'REVIEWED': return 'Đã đánh giá';
      default: return 'Chờ duyệt';
    }
  };

  // Stats calculation
  const total = applications.length;
  const accepted = applications.filter(a => a.status === 'ACCEPTED').length;
  const scheduled = applications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length;
  const submitted = applications.filter(a => a.status === 'SUBMITTED').length;

  return (
    <div>
      <div className="page-header">
        <h1>Tuyển Thành Viên CLB</h1>
        <p>Quản lý quy trình ứng tuyển phỏng vấn và kích hoạt tài khoản thành viên mới</p>
      </div>

      {/* Stats row */}
      <div className="grid-4 mb-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Tổng số hồ sơ', count: total, color: 'var(--neon-purple)' },
          { label: 'Chờ xử lý', count: submitted, color: 'var(--text-secondary)' },
          { label: 'Lịch phỏng vấn', count: scheduled, color: 'var(--neon-blue)' },
          { label: 'Đã tuyển dụng', count: accepted, color: 'var(--neon-green)' }
        ].map((s, idx) => (
          <div key={idx} className="bento-card" style={{ borderLeft: `4px solid ${s.color}`, padding: '16px 24px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.label}</span>
            <h2 style={{ fontSize: '2rem', margin: '4px 0 0 0', fontWeight: 700, color: s.color }}>{s.count}</h2>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedApp ? '1.2fr 1fr' : '1fr', gap: 24, transition: 'all 0.3s' }}>
        {/* List Table */}
        <div className="bento-card" style={{ overflowX: 'auto', padding: 24 }}>
          <h3 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} className="text-purple" /> Danh sách ứng tuyển
          </h3>

          {loading ? (
            <div className="flex justify-center p-3" style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : applications.length === 0 ? (
            <p className="text-muted text-center" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>Chưa có ứng viên nào nộp hồ sơ ứng tuyển.</p>
          ) : (
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: 12 }}>Họ Tên</th>
                  <th style={{ padding: 12 }}>Ban đăng ký</th>
                  <th style={{ padding: 12 }}>Điểm</th>
                  <th style={{ padding: 12 }}>Trạng thái</th>
                  <th style={{ padding: 12 }}>Ngày nộp</th>
                  <th style={{ padding: 12 }}></th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} onClick={() => handleSelectApp(app)} style={{
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    background: selectedApp?.id === app.id ? 'rgba(255,255,255,0.03)' : 'transparent'
                  }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 600 }}>{app.fullName}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{app.email}</div>
                    </td>
                    <td style={{ padding: 12 }}>{getDeptName(app.departmentId)}</td>
                    <td style={{ padding: 12, fontWeight: 700, color: 'var(--neon-purple)' }}>{app.score !== null ? app.score : '-'}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        ...getStatusStyle(app.status),
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        display: 'inline-block'
                      }}>
                        {getStatusLabel(app.status)}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: 12 }}>
                      <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Evaluation Drawer / Panel */}
        {selectedApp && (
          <div className="bento-card accent-purple" style={{ padding: 24, height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 600 }}>Chi Tiết Ứng Viên</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Đăng ký ngày {new Date(selectedApp.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedApp(null)}><X size={16} /></button>
            </div>

            {/* Candidate details */}
            <div className="flex-col gap-3 mb-4" style={{ marginBottom: 20 }}>
              <div className="grid-2">
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Họ và Tên</span>
                  <div style={{ fontWeight: 600 }}>{selectedApp.fullName}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Số điện thoại</span>
                  <div style={{ fontWeight: 600 }}>{selectedApp.phone}</div>
                </div>
              </div>
              <div className="grid-2">
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Email</span>
                  <div style={{ fontWeight: 600, wordBreak: 'break-all' }}>{selectedApp.email}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Ban Nguyện Vọng</span>
                  <div style={{ fontWeight: 600, color: 'var(--neon-blue)' }}>{getDeptName(selectedApp.departmentId)}</div>
                </div>
              </div>
              {selectedApp.cvUrl && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Đường dẫn CV</span>
                  <div>
                    <a href={selectedApp.cvUrl} target="_blank" rel="noopener noreferrer" className="text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.86rem', color: 'var(--neon-blue)' }}>
                      Mở liên kết CV <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}
              {selectedApp.introduction && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Giới thiệu bản thân</span>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    background: 'var(--bg-main)',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    whiteSpace: 'pre-line'
                  }}>
                    {selectedApp.introduction}
                  </p>
                </div>
              )}
            </div>

            {/* Evaluation Form */}
            {selectedApp.status !== 'ACCEPTED' ? (
              <div className="flex-col gap-3" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Đánh giá & Xử lý</h4>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Điểm phỏng vấn (0-100)</label>
                    <input className="form-input" type="number" min="0" max="100" value={evalData.score}
                      onChange={e => setEvalData({ ...evalData, score: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bước quy trình</label>
                    <select className="form-select" value={evalData.status}
                      onChange={e => setEvalData({ ...evalData, status: e.target.value })}>
                      <option value="SUBMITTED">Chờ phỏng vấn (Mới nộp)</option>
                      <option value="REVIEWED">Đang đánh giá</option>
                      <option value="INTERVIEW_SCHEDULED">Đã đặt lịch phỏng vấn</option>
                      <option value="REJECTED">Từ chối (Không đạt)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Lịch phỏng vấn (Nếu có)</label>
                  <input className="form-input" type="datetime-local" value={evalData.interviewTime}
                    onChange={e => setEvalData({ ...evalData, interviewTime: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Nhận xét phỏng vấn / Ghi chú</label>
                  <textarea className="form-input" value={evalData.comments} placeholder="Viết nhận xét ưu nhược điểm, kỹ năng chuyên môn..." rows={3}
                    onChange={e => setEvalData({ ...evalData, comments: e.target.value })} />
                </div>

                <div className="flex gap-2" style={{ marginTop: 8 }}>
                  <button className="btn btn-primary" onClick={handleUpdateEvaluation} disabled={updating} style={{ flex: 1, justifyContent: 'center' }}>
                    {updating ? 'Đang lưu...' : 'Lưu Đánh Giá'}
                  </button>
                  <button className="btn btn-success" onClick={handleApprove} disabled={approving} style={{ flex: 1, justifyContent: 'center', background: 'var(--neon-green)', border: '2px solid var(--neon-green)', color: 'var(--bg-main)' }}>
                    {approving ? 'Đang duyệt...' : 'Duyệt & Tạo Account'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center gap-2" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, textAlign: 'center', padding: '20px 0', color: 'var(--neon-green)' }}>
                <CheckCircle2 size={24} />
                <span style={{ fontWeight: 600 }}>Đã phê duyệt tuyển dụng thành công!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
