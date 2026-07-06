import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { BarChart3, Send, Star, X, CheckCircle, Clock, TrendingUp, Download } from 'lucide-react';

const GRADE_COLORS = { EXCELLENT: 'green', GOOD: 'blue', PASS: 'yellow', FAIL: 'red' };
const getGrade = (score) => {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 75) return 'GOOD';
  if (score >= 50) return 'PASS';
  return 'FAIL';
};

const formatMonth = (ym) => {
  if (!ym) return '';
  const parts = ym.split('-');
  if (parts.length === 2) {
    return `${parts[1]}/${parts[0]}`;
  }
  return ym;
};

export default function Evaluations() {
  const { isManager, isAdmin, user } = useAuth();
  const toast = useToast();
  const [myEval, setMyEval] = useState(null);
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');

  const DEPARTMENTS = [
    { id: 1, name: 'Ban Chuyên môn' },
    { id: 2, name: 'Ban Truyền thông' },
    { id: 3, name: 'Ban Đối ngoại' },
    { id: 4, name: 'Ban Hậu cần' }
  ];

  // Self-eval form
  const [selfForm, setSelfForm] = useState({ evalMonth: '', content: '', achievements: '', improvements: '' });
  const [submitting, setSubmitting] = useState(false);

  // Manager scoring
  const [taskScore, setTaskScore] = useState(80);
  const [attendanceScore, setAttendanceScore] = useState(80);
  const [attitudeScore, setAttitudeScore] = useState(80);
  const [comment, setComment] = useState('');
  const [scoring, setScoring] = useState(false);

  // KPI Export state
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    setSelfForm(p => ({ ...p, evalMonth: currentMonth }));
    if (isManager()) {
      api.get('/evaluations/manager')
        .then(r => {
          const data = r.data?.data || r.data;
          const mapped = Array.isArray(data)
            ? data.map(ev => ({ ...ev, scored: ev.status === 'REVIEWED' }))
            : [];
          setEvals(mapped);
        })
        .catch(() => {
          toast('Không thể tải danh sách đánh giá từ máy chủ', 'error');
          setEvals([]);
        })
        .finally(() => setLoading(false));
    } else {
      api.get('/evaluations/me')
        .then(r => {
          const data = r.data?.data || r.data;
          const currentEval = (Array.isArray(data) && data.length > 0) ? data[0] : (data && !Array.isArray(data) ? data : null);
          setMyEval(currentEval);
          if (currentEval && currentEval.status === 'DRAFT') {
            setSelfForm({
              evalMonth: currentEval.evalMonth || currentMonth,
              content: currentEval.content || '',
              achievements: currentEval.achievements || '',
              improvements: currentEval.improvements || ''
            });
          }
        })
        .catch(() => {
          toast('Không thể tải thông tin đánh giá của bạn', 'error');
          setMyEval(null);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const saveDraft = async () => {
    setSubmitting(true);
    try {
      const r = await api.post('/evaluations/draft', selfForm);
      setMyEval(r.data?.data || r.data);
      toast('Đã lưu bản nháp thành công! 📝', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'Lỗi khi lưu bản nháp', 'error');
    }
    setSubmitting(false);
  };

  const submitSelf = async () => {
    if (!selfForm.content) { toast('Vui lòng điền nội dung tự đánh giá', 'error'); return; }
    setSubmitting(true);
    try {
      const r = await api.post('/evaluations/self', selfForm);
      setMyEval(r.data?.data || r.data);
      toast('Đã nộp tự đánh giá thành công! ✅', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'Lỗi khi nộp tự đánh giá', 'error');
    }
    setSubmitting(false);
  };

  const submitScore = async (evalId) => {
    setScoring(true);
    const finalScore = Math.round(attendanceScore * 0.3 + taskScore * 0.5 + attitudeScore * 0.2);
    try {
      await api.post(`/evaluations/${evalId}/evaluate`, { taskScore, attendanceScore, attitudeScore, comment });
      setEvals(p => p.map(ev => ev.id === evalId ? { ...ev, scored: true, status: 'REVIEWED', finalScore, comment } : ev));
      setSelected(null);
      toast(`Đã chấm điểm: ${finalScore}/100 (${getGrade(finalScore)})`, 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'Lỗi khi nộp kết quả chấm điểm', 'error');
    }
    setScoring(false);
  };

  const handleExportEvaluations = async () => {
    try {
      const response = await api.get(`/export/evaluations/${exportMonth}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `evaluations_month_${exportMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Xuất báo cáo CSV thành công!', 'success');
    } catch (err) {
      toast('Lỗi khi xuất báo cáo KPI', 'error');
    }
  };

  const handleExportPdf = async () => {
    try {
      const response = await api.get('/admin/reports/kpi-pdf', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `kpi_report_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Xuất báo cáo PDF thành công! 📄', 'success');
    } catch (err) {
      toast('Lỗi khi xuất báo cáo PDF', 'error');
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  // ── MEMBER VIEW ──
  if (!isManager()) return (
    <div>
      <div className="page-header">
        <h1>Đánh giá KPI Tháng</h1>
        <p>Nhìn lại kết quả hoạt động và nộp bản tự đánh giá cá nhân</p>
      </div>
      <div className="eval-split">
        {/* Left: Stats panel */}
        <div className="eval-stat-panel">
          <h3 className="mb-2">Kết quả hệ thống ghi nhận</h3>
          {[
            { label: 'Tỷ lệ chuyên cần', value: myEval?.attendanceRate ? `${myEval.attendanceRate}%` : '—', icon: <CheckCircle size={18} />, color: 'green' },
            { label: 'Task hoàn thành', value: myEval?.completedTasks ?? '—', icon: <TrendingUp size={18} />, color: 'blue' },
            { label: 'Điểm KPI tháng trước', value: myEval?.managerId ? `${myEval.finalScore}/100` : 'Chưa có', icon: <Star size={18} />, color: 'yellow' },
          ].map(s => (
            <div key={s.label} className="eval-stat-widget">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-${s.color}`}>{s.icon}</span>
                <span className="text-sm text-muted">{s.label}</span>
              </div>
              <div className={`stat-number text-${s.color}`} style={{ fontSize: '1.6rem' }}>{s.value}</div>
            </div>
          ))}

          {myEval?.managerId && (
            <div className="eval-stat-widget" style={{ borderLeft: '3px solid var(--accent)' }}>
              <div className="text-xs text-muted mb-1">Nhận xét từ {myEval.managerName}</div>
              <div className="font-semibold text-sm" style={{ marginBottom: 4 }}>
                {myEval.grade && (
                  <span className={`badge badge-${GRADE_COLORS[myEval.grade]}`} style={{ marginBottom: 6, display: 'inline-block' }}>
                    {myEval.grade}
                  </span>
                )}
              </div>
              <p className="text-xs">{myEval.managerComment || 'Chưa có nhận xét'}</p>
            </div>
          )}
        </div>

        {/* Right: Self-eval form */}
        <div className="eval-form-panel">
          <h3 className="mb-2">
            Bản Tự đánh giá của tôi {myEval && myEval.status === 'DRAFT' && <span className="badge badge-yellow ml-2" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>Bản nháp</span>}
          </h3>
          {myEval && (myEval.status === 'SUBMITTED' || myEval.status === 'REVIEWED')
            ? <div className="bento-card accent-green">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={18} className="text-green" />
                  <span className="font-semibold">Đã nộp tự đánh giá tháng {formatMonth(myEval.evalMonth)}</span>
                </div>
                <p className="text-sm">{myEval.content}</p>
                {myEval.achievements && <div className="mt-2"><span className="badge badge-green mb-1">Thành tích</span><p className="text-xs mt-1">{myEval.achievements}</p></div>}
                {myEval.improvements && <div className="mt-2"><span className="badge badge-yellow mb-1">Cần cải thiện</span><p className="text-xs mt-1">{myEval.improvements}</p></div>}
              </div>
            : <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Tháng đánh giá</label>
                  <input className="form-input" type="month" value={selfForm.evalMonth} onChange={e => setSelfForm(p => ({ ...p, evalMonth: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nội dung tự đánh giá *</label>
                  <textarea className="form-textarea" style={{ minHeight: 110 }} placeholder="Trong tháng này tôi đã..." value={selfForm.content} onChange={e => setSelfForm(p => ({ ...p, content: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Thành tích nổi bật</label>
                  <textarea className="form-textarea" placeholder="Những điều tôi làm tốt trong tháng..." value={selfForm.achievements} onChange={e => setSelfForm(p => ({ ...p, achievements: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Điểm cần cải thiện</label>
                  <textarea className="form-textarea" placeholder="Những điểm tôi muốn cải thiện tháng tới..." value={selfForm.improvements} onChange={e => setSelfForm(p => ({ ...p, improvements: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" onClick={saveDraft} disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
                    Lưu nháp
                  </button>
                  <button className="btn btn-primary" onClick={submitSelf} disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
                    {submitting ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Send size={16} />}
                    Nộp tự đánh giá
                  </button>
                </div>
              </div>}
        </div>
      </div>
    </div>
  );

  // Filter evaluation logic
  const filteredEvals = evals.filter(ev => {
    const matchMonth = !filterMonth || ev.evalMonth === filterMonth;
    const matchStatus = filterStatus === 'ALL' || ev.status === filterStatus;
    const matchDept = filterDept === 'ALL' || String(ev.departmentId) === String(filterDept);
    return matchMonth && matchStatus && matchDept;
  });

  // Calculate statistics counts
  const statsEvals = evals.filter(ev => {
    const matchMonth = !filterMonth || ev.evalMonth === filterMonth;
    const matchDept = filterDept === 'ALL' || String(ev.departmentId) === String(filterDept);
    return matchMonth && matchDept;
  });

  const totalCount = statsEvals.length;
  const draftCount = statsEvals.filter(ev => ev.status === 'DRAFT').length;
  const submittedCount = statsEvals.filter(ev => ev.status === 'SUBMITTED').length;
  const reviewedCount = statsEvals.filter(ev => ev.status === 'REVIEWED').length;

  // ── MANAGER VIEW ──
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Chấm điểm Thành viên</h1>
          <p>Xem xét và chấm điểm KPI hàng tháng cho thành viên trong ban</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="month"
            className="form-input"
            style={{ width: 140, padding: '6px 12px', fontSize: '0.82rem', marginBottom: 0 }}
            value={exportMonth}
            onChange={e => setExportMonth(e.target.value)}
          />
          <button className="btn btn-success btn-sm" onClick={handleExportEvaluations} style={{ gap: 6 }}>
            <Download size={14} /> Xuất CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExportPdf} style={{ gap: 6 }}>
            <Download size={14} /> Xuất PDF
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="eval-stat-widget">
          <div className="text-xs text-muted">Tổng số bản ghi</div>
          <div className="stat-number text-primary" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalCount}</div>
        </div>
        <div className="eval-stat-widget" style={{ borderLeft: '3px solid var(--warning)' }}>
          <div className="text-xs text-muted">Bản nháp</div>
          <div className="stat-number text-warning" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{draftCount}</div>
        </div>
        <div className="eval-stat-widget" style={{ borderLeft: '3px solid var(--accent)' }}>
          <div className="text-xs text-muted">Chờ chấm</div>
          <div className="stat-number text-purple" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>{submittedCount}</div>
        </div>
        <div className="eval-stat-widget" style={{ borderLeft: '3px solid var(--success)' }}>
          <div className="text-xs text-muted">Đã chấm</div>
          <div className="stat-number text-success" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{reviewedCount}</div>
        </div>
      </div>

      {/* Premium Filter Bar */}
      <div className="bento-card" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16, padding: '12px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
          <span className="text-xs font-semibold text-muted">Lọc theo Tháng</span>
          <input
            type="month"
            className="form-input"
            style={{ marginBottom: 0, padding: '6px 12px', fontSize: '0.85rem' }}
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
          <span className="text-xs font-semibold text-muted">Trạng thái</span>
          <select
            className="form-select"
            style={{ marginBottom: 0, padding: '6px 12px', fontSize: '0.85rem' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
            <option value="SUBMITTED">Chưa chấm (SUBMITTED)</option>
            <option value="REVIEWED">Đã chấm (REVIEWED)</option>
          </select>
        </div>

        {isAdmin() && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 150 }}>
            <span className="text-xs font-semibold text-muted">Phòng ban (Admin)</span>
            <select
              className="form-select"
              style={{ marginBottom: 0, padding: '6px 12px', fontSize: '0.85rem' }}
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
            >
              <option value="ALL">Tất cả các ban</option>
              {DEPARTMENTS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        {(filterMonth || filterStatus !== 'ALL' || filterDept !== 'ALL') && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: 'flex-end', height: 34 }}
            onClick={() => {
              setFilterMonth('');
              setFilterStatus('ALL');
              setFilterDept('ALL');
            }}
          >
            Xóa lọc
          </button>
        )}
      </div>

      {filteredEvals.length === 0
        ? <div className="empty-state"><BarChart3 size={48} /><h3>Không tìm thấy bản tự đánh giá nào</h3><p>Thành viên chưa nộp tự đánh giá hoặc bộ lọc không khớp</p></div>
        : <div className="flex-col gap-3">
            {filteredEvals.map(ev => (
              <div key={ev.id} className={`bento-card accent-${ev.status === 'REVIEWED' ? 'green' : ev.status === 'SUBMITTED' ? 'purple' : 'yellow'}`} style={{ cursor: 'pointer' }} onClick={() => { setSelected(ev); setTaskScore(ev.taskScore || 80); setAttendanceScore(ev.attendanceScore || 80); setAttitudeScore(ev.attitudeScore || 80); setComment(ev.managerComment || ''); }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold">{ev.userName || ev.user?.fullName || `User #${ev.userId}`}</span>
                    {ev.departmentName && <span className="text-xs text-muted ml-2">({ev.departmentName})</span>}
                  </div>
                  {ev.status === 'REVIEWED'
                    ? <span className={`badge badge-${GRADE_COLORS[getGrade(ev.finalScore)]}`}>{ev.finalScore}/100 · {getGrade(ev.finalScore)}</span>
                    : ev.status === 'SUBMITTED'
                      ? <span className="badge badge-purple">Chờ chấm</span>
                      : <span className="badge badge-yellow">Bản nháp</span>}
                </div>
                <div className="text-xs text-muted mb-2"><Clock size={11} style={{ display: 'inline' }} /> Tháng: {formatMonth(ev.evalMonth)}</div>
                <p className="text-xs">{ev.content?.slice(0, 120)}{ev.content?.length > 120 ? '...' : ''}</p>
              </div>
            ))}
          </div>}

      {/* Scoring drawer / modal */}
      {selected && createPortal(
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: 'min(680px, 95vw)' }}>
            <div className="modal-header">
              <span className="modal-title">Chấm điểm: {selected.userName || `User #${selected.userId}`}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div className="eval-split" style={{ gap: 18 }}>
              {/* Left: self-eval content */}
              <div>
                <h4 className="mb-2 text-secondary">Nội dung tự đánh giá</h4>
                <p className="text-sm" style={{ marginBottom: 10 }}>{selected.content}</p>
                {selected.achievements && <>
                  <div className="badge badge-green mb-1">Thành tích</div>
                  <p className="text-xs mt-1 mb-2">{selected.achievements}</p>
                </>}
                {selected.improvements && <>
                  <div className="badge badge-yellow mb-1">Cần cải thiện</div>
                  <p className="text-xs mt-1">{selected.improvements}</p>
                </>}
              </div>
              {/* Right: scoring / warning */}
              {selected.status === 'DRAFT' ? (
                <div className="bento-card accent-yellow" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, flex: 1 }}>
                  <span className="font-semibold text-warning" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--warning-text)' }}>
                    <Clock size={16} /> Chưa thể chấm điểm
                  </span>
                  <p className="text-xs" style={{ margin: 0 }}>Bản tự đánh giá này hiện đang là bản nháp của thành viên và chưa được nộp chính thức. Bạn chỉ có thể xem nội dung tự đánh giá và cần đợi thành viên nộp chính thức mới có thể chấm điểm.</p>
                </div>
              ) : (
                <div className="flex-col gap-3">
                  <h4 className="text-secondary">Chấm điểm chi tiết</h4>
                  
                  {/* Task Score */}
                  <div style={{ marginBottom: 12 }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="form-label" style={{ marginBottom: 0 }}>Hiệu suất Task (50%)</span>
                      <span className="font-semibold">{taskScore}</span>
                    </div>
                    <input type="range" min="0" max="100" value={taskScore} onChange={e => setTaskScore(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                  </div>

                  {/* Attendance Score */}
                  <div style={{ marginBottom: 12 }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="form-label" style={{ marginBottom: 0 }}>Chuyên cần (30%)</span>
                      <span className="font-semibold">{attendanceScore}</span>
                    </div>
                    <input type="range" min="0" max="100" value={attendanceScore} onChange={e => setAttendanceScore(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--success)' }} />
                  </div>

                  {/* Attitude Score */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="form-label" style={{ marginBottom: 0 }}>Thái độ (20%)</span>
                      <span className="font-semibold">{attitudeScore}</span>
                    </div>
                    <input type="range" min="0" max="100" value={attitudeScore} onChange={e => setAttitudeScore(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--warning)' }} />
                  </div>

                  <div className="flex items-center justify-between" style={{ padding: '12px 14px', background: 'var(--bg-inset)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                    <span className="font-semibold text-sm">Tổng điểm quy đổi</span>
                    <span className={`badge badge-${GRADE_COLORS[getGrade(Math.round(attendanceScore * 0.3 + taskScore * 0.5 + attitudeScore * 0.2))]}`} style={{ fontSize: '1.05rem', padding: '6px 16px' }}>
                      {Math.round(attendanceScore * 0.3 + taskScore * 0.5 + attitudeScore * 0.2)}/100
                    </span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nhận xét</label>
                    <textarea className="form-textarea" placeholder="Nhận xét và góp ý cho thành viên..." value={comment} onChange={e => setComment(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Hủy</button>
              {selected.status === 'SUBMITTED' && (
                <button className="btn btn-success" onClick={() => submitScore(selected.id)} disabled={scoring}>
                  {scoring ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <CheckCircle size={16} />}
                  Xác nhận chấm điểm
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
