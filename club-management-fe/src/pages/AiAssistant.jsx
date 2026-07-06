import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { Brain, Sparkles, Send, FileText, Users, MessageSquare, Trash2 } from 'lucide-react';

export default function AiAssistant() {
  const { isManager } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('suggest');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  // Suggest assignees
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');

  // Summarize meeting
  const [meetingContent, setMeetingContent] = useState('');

  // AI Chat states
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('ai_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const suggestAssignees = async () => {
    if (!taskTitle) { toast('Nhập tên công việc để AI gợi ý', 'error'); return; }
    setLoading(true); setResult('');
    try {
      const r = await api.post('/ai/suggest-assignees', { title: taskTitle, description: taskDesc });
      const payload = r.data?.data || r.data;
      setResult(typeof payload === 'string' ? payload : (payload?.suggestion || JSON.stringify(payload, null, 2)));
    } catch (e) {
      toast(e.response?.data?.message || 'Không thể kết nối với dịch vụ AI', 'error');
    }
    setLoading(false);
  };

  const summarizeMeeting = async () => {
    if (!meetingContent) { toast('Nhập nội dung biên bản họp để tóm tắt', 'error'); return; }
    setLoading(true); setResult('');
    try {
      const r = await api.post('/ai/summarize-meeting', { content: meetingContent });
      const payload = r.data?.data || r.data;
      setResult(typeof payload === 'string' ? payload : (payload?.summary || JSON.stringify(payload, null, 2)));
    } catch (e) {
      toast(e.response?.data?.message || 'Không thể kết nối với dịch vụ AI', 'error');
    }
    setLoading(false);
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', content: chatInput.trim() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    sessionStorage.setItem('ai_chat_messages', JSON.stringify(updatedMessages));
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMsg.content });
      const reply = res.data?.data || res.data;
      const finalMessages = [...updatedMessages, { role: 'assistant', content: reply }];
      setChatMessages(finalMessages);
      sessionStorage.setItem('ai_chat_messages', JSON.stringify(finalMessages));
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi gửi tin nhắn cho AI', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await api.delete('/ai/chat/history');
      setChatMessages([]);
      sessionStorage.removeItem('ai_chat_messages');
      toast('Đã xóa lịch sử chat thành công!', 'success');
    } catch (err) {
      toast('Lỗi khi xóa lịch sử chat', 'error');
    }
  };

  if (!isManager()) return (
    <div className="empty-state" style={{ marginTop: 60 }}>
      <Brain size={56} />
      <h3>Tính năng dành cho Quản lý</h3>
      <p>Trợ lý AI chỉ dành cho Trưởng ban và Chủ nhiệm CLB</p>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1><Brain size={28} style={{ display: 'inline', marginRight: 10 }} />Trợ lý AI</h1>
        <p>Gợi ý nhân sự thông minh và tóm tắt biên bản họp tự động với OpenAI</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-3">
        <button className={`btn ${tab === 'suggest' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setTab('suggest'); setResult(''); }}>
          <Users size={16} /> Gợi ý Nhân sự
        </button>
        <button className={`btn ${tab === 'summarize' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setTab('summarize'); setResult(''); }}>
          <FileText size={16} /> Tóm tắt Cuộc họp
        </button>
        <button className={`btn ${tab === 'chat' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('chat')}>
          <MessageSquare size={16} /> Chat với AI
        </button>
      </div>

      {tab === 'chat' ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '520px', padding: 20, marginTop: 14 }}>
          {/* Chat Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={18} className="text-purple" />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Hội thoại Trợ lý AI</h3>
            </div>
            <button className="btn btn-ghost btn-sm text-danger" onClick={handleClearChat} style={{ gap: 6, fontSize: '0.76rem', color: 'var(--danger)' }}>
              <Trash2 size={13} /> Xóa lịch sử
            </button>
          </div>

          {/* Messages Container */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '10px 4px', marginBottom: 16 }}>
            {chatMessages.length === 0 ? (
              <div className="empty-state" style={{ margin: 'auto' }}>
                <Brain size={40} />
                <p>Bắt đầu cuộc trò chuyện. Trợ lý AI sẽ ghi nhớ ngữ cảnh cuộc trò chuyện của bạn.</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    fontSize: '0.86rem',
                    lineHeight: 1.4,
                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-3)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-1)',
                    borderBottomRightRadius: msg.role === 'user' ? 2 : 12,
                    borderBottomLeftRadius: msg.role === 'user' ? 12 : 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: 'var(--bg-3)',
                  borderBottomLeftRadius: 2,
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center'
                }}>
                  <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>AI đang trả lời...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Footer */}
          <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Nhập tin nhắn..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              disabled={chatLoading}
              style={{ flex: 1, padding: '10px 14px' }}
            />
            <button type="submit" className="btn btn-primary" disabled={chatLoading || !chatInput.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        <div className="grid-2">
          {/* Left: Input panel */}
          <div className="bento-card accent-purple">
            {tab === 'suggest' ? (
              <div className="flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={18} className="text-purple" />
                  <h3>Mô tả Công việc cần giao</h3>
                </div>
                <div className="form-group">
                  <label className="form-label">Tên công việc *</label>
                  <input className="form-input" placeholder="VD: Quay video TikTok giới thiệu CLB" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả chi tiết</label>
                  <textarea className="form-textarea" style={{ minHeight: 120 }}
                    placeholder="Cần người có kỹ năng edit video, có thiết bị quay tốt, biết dùng CapCut..."
                    value={taskDesc} onChange={e => setTaskDesc(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={suggestAssignees} disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Brain size={16} />}
                  AI Gợi ý nhân sự
                </button>
              </div>
            ) : (
              <div className="flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={18} className="text-purple" />
                  <h3>Nội dung Biên bản họp</h3>
                </div>
                <div className="form-group">
                  <label className="form-label">Nội dung cuộc họp *</label>
                  <textarea className="form-textarea" style={{ minHeight: 200 }}
                    placeholder="Dán toàn bộ nội dung biên bản họp vào đây. AI sẽ tóm tắt và liệt kê các đầu việc cần thực hiện..."
                    value={meetingContent} onChange={e => setMeetingContent(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={summarizeMeeting} disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Brain size={16} />}
                  AI Tóm tắt cuộc họp
                </button>
              </div>
            )}
          </div>

          {/* Right: AI Response */}
          <div className="bento-card accent-blue">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-blue" />
              <h3>Kết quả AI</h3>
            </div>
            {loading ? (
              <div className="loading-page" style={{ minHeight: 180 }}>
                <div className="spinner" />
                <p>AI đang phân tích...</p>
              </div>
            ) : result ? (
              <div className="ai-bubble ai" style={{ maxWidth: '100%', whiteSpace: 'pre-wrap' }}>{result}</div>
            ) : (
              <div className="empty-state" style={{ padding: 40 }}>
                <Brain size={40} />
                <p>Kết quả AI sẽ hiển thị ở đây</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
