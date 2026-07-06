import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { CreditCard, ExternalLink, AlertTriangle, CheckCircle, Clock, Download, Smartphone, X, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Payments() {
  const toast = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState(50000);
  const [orderInfo, setOrderInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // DEMO mode states
  const [showDemoQR, setShowDemoQR] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const presets = [
    { label: 'Hội phí tháng', amount: 50000 },
    { label: 'Quỹ sự kiện', amount: 100000 },
    { label: 'Đồng phục CLB', amount: 200000 },
  ];

  const loadHistory = async () => {
    try {
      const res = await api.get('/payment/history');
      setHistory(res.data?.data || []);
    } catch (e) {
      console.error('Không thể lấy lịch sử thanh toán:', e);
    } finally {
      setLoadingHistory(false);
    }
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const orderId = params.get('orderId');
    const vnpResponseCode = params.get('vnp_ResponseCode');
    const vnpTxnRef = params.get('vnp_TxnRef');

    // Case 1: VNPay redirected back with vnp_* params — need to confirm with backend
    if (vnpTxnRef && vnpResponseCode !== null) {
      // Collect all vnp_ params as an object
      const vnpParams = {};
      for (const [key, value] of params.entries()) {
        vnpParams[key] = value;
      }
      // Clear URL immediately so refresh doesn't re-trigger
      window.history.replaceState({}, '', '/payments');

      // Call backend to confirm and update DB
      api.post('/payment/confirm', vnpParams)
        .then(res => {
          const result = res.data?.data;
          if (result?.status === 'success') {
            toast(`Thanh toán thành công! Mã đơn: ${result.orderId}`, 'success');
          } else {
            const code = result?.responseCode;
            let msg = 'Thanh toán thất bại hoặc bị hủy.';
            if (code === '24') msg = 'Bạn đã hủy giao dịch.';
            else if (code === '11') msg = 'Giao dịch hết hạn. Vui lòng thử lại.';
            else if (code === '51') msg = 'Tài khoản không đủ số dư.';
            toast(msg, 'error');
          }
          loadHistory();
        })
        .catch(() => {
          toast('Không thể xác nhận giao dịch với máy chủ.', 'error');
          loadHistory();
        });
    }
    // Case 2: Legacy redirect with ?status= (from old callback endpoint)
    else if (status === 'success') {
      toast(`Thanh toán thành công! Mã đơn: ${orderId}`, 'success');
      window.history.replaceState({}, '', '/payments');
      loadHistory();
    } else if (status === 'failed') {
      toast('Thanh toán thất bại hoặc bị hủy.', 'error');
      window.history.replaceState({}, '', '/payments');
      loadHistory();
    } else {
      loadHistory();
    }
  }, []);

  const createPayment = async () => {
    if (!amount || amount < 10000) { toast('Số tiền tối thiểu 10,000đ', 'error'); return; }
    setLoading(true); setPaymentUrl('');
    try {
      const r = await api.post('/payment/create', { amount, orderInfo: orderInfo || `Thanh toan CLB - ${new Date().toLocaleDateString('vi-VN')}` });
      const url = r.data?.data?.paymentUrl || r.data?.paymentUrl;
      if (url) {
        setPaymentUrl(url);
        toast('Đã tạo link thanh toán! Nhấn nút để chuyển đến trang VNPay', 'success');
        loadHistory();
      }
    } catch (e) {
      toast(e.response?.data?.message || 'Không thể kết nối cổng thanh toán VNPay', 'error');
    }
    setLoading(false);
  };

  // DEMO: Xác nhận chuyển khoản thủ công
  const handleDemoConfirm = async () => {
    if (!amount || amount < 1000) { toast('Số tiền tối thiểu 1,000đ', 'error'); return; }
    setDemoLoading(true);
    try {
      const res = await api.post('/payment/demo-confirm', {
        amount,
        orderInfo: orderInfo || `Hội phí CLB - ${new Date().toLocaleDateString('vi-VN')}`
      });
      const result = res.data?.data;
      toast(`Chuyển khoản thành công! Mã đơn: ${result?.orderId || 'N/A'}`, 'success');
      setShowDemoQR(false);
      loadHistory();
    } catch (e) {
      toast(e.response?.data?.message || 'Lỗi xác nhận chuyển khoản', 'error');
    } finally {
      setDemoLoading(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    if (status === 'SUCCESS') {
      return {
        background: 'rgba(52, 211, 153, 0.15)',
        color: '#34d399',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: 600,
        display: 'inline-block'
      };
    } else if (status === 'PENDING') {
      return {
        background: 'rgba(251, 191, 36, 0.15)',
        color: '#fbbf24',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: 600,
        display: 'inline-block'
      };
    } else {
      return {
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#ef4444',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: 600,
        display: 'inline-block'
      };
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Đóng Hội phí & Quỹ CLB</h1>
          <p>Thanh toán an toàn, nhanh chóng qua cổng VNPay Sandbox</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button className="btn btn-primary btn-sm" onClick={handleExportPdf} style={{ gap: 6 }}>
            <Download size={14} /> Xuất báo cáo PDF
          </button>
        )}
      </div>

      <div className="grid-2">
        {/* Payment form */}
        <div className="bento-card accent-orange">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={20} className="text-orange" />
            <h3>Tạo yêu cầu thanh toán</h3>
          </div>

          {/* Quick presets */}
          <div className="mb-2">
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Mức phí phổ biến</label>
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
              <input className="form-input" placeholder="Hoi phi thang 5 - Nguyen Van A"
                value={orderInfo} onChange={e => setOrderInfo(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-lg" onClick={createPayment} disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <CreditCard size={18} />}
              Tạo link Thanh toán VNPay
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (!amount || amount < 1000) { toast('Nhập số tiền trước', 'error'); return; }
                setShowDemoQR(true);
              }}
              style={{
                marginTop: 6, fontSize: '0.7rem', gap: 4, padding: '4px 10px',
                color: 'var(--neon-green)', border: '1px dashed var(--neon-green)',
                justifyContent: 'center', opacity: 0.8
              }}
            >
              <Smartphone size={12} /> DEMO — Chuyển khoản MB Bank
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-col gap-3">
          {/* Result */}
          {paymentUrl
            ? <div className="bento-card accent-green">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={18} className="text-green" />
                  <h3>Link thanh toán đã sẵn sàng!</h3>
                </div>
                <p className="text-sm mb-3">Nhấn nút bên dưới để mở trang thanh toán VNPay Sandbox. Dùng thẻ test để hoàn tất giao dịch.</p>
                <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-lg" style={{ display: 'flex', justifyContent: 'center' }}>
                  <ExternalLink size={18} /> Mở trang VNPay
                </a>
                <div style={{
                  marginTop: 12, padding: '8px 12px',
                  background: 'var(--bg-surface)', borderRadius: 8,
                  fontFamily: 'monospace', fontSize: '0.68rem', wordBreak: 'break-all',
                  color: 'var(--text-muted)'
                }}>{paymentUrl}</div>
              </div>
            : <div className="bento-card" style={{ textAlign: 'center', padding: 40 }}>
                <CreditCard size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <p>Link thanh toán sẽ xuất hiện ở đây sau khi tạo</p>
              </div>}

          {/* Warning */}
          <div className="bento-card" style={{ borderColor: 'var(--neon-yellow)', borderLeft: '3px solid var(--neon-yellow)' }}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-yellow" />
              <span className="font-semibold text-sm">Lưu ý cấu hình VNPay</span>
            </div>
            <p className="text-xs">Để tích hợp thật sự, điền <code style={{ background: 'var(--bg-surface)', padding: '1px 6px', borderRadius: 4 }}>vnpay.tmn-code</code> và <code style={{ background: 'var(--bg-surface)', padding: '1px 6px', borderRadius: 4 }}>vnpay.hash-secret</code> trong <strong>application.properties</strong>. Đăng ký tại <a href="https://sandbox.vnpayment.vn/devreg" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--neon-blue)' }}>sandbox.vnpayment.vn/devreg</a></p>
          </div>

          {/* Test card info */}
          <div className="bento-card accent-blue">
            <h4 className="mb-2">Thẻ test VNPay Sandbox</h4>
            <table className="data-table" style={{ fontSize: '0.78rem' }}>
              <tbody>
                {[
                  ['Số thẻ', '9704198526191432198'],
                  ['Tên chủ thẻ', 'NGUYEN VAN A'],
                  ['Ngày phát hành', '07/15'],
                  ['OTP', '123456'],
                ].map(([k, v]) => (
                  <tr key={k}><td style={{ color: 'var(--text-muted)', width: '45%' }}>{k}</td><td style={{ color: 'var(--neon-blue)', fontFamily: 'monospace' }}>{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="card" style={{ marginTop: 24, padding: 24 }}>
        <h3 className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={20} style={{ color: 'var(--accent-light)' }} />
          Lịch sử giao dịch hội phí
        </h3>
        
        {loadingHistory ? (
          <div className="flex justify-center p-3" style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <div className="spinner" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-muted" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
            Chưa có lịch sử giao dịch nào được ghi nhận.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: 12, borderBottom: '1.5px solid var(--border-color)' }}>Mã đơn hàng</th>
                  <th style={{ padding: 12, borderBottom: '1.5px solid var(--border-color)' }}>Nội dung</th>
                  <th style={{ padding: 12, borderBottom: '1.5px solid var(--border-color)' }}>Số tiền</th>
                  <th style={{ padding: 12, borderBottom: '1.5px solid var(--border-color)' }}>Trạng thái</th>
                  <th style={{ padding: 12, borderBottom: '1.5px solid var(--border-color)' }}>Mã giao dịch VNPay</th>
                  <th style={{ padding: 12, borderBottom: '1.5px solid var(--border-color)' }}>Ngân hàng</th>
                  <th style={{ padding: 12, borderBottom: '1.5px solid var(--border-color)' }}>Thời gian tạo</th>
                  <th style={{ padding: 12, borderBottom: '1.5px solid var(--border-color)' }}>Thời gian thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {history.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 12, fontFamily: 'monospace', fontWeight: 600 }}>{tx.orderId}</td>
                    <td style={{ padding: 12 }}>{tx.orderInfo}</td>
                    <td style={{ padding: 12, fontWeight: 700 }}>{tx.amount.toLocaleString('vi-VN')}đ</td>
                    <td style={{ padding: 12 }}>
                      <span style={getStatusBadgeStyle(tx.status)}>
                        {tx.status === 'SUCCESS' ? 'Thành công' : tx.status === 'PENDING' ? 'Chờ thanh toán' : 'Thất bại'}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontFamily: 'monospace' }}>{tx.vnpTransactionNo || '-'}</td>
                    <td style={{ padding: 12 }}>{tx.bankCode || '-'}</td>
                    <td style={{ padding: 12, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td style={{ padding: 12, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {tx.paidAt ? new Date(tx.paidAt).toLocaleString('vi-VN') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DEMO QR Modal */}
      {showDemoQR && createPortal(
        <div className="modal-overlay" onClick={() => setShowDemoQR(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <QrCode size={18} /> Chuyển khoản MB Bank (DEMO)
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDemoQR(false)}><X size={16} /></button>
            </div>

            <div style={{ padding: '16px 0' }}>
              {/* QR Code */}
              <div style={{
                background: '#fff', padding: 12, borderRadius: 12, display: 'inline-block',
                marginBottom: 14, border: '3px solid #1e40af',
                boxShadow: '0 4px 24px rgba(30, 64, 175, 0.15)'
              }}>
                <img
                  src={`https://img.vietqr.io/image/MB-0396704484-compact.png?amount=${amount}&addInfo=${encodeURIComponent(orderInfo || 'Hoi phi CLB')}&accountName=CLB%20UniOps`}
                  alt="QR MB Bank"
                  style={{ display: 'block', width: 220, height: 220, objectFit: 'contain' }}
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent('MB Bank: 0396704484 - ' + amount + 'đ')}`;
                  }}
                />
              </div>

              {/* Bank info */}
              <div style={{
                background: 'var(--glass-thick)', border: '0.5px solid var(--border-glass-default)',
                borderRadius: 10, padding: '12px 16px', textAlign: 'left', marginBottom: 14
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 12px', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-3)' }}>Ngân hàng</span>
                  <span style={{ fontWeight: 700, color: '#1e40af' }}>MB Bank</span>
                  <span style={{ color: 'var(--text-3)' }}>Số TK</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-1)', letterSpacing: 1 }}>0396704484</span>
                  <span style={{ color: 'var(--text-3)' }}>Số tiền</span>
                  <span style={{ fontWeight: 700, color: 'var(--neon-green)' }}>{amount.toLocaleString('vi-VN')}đ</span>
                  <span style={{ color: 'var(--text-3)' }}>Nội dung</span>
                  <span style={{ color: 'var(--text-1)', fontSize: '0.78rem' }}>{orderInfo || 'Hội phí CLB'}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 14, fontStyle: 'italic' }}>
                Quét mã QR hoặc chuyển khoản thủ công, sau đó nhấn xác nhận bên dưới.
              </div>

              <button
                className="btn btn-success btn-lg"
                onClick={handleDemoConfirm}
                disabled={demoLoading}
                style={{ width: '100%', justifyContent: 'center', gap: 8 }}
              >
                {demoLoading
                  ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  : <CheckCircle size={18} />}
                Xác nhận đã chuyển khoản
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
