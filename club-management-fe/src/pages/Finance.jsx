import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, DollarSign, PlusCircle, Trash2, Clock, Check, X, 
  Download, FileText, AlertTriangle, CheckCircle, ExternalLink, Calendar
} from 'lucide-react';

export default function Finance() {
  const toast = useToast();
  const { user } = useAuth();
  
  // Tabs: 'fund' (Sổ quỹ CLB), 'vnpay' (Đóng hội phí), 'budget' (Đề xuất kinh phí)
  const [activeTab, setActiveTab] = useState(user?.role === 'ADMIN' ? 'fund' : 'vnpay');

  // Common loading / data states
  const [transactions, setTransactions] = useState([]);
  const [budgetRequests, setBudgetRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // VNPay payment state (Tab 2)
  const [amount, setAmount] = useState(50000);
  const [orderInfo, setOrderInfo] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [vnpHistory, setVnpHistory] = useState([]);
  const [loadingVnpHistory, setLoadingVnpHistory] = useState(true);
  const [creatingPayment, setCreatingPayment] = useState(false);

  // New transaction form (Admin/Manager)
  const [newTx, setNewTx] = useState({
    title: '',
    type: 'EXPENSE',
    amount: 10000,
    category: 'PROPS',
    receiptUrl: ''
  });
  const [savingTx, setSavingTx] = useState(false);

  // New budget request form (Manager/Admin)
  const [newBudget, setNewBudget] = useState({
    eventId: '',
    title: '',
    amount: 50000,
    description: ''
  });
  const [savingBudget, setSavingBudget] = useState(false);

  const presets = [
    { label: 'Hội phí tháng', amount: 50000 },
    { label: 'Quỹ sự kiện', amount: 100000 },
    { label: 'Đồng phục CLB', amount: 200000 },
  ];

  const loadFundData = async () => {
    try {
      const res = await api.get('/finance/transactions');
      setTransactions(res.data?.data || []);
    } catch (e) {
      console.error('Không thể lấy sổ quỹ:', e);
    }
  };

  const loadBudgetData = async () => {
    try {
      const [bRes, eRes] = await Promise.all([
        api.get('/finance/budget-requests'),
        api.get('/events')
      ]);
      setBudgetRequests(bRes.data?.data || []);
      setEvents(eRes.data?.data || eRes.data || []);
    } catch (e) {
      console.error('Không thể tải đề xuất chi tiêu:', e);
    }
  };

  const loadVnpHistory = async () => {
    try {
      const res = await api.get('/payment/history');
      setVnpHistory(res.data?.data || []);
    } catch (e) {
      console.error('Không thể lấy lịch sử VNPay:', e);
    } finally {
      setLoadingVnpHistory(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadFundData(), loadBudgetData(), loadVnpHistory()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();

    // Check query params for VNPay return url
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const orderId = params.get('orderId');

    if (status === 'success') {
      toast(`Thanh toán thành công! Mã đơn: ${orderId}`, 'success');
      window.history.replaceState({}, '', '/finance');
      setActiveTab('vnpay');
    } else if (status === 'failed') {
      toast('Thanh toán thất bại hoặc bị hủy.', 'error');
      window.history.replaceState({}, '', '/finance');
      setActiveTab('vnpay');
    }
  }, []);

  // VNPay payment creation
  const handleCreateVnpay = async () => {
    if (!amount || amount < 10000) { toast('Số tiền tối thiểu 10,000đ', 'error'); return; }
    setCreatingPayment(true); setPaymentUrl('');
    try {
      const r = await api.post('/payment/create', { amount, orderInfo: orderInfo || `Thanh toán CLB - ${new Date().toLocaleDateString('vi-VN')}` });
      const url = r.data?.data?.paymentUrl || r.data?.paymentUrl;
      if (url) {
        setPaymentUrl(url);
        toast('Đã tạo link thanh toán VNPay!', 'success');
        loadVnpHistory();
      }
    } catch (e) {
      toast(e.response?.data?.message || 'Không thể kết nối cổng VNPay', 'error');
    } finally {
      setCreatingPayment(false);
    }
  };

  // Create manual transaction
  const handleAddTx = async (e) => {
    e.preventDefault();
    if (!newTx.title || !newTx.amount) { toast('Điền thông tin giao dịch!', 'error'); return; }
    setSavingTx(true);
    try {
      const res = await api.post('/finance/transactions', {
        title: newTx.title,
        type: newTx.type,
        amount: Number(newTx.amount),
        category: newTx.category,
        receiptUrl: newTx.receiptUrl
      });
      toast('Ghi nhận giao dịch thành công!', 'success');
      setTransactions(prev => [res.data.data, ...prev]);
      setNewTx({ title: '', type: 'EXPENSE', amount: 10000, category: 'PROPS', receiptUrl: '' });
      loadFundData();
    } catch (err) {
      toast('Lỗi khi lưu giao dịch', 'error');
    } finally {
      setSavingTx(false);
    }
  };

  // Delete transaction
  const handleDeleteTx = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa giao dịch này?')) return;
    try {
      await api.delete(`/finance/transactions/${id}`);
      toast('Đã xóa giao dịch khỏi quỹ', 'success');
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      toast('Lỗi khi xóa giao dịch', 'error');
    }
  };

  // Submit budget request
  const handleAddBudget = async (e) => {
    e.preventDefault();
    if (!newBudget.eventId || !newBudget.title || !newBudget.amount) {
      toast('Điền đầy đủ thông tin đề xuất!', 'error');
      return;
    }
    setSavingBudget(true);
    try {
      const res = await api.post('/finance/budget-requests', {
        eventId: Number(newBudget.eventId),
        title: newBudget.title,
        amount: Number(newBudget.amount),
        description: newBudget.description
      });
      toast('Gửi đề xuất kinh phí thành công!', 'success');
      setBudgetRequests(prev => [res.data.data, ...prev]);
      setNewBudget({ eventId: '', title: '', amount: 50000, description: '' });
    } catch (e) {
      toast('Lỗi khi gửi đề xuất', 'error');
    } finally {
      setSavingBudget(false);
    }
  };

  // Approve/Reject budget
  const handleApproveBudget = async (id) => {
    try {
      const res = await api.put(`/finance/budget-requests/${id}/approve`);
      toast('Đã phê duyệt ngân sách và giải ngân!', 'success');
      setBudgetRequests(prev => prev.map(b => b.id === id ? res.data.data : b));
      loadFundData(); // Fund updated as expense logged
    } catch (e) {
      toast('Lỗi khi phê duyệt đề xuất', 'error');
    }
  };

  const handleRejectBudget = async (id) => {
    const reason = window.prompt('Nhập lý do từ chối kinh phí:');
    if (reason === null) return;
    try {
      const res = await api.put(`/finance/budget-requests/${id}/reject`, { rejectReason: reason || 'Kế hoạch không hợp lý' });
      toast('Đã từ chối kinh phí', 'success');
      setBudgetRequests(prev => prev.map(b => b.id === id ? res.data.data : b));
    } catch (e) {
      toast('Lỗi khi từ chối đề xuất', 'error');
    }
  };

  // Helper values
  const getFundBalance = () => {
    let income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    let expense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    return income - expense;
  };

  const getStatusStyle = (status) => {
    if (status === 'APPROVED' || status === 'SUCCESS') return { color: '#00ff66', background: 'rgba(0,255,102,0.12)' };
    if (status === 'REJECTED' || status === 'FAILED') return { color: '#ff5c00', background: 'rgba(255,92,0,0.12)' };
    return { color: '#00f0ff', background: 'rgba(0,240,255,0.12)' };
  };

  const getStatusLabel = (status) => {
    if (status === 'APPROVED' || status === 'SUCCESS') return 'Đã duyệt';
    if (status === 'REJECTED' || status === 'FAILED') return 'Từ chối';
    return 'Chờ duyệt';
  };

  const handleExportPdf = async () => {
    try {
      const response = await api.get('/admin/reports/payments-pdf', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `payments_report_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Xuất báo cáo PDF thành công! 📄', 'success');
    } catch (err) {
      toast('Lỗi khi xuất báo cáo PDF', 'error');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Tài Chính & Quỹ CLB</h1>
          <p>Quản lý sổ quỹ, nộp hội phí online và duyệt ngân sách chi tiêu sự kiện</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button className="btn btn-primary btn-sm" onClick={handleExportPdf} style={{ gap: 6 }}>
            <Download size={14} /> Xuất PDF hội phí
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2" style={{ marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
        {[
          user?.role === 'ADMIN' && { key: 'fund', label: 'Sổ Quỹ CLB' },
          { key: 'vnpay', label: 'Nộp Hội phí & Quỹ' },
          { key: 'budget', label: 'Đề xuất Kinh phí' }
        ].filter(Boolean).map(t => (
          <button key={t.key} className={`btn btn-sm ${activeTab === t.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-3" style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
      ) : (
        <>
          {/* TAB 1: SỔ QUỸ CLB */}
          {activeTab === 'fund' && user?.role === 'ADMIN' && (
            <div className="flex-col gap-4">
              {/* Balance Card */}
              <div className="bento-card accent-green" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 24 }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Số dư quỹ hiện tại</span>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--neon-green)', margin: '4px 0 0 0' }}>
                    {getFundBalance().toLocaleString('vi-VN')} VNĐ
                  </h1>
                </div>
                <DollarSign size={40} className="text-green" style={{ opacity: 0.8 }} />
              </div>

              <div className="grid-2">
                {/* Manual logging (Admin/Manager) */}
                {['ADMIN', 'MANAGER'].includes(user?.role) ? (
                  <div className="bento-card accent-purple" style={{ padding: 24, height: 'fit-content' }}>
                    <h3 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <PlusCircle size={18} className="text-purple" /> Ghi nhận Thu/Chi thủ công
                    </h3>
                    <form onSubmit={handleAddTx} className="flex-col gap-3">
                      <div className="form-group">
                        <label className="form-label">Tiêu đề giao dịch *</label>
                        <input className="form-input" value={newTx.title} onChange={e => setNewTx({ ...newTx, title: e.target.value })} placeholder="ví dụ: Mua nước đi tập, Tài trợ..." required />
                      </div>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Loại</label>
                          <select className="form-select" value={newTx.type} onChange={e => setNewTx({ ...newTx, type: e.target.value })}>
                            <option value="INCOME">THU (Income)</option>
                            <option value="EXPENSE">CHI (Expense)</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Số tiền (VNĐ) *</label>
                          <input className="form-input" type="number" min="1000" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })} required />
                        </div>
                      </div>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Danh mục</label>
                          <select className="form-select" value={newTx.category} onChange={e => setNewTx({ ...newTx, category: e.target.value })}>
                            <option value="MEMBERSHIP_FEE">Hội phí</option>
                            <option value="SPONSOR">Tài trợ</option>
                            <option value="UNIFORM">Đồng phục</option>
                            <option value="PROPS">Đạo cụ biểu diễn</option>
                            <option value="DRINKS">Ăn uống / Nước uống</option>
                            <option value="RENTAL">Thuê sân khấu/phòng tập</option>
                            <option value="EVENT_COST">Chi phí sự kiện</option>
                            <option value="OTHER">Khác</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Link hóa đơn (nếu có)</label>
                          <input className="form-input" value={newTx.receiptUrl} onChange={e => setNewTx({ ...newTx, receiptUrl: e.target.value })} placeholder="URL hóa đơn/biên nhận" />
                        </div>
                      </div>
                      <button className="btn btn-primary" type="submit" disabled={savingTx} style={{ justifyContent: 'center', marginTop: 10 }}>
                        {savingTx ? 'Đang lưu...' : 'Ghi vào sổ quỹ'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bento-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <DollarSign size={48} className="text-muted" style={{ opacity: 0.4, marginBottom: 12 }} />
                    <h4>Hệ thống giám sát tài chính nội bộ</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 300 }}>Chỉ có Admin và Trưởng ban mới có quyền thêm các giao dịch Thu/Chi thủ công vào quỹ CLB.</p>
                  </div>
                )}

                {/* Sổ cái Fund logs */}
                <div className="bento-card" style={{ padding: 24 }}>
                  <h3 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Nhật ký Giao dịch Quỹ</h3>
                  <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {transactions.length === 0 ? (
                      <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>Chưa có giao dịch quỹ nào.</p>
                    ) : (
                      transactions.map(t => (
                        <div key={t.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 12px', borderBottom: '1px solid var(--border-color)',
                          background: 'rgba(255,255,255,0.01)', borderRadius: 6
                        }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.title}</div>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginRight: 10 }}>Category: {t.category}</span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{
                              fontWeight: 700,
                              color: t.type === 'INCOME' ? 'var(--neon-green)' : 'var(--neon-orange)'
                            }}>
                              {t.type === 'INCOME' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')}đ
                            </span>
                            {user?.role === 'ADMIN' && (
                              <button onClick={() => handleDeleteTx(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neon-red)' }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ĐÓNG HỘI PHÍ VNPay (MIGRATE PAYMENTS.JSX) */}
          {activeTab === 'vnpay' && (
            <div className="grid-2">
              {/* Form nộp */}
              <div className="bento-card accent-orange" style={{ padding: 24 }}>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={20} className="text-orange" />
                  <h3>Đóng Hội phí & Quỹ CLB online</h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Thanh toán qua cổng VNPay Sandbox để hỗ trợ lập quỹ câu lạc bộ nhanh chóng.</p>

                <div className="mb-2">
                  <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Mức đóng gợi ý</label>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {presets.map(p => (
                      <button key={p.label} className={`btn btn-ghost btn-sm ${amount === p.amount ? 'btn-success' : ''}`}
                        style={{ fontSize: '0.78rem' }}
                        onClick={() => { setAmount(p.amount); setOrderInfo(p.label); }}>
                        {p.label}<br />
                        <span style={{ fontSize: '0.7rem' }}>{p.amount.toLocaleString('vi-VN')}đ</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-col gap-3 mt-2">
                  <div className="form-group">
                    <label className="form-label">Số tiền (VNĐ) *</label>
                    <input className="form-input" type="number" min="10000" step="1000"
                      value={amount} onChange={e => setAmount(Number(e.target.value))}
                      placeholder="50000" />
                    <span className="text-xs text-muted mt-1">= {amount.toLocaleString('vi-VN')} đồng</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nội dung thanh toán</label>
                    <input className="form-input" placeholder="Hội phí tháng 6..."
                      value={orderInfo} onChange={e => setOrderInfo(e.target.value)} />
                  </div>
                  <button className="btn btn-primary btn-lg" onClick={handleCreateVnpay} disabled={creatingPayment} style={{ justifyContent: 'center' }}>
                    {creatingPayment ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <CreditCard size={18} />}
                    Tạo Link Thanh toán VNPay
                  </button>
                </div>

                {/* Link output */}
                {paymentUrl && (
                  <div className="bento-card accent-green" style={{ marginTop: 20, padding: 16 }}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={18} className="text-green" />
                      <h4 style={{ margin: 0 }}>Link thanh toán đã sẵn sàng!</h4>
                    </div>
                    <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-lg" style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                      <ExternalLink size={18} /> Mở Trang VNPay
                    </a>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.66rem', wordBreak: 'break-all', color: 'var(--text-secondary)', background: 'var(--bg-main)', padding: 8, borderRadius: 6 }}>{paymentUrl}</div>
                  </div>
                )}
              </div>

              {/* VNPay Test Cards & History */}
              <div className="flex-col gap-3">
                <div className="bento-card accent-blue" style={{ padding: 24 }}>
                  <h4 className="mb-2">Thẻ Test VNPay Sandbox</h4>
                  <table className="data-table" style={{ fontSize: '0.78rem', width: '100%' }}>
                    <tbody>
                      {[
                        ['Số thẻ', '9704198526191432198'],
                        ['Tên chủ thẻ', 'NGUYEN VAN A'],
                        ['Ngày phát hành', '07/15'],
                        ['OTP', '123456'],
                      ].map(([k, v]) => (
                        <tr key={k}><td style={{ color: 'var(--text-secondary)', width: '45%' }}>{k}</td><td style={{ color: 'var(--neon-blue)', fontFamily: 'monospace' }}>{v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bento-card" style={{ padding: 24, overflowX: 'auto' }}>
                  <h4 className="mb-2">Lịch sử nộp tiền online</h4>
                  {loadingVnpHistory ? (
                    <div className="spinner" style={{ margin: '20px auto' }} />
                  ) : vnpHistory.length === 0 ? (
                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>Chưa có giao dịch VNPay nào.</p>
                  ) : (
                    <table className="data-table" style={{ width: '100%', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                          <th>Mã đơn</th>
                          <th>Nội dung</th>
                          <th>Số tiền</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vnpHistory.slice(0, 5).map(h => (
                          <tr key={h.id}>
                            <td style={{ fontFamily: 'monospace' }}>{h.orderId}</td>
                            <td>{h.orderInfo}</td>
                            <td style={{ fontWeight: 700 }}>{h.amount.toLocaleString('vi-VN')}đ</td>
                            <td>
                              <span style={{
                                ...getStatusStyle(h.status),
                                padding: '1px 5px', borderRadius: 4, fontSize: '0.66rem'
                              }}>
                                {h.status === 'SUCCESS' ? 'Thành công' : h.status === 'PENDING' ? 'Chờ' : 'Thất bại'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ĐỀ XUẤT KINH PHÍ SỰ KIỆN */}
          {activeTab === 'budget' && (
            <div className="grid-2">
              {/* Form đề xuất (Manager/Admin) */}
              {['ADMIN', 'MANAGER'].includes(user?.role) ? (
                <div className="bento-card accent-purple" style={{ padding: 24, height: 'fit-content' }}>
                  <h3 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PlusCircle size={18} className="text-purple" /> Đề xuất Dự trù Kinh phí
                  </h3>
                  <form onSubmit={handleAddBudget} className="flex-col gap-3">
                    <div className="form-group">
                      <label className="form-label">Chọn Sự Kiện liên quan *</label>
                      <select className="form-select" value={newBudget.eventId} onChange={e => setNewBudget({ ...newBudget, eventId: e.target.value })} required>
                        <option value="">-- Chọn sự kiện cần chi tiêu --</option>
                        {events.map(ev => (
                          <option key={ev.id} value={ev.id}>{ev.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tiêu đề dự trù (nội dung chi) *</label>
                      <input className="form-input" value={newBudget.title} onChange={e => setNewBudget({ ...newBudget, title: e.target.value })} placeholder="ví dụ: Thuê loa đài sự kiện, Đạo cụ múa..." required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Số tiền yêu cầu (VNĐ) *</label>
                      <input className="form-input" type="number" min="5000" value={newBudget.amount} onChange={e => setNewBudget({ ...newBudget, amount: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Giải trình chi tiết dự án</label>
                      <textarea className="form-input" value={newBudget.description} onChange={e => setNewBudget({ ...newBudget, description: e.target.value })} placeholder="Giải trình mục đích sử dụng ngân sách, bảng báo giá (nếu có)..." rows={3} />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={savingBudget} style={{ justifyContent: 'center' }}>
                      {savingBudget ? 'Đang gửi...' : 'Gửi đề xuất kinh phí'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bento-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <FileText size={48} className="text-muted" style={{ opacity: 0.4, marginBottom: 12 }} />
                  <h4>Đề xuất ngân sách sự kiện</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 300 }}>Chỉ Trưởng ban/Manager hoặc Admin mới được phép lập dự trù chi tiêu cho các hoạt động/sự kiện của câu lạc bộ.</p>
                </div>
              )}

              {/* List of Budget Requests */}
              <div className="bento-card" style={{ padding: 24, overflowX: 'auto' }}>
                <h3 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Danh sách Đề xuất Ngân sách</h3>
                {budgetRequests.length === 0 ? (
                  <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>Chưa có đề xuất kinh phí nào được lập.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {budgetRequests.map(b => (
                      <div key={b.id} className="bento-card" style={{ padding: 16, borderLeft: `3px solid ${b.status === 'APPROVED' ? 'var(--neon-green)' : b.status === 'REJECTED' ? 'var(--neon-orange)' : 'var(--neon-blue)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 600 }}>{b.title}</h4>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                              <span>Số tiền: <strong style={{ color: 'var(--text-primary)' }}>{b.amount.toLocaleString('vi-VN')}đ</strong></span>
                              <span>Sự kiện: <strong style={{ color: 'var(--neon-blue)' }}>{b.event?.title}</strong></span>
                            </div>
                            {b.description && <p style={{ margin: '8px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.1)', padding: 6, borderRadius: 4 }}>{b.description}</p>}
                            {b.rejectReason && <p style={{ margin: '8px 0 0 0', fontSize: '0.78rem', color: 'var(--neon-orange)', fontWeight: 600 }}>Lý do từ chối: {b.rejectReason}</p>}
                          </div>
                          <div>
                            <span style={{
                              ...getStatusStyle(b.status),
                              padding: '2px 6px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 600, display: 'inline-block'
                            }}>{getStatusLabel(b.status)}</span>
                          </div>
                        </div>

                        {/* Admin approval buttons */}
                        {user?.role === 'ADMIN' && b.status === 'PENDING' && (
                          <div className="flex gap-2" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleRejectBudget(b.id)} style={{ color: 'var(--neon-orange)', borderColor: 'rgba(255,92,0,0.2)' }}>
                              <X size={12} /> Từ chối
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => handleApproveBudget(b.id)} style={{ background: 'var(--neon-green)', borderColor: 'var(--neon-green)', color: 'var(--bg-main)' }}>
                              <Check size={12} /> Phê duyệt & Giải ngân
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
