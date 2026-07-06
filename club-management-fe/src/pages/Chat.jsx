import { useState, useEffect, useRef, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../api';
import {
  Send, Paperclip, X, CornerUpLeft, Users, Hash,
  MessageCircle, User, Search, Plus, Trash2, Video, Smile
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

function getInitials(name) {
  return name?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?';
}

function formatTime(iso) {
  try { return format(new Date(iso), 'HH:mm'); } catch { return ''; }
}

// ──────────────────────────────────────────────
// Room Avatar component
// ──────────────────────────────────────────────
function RoomAvatar({ room, size = 38, isOnline = false }) {
  const avatarText = room.avatar || getInitials(room.name);
  const color = room.color || '#6366f1';
  const isEmoji = room.avatar?.length <= 2 && /\p{Emoji}/u.test(room.avatar);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div className="chat-room-avatar" style={{ width: size, height: size, background: isEmoji ? color + '20' : `linear-gradient(135deg, ${color}, ${color}aa)`, borderColor: color + '30', fontSize: isEmoji ? '1.1rem' : '0.75rem', color: isEmoji ? '' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
        {avatarText}
      </div>
      {isOnline && (
        <span 
          style={{ 
            position: 'absolute', 
            bottom: 0, 
            right: 0, 
            width: 10, 
            height: 10, 
            backgroundColor: '#22c55e', 
            border: '2px solid #1e1e2e', 
            borderRadius: '50%',
            boxShadow: '0 0 8px #22c55e',
            zIndex: 2
          }} 
          title="Đang hoạt động"
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Chat Component
// ──────────────────────────────────────────────
export default function Chat() {
  const { user } = useAuth();
  const toast = useToast();
  const myId = user?.id ? Number(user.id) : 5;

  const [rooms, setRooms]           = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [replyTo, setReplyTo]       = useState(null);
  const [typing, setTyping]         = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [search, setSearch]         = useState('');
  const [wsConnected, setWsConnected] = useState(false);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [allUsers, setAllUsers]                 = useState([]);
  const [newChatSearch, setNewChatSearch]       = useState('');
  const [modalTab, setModalTab]                 = useState('direct');
  const [groupName, setGroupName]               = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [roomMembers, setRoomMembers]             = useState([]);
  const [showCallModal, setShowCallModal]         = useState(false);

  // New States for Advanced Chat Features
  const [onlineUsers, setOnlineUsers]           = useState(new Set());
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [activeReactionMenuId, setActiveReactionMenuId] = useState(null);
  const [showSearchBox, setShowSearchBox]       = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [searchResults, setSearchResults]       = useState([]);
  const [searching, setSearching]               = useState(false);

  const messagesEndRef  = useRef(null);
  const stompClientRef  = useRef(null);
  const typingTimerRef  = useRef(null);
  const inputRef        = useRef(null);

  // ── Heartbeat and Online Presence ──────────
  useEffect(() => {
    const sendHeartbeat = () => {
      api.post('/chat/presence/heartbeat').catch(() => {});
    };
    const fetchOnlineUsers = () => {
      api.get('/chat/presence/online')
        .then(res => {
          const list = res.data?.data || res.data || [];
          setOnlineUsers(new Set(list));
        })
        .catch(() => {});
    };

    sendHeartbeat();
    fetchOnlineUsers();

    const heartbeatInterval = setInterval(sendHeartbeat, 15000);
    const fetchInterval = setInterval(fetchOnlineUsers, 15000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(fetchInterval);
    };
  }, []);

  // ── Clear group modal state on close ────────
  useEffect(() => {
    if (!showNewChatModal) {
      setNewChatSearch('');
      setModalTab('direct');
      setGroupName('');
      setSelectedMemberIds([]);
    }
  }, [showNewChatModal]);

  // ── Load rooms ─────────────────────────────
  useEffect(() => {
    api.get('/chat/rooms')
      .then(r => setRooms(r.data?.data || r.data || []))
      .catch(() => {
        toast('Không thể tải danh sách phòng chat', 'error');
        setRooms([]);
      });
  }, []);

  // ── Load all users for direct chat dialog ───
  useEffect(() => {
    if (showNewChatModal) {
      api.get('/users')
        .then(r => {
          const data = r.data?.data || r.data || [];
          setAllUsers(data.filter(u => u.id !== myId));
        })
        .catch(() => {
          toast('Không thể tải danh sách thành viên', 'error');
        });
    }
  }, [showNewChatModal, myId]);

  const handleStartChat = async (targetUserId) => {
    try {
      const response = await api.post('/chat/rooms/direct', { targetUserId });
      const room = response.data?.data || response.data;
      
      // Fetch updated list of rooms to get formatted DM name and details
      const roomsRes = await api.get('/chat/rooms');
      const roomsList = roomsRes.data?.data || roomsRes.data || [];
      setRooms(roomsList);
      
      // Find the formatted room in the loaded list, or fallback to the direct response
      const formattedRoom = roomsList.find(r => r.id === room.id) || room;
      setActiveRoom(formattedRoom);
      
      setShowNewChatModal(false);
      setNewChatSearch('');
      toast('Đã tạo cuộc trò chuyện thành công!', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi bắt đầu trò chuyện', 'error');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này không? Toàn bộ tin nhắn sẽ bị xóa vĩnh viễn.')) {
      return;
    }
    try {
      await api.delete(`/chat/rooms/${roomId}`);
      toast('Đã xóa cuộc trò chuyện thành công!', 'success');
      
      const updatedRooms = rooms.filter(r => r.id !== roomId);
      setRooms(updatedRooms);
      
      if (activeRoom?.id === roomId) {
        setActiveRoom(updatedRooms.length > 0 ? updatedRooms[0] : null);
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi xóa cuộc trò chuyện', 'error');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast('Vui lòng nhập tên nhóm', 'warning');
      return;
    }
    if (selectedMemberIds.length === 0) {
      toast('Vui lòng chọn ít nhất 1 thành viên', 'warning');
      return;
    }
    try {
      const response = await api.post('/chat/rooms/group', {
        name: groupName.trim(),
        type: 'TEAM',
        memberIds: selectedMemberIds
      });
      const room = response.data?.data || response.data;
      
      const roomsRes = await api.get('/chat/rooms');
      const roomsList = roomsRes.data?.data || roomsRes.data || [];
      setRooms(roomsList);
      
      const formattedRoom = roomsList.find(r => r.id === room.id) || room;
      setActiveRoom(formattedRoom);
      
      setShowNewChatModal(false);
      toast('Tạo nhóm chat thành công!', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi tạo nhóm chat', 'error');
    }
  };

  const handleViewMembers = async () => {
    if (!activeRoom) return;
    try {
      const response = await api.get(`/chat/rooms/${activeRoom.id}/members`);
      setRoomMembers(response.data?.data || response.data || []);
      setShowMembersModal(true);
    } catch (err) {
      toast('Không thể lấy danh sách thành viên', 'error');
    }
  };

  // ── Set default active room ─────────────────
  useEffect(() => {
    if (rooms.length && !activeRoom) setActiveRoom(rooms[0]);
  }, [rooms]);

  // ── Load messages for active room ──────────
  useEffect(() => {
    if (!activeRoom) return;
    api.get(`/chat/rooms/${activeRoom.id}/messages?page=0&size=50`)
      .then(r => {
        const msgs = r.data?.data?.content || r.data?.content || r.data || [];
        const finalMsgs = Array.isArray(msgs) ? [...msgs].reverse() : [];
        setMessages(finalMsgs);
      })
      .catch(() => {
        toast('Không thể tải tin nhắn của phòng chat', 'error');
        setMessages([]);
      });
  }, [activeRoom?.id]);

  // ── Scroll to bottom ───────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── WebSocket connect ──────────────────────
  useEffect(() => {
    if (!activeRoom) return;
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: 'Bearer ' + localStorage.getItem('token'),
      },
      onConnect: () => {
        setWsConnected(true);
        client.subscribe(`/topic/chat/${activeRoom.id}`, frame => {
          const msg = JSON.parse(frame.body);
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            if (msg.senderId !== myId) {
              return [...prev, msg];
            }
            const optIndex = prev.findIndex(m => m.senderId === myId && m.content === msg.content && typeof m.id === 'number' && m.id > 1700000000000);
            if (optIndex !== -1) {
              const updated = [...prev];
              updated[optIndex] = msg;
              return updated;
            }
            return [...prev, msg];
          });
          // Mark unread and update preview/timestamp
          setRooms(prev => prev.map(r => r.id === activeRoom.id ? {
            ...r,
            unreadCount: 0,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt
          } : r));
        });
        client.subscribe(`/topic/chat/${activeRoom.id}/reaction`, frame => {
          const data = JSON.parse(frame.body);
          setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m));
        });
        client.subscribe(`/topic/chat/${activeRoom.id}/typing`, frame => {
          const data = JSON.parse(frame.body);
          if (data.userId !== myId) {
            setTypingUser(data.isTyping ? data.userName : null);
          }
        });
      },
      onDisconnect: () => setWsConnected(false),
      onStompError: () => setWsConnected(false),
    });
    try { client.activate(); } catch {}
    stompClientRef.current = client;
    return () => { try { client.deactivate(); } catch {} };
  }, [activeRoom?.id]);

  // ── Send message ───────────────────────────
  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activeRoom) return;
    const content = input.trim();
    setInput('');
    setReplyTo(null);

    // Optimistic update
    const optimistic = {
      id: Date.now(), roomId: activeRoom.id, senderId: myId,
      senderName: user?.fullName || 'Bạn',
      content, type: 'TEXT', replyToId: replyTo?.id || null,
      replyTo: replyTo ? { id: replyTo.id, content: replyTo.content, senderName: replyTo.senderName } : null,
      reactions: {},
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    // Update rooms list with last message and last message time
    setRooms(prev => prev.map(r => r.id === activeRoom.id ? {
      ...r,
      lastMessage: content,
      lastMessageTime: optimistic.createdAt
    } : r));

    // Try WS first
    if (wsConnected && stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: '/app/chat/send',
        body: JSON.stringify({ roomId: activeRoom.id, content, type: 'TEXT', replyToId: replyTo?.id || null }),
      });
    } else {
      // REST fallback
      api.post(`/chat/rooms/${activeRoom.id}/messages`, { content, type: 'TEXT' }).catch(() => {});
    }
  }, [input, activeRoom, myId, wsConnected, replyTo]);

  // ── Typing indicator ───────────────────────
  const handleTyping = (val) => {
    setInput(val);
    if (!wsConnected || !stompClientRef.current?.connected) return;
    clearTimeout(typingTimerRef.current);
    stompClientRef.current.publish({
      destination: '/app/chat/typing',
      body: JSON.stringify({ roomId: activeRoom?.id, isTyping: true }),
    });
    typingTimerRef.current = setTimeout(() => {
      stompClientRef.current?.publish({
        destination: '/app/chat/typing',
        body: JSON.stringify({ roomId: activeRoom?.id, isTyping: false }),
      });
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Filter, sort & deduplicate rooms ────────
  const getSortedRooms = (type) => {
    const filtered = rooms.filter(r => r.type === type && (!search || r.name?.toLowerCase()?.includes(search.toLowerCase())));
    
    let unique = filtered;
    if (type === 'DIRECT') {
      const seen = new Set();
      unique = [];
      const sortedAll = [...filtered].sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || a.createdAt);
        const timeB = new Date(b.lastMessageTime || b.createdAt);
        return timeB - timeA;
      });
      for (const r of sortedAll) {
        const key = r.targetUserId || r.name;
        if (key && !seen.has(key)) {
          seen.add(key);
          unique.push(r);
        }
      }
      return unique;
    }
    
    return [...unique].sort((a, b) => {
      const timeA = new Date(a.lastMessageTime || a.createdAt);
      const timeB = new Date(b.lastMessageTime || b.createdAt);
      return timeB - timeA;
    });
  };

  const handleReact = async (messageId, emoji) => {
    try {
      const res = await api.put(`/chat/messages/${messageId}/react`, { emoji });
      const updatedReactions = res.data?.data || res.data;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: updatedReactions } : m));
    } catch (err) {
      toast('Không thể cập nhật cảm xúc', 'error');
    }
  };

  const getGroupedReactions = (reactionsMap) => {
    if (!reactionsMap) return [];
    const groups = {};
    Object.entries(reactionsMap).forEach(([userId, emoji]) => {
      if (!groups[emoji]) {
        groups[emoji] = { emoji, count: 0, userIds: [] };
      }
      groups[emoji].count += 1;
      groups[emoji].userIds.push(Number(userId));
    });
    return Object.values(groups);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom) return;

    if (file.size > 10 * 1024 * 1024) {
      toast('Tệp đính kèm không được vượt quá 10MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      toast('Đang tải tệp lên...', 'info');
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = response.data?.data || response.data;
      const fileUrl = data.fileUrl;
      const type = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';

      const optimistic = {
        id: Date.now(), roomId: activeRoom.id, senderId: myId,
        senderName: user?.fullName || 'Bạn',
        content: fileUrl, type, replyToId: replyTo?.id || null,
        replyTo: replyTo ? { id: replyTo.id, content: replyTo.content, senderName: replyTo.senderName } : null,
        reactions: {},
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimistic]);
      setReplyTo(null);

      if (wsConnected && stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: '/app/chat/send',
          body: JSON.stringify({ roomId: activeRoom.id, content: fileUrl, type, replyToId: replyTo?.id || null }),
        });
      } else {
        await api.post(`/chat/rooms/${activeRoom.id}/messages`, { content: fileUrl, type, replyToId: replyTo?.id || null });
      }
      toast('Tải tệp lên thành công', 'success');
    } catch (err) {
      toast('Lỗi khi tải tệp lên', 'error');
    }
  };

  const handleMessageSearch = async (val) => {
    setMessageSearchQuery(val);
    if (!val.trim() || !activeRoom) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/chat/rooms/${activeRoom.id}/search`, { params: { query: val } });
      setSearchResults(res.data?.data || res.data || []);
    } catch (err) {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  const jumpToMessage = (messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.boxShadow = '0 0 12px var(--accent)';
      setTimeout(() => {
        el.style.boxShadow = '';
      }, 2000);
    } else {
      toast('Tin nhắn nằm ở phần lịch sử cũ hơn', 'info');
    }
  };

  const teamRooms  = [...getSortedRooms('CLB'), ...getSortedRooms('DEPARTMENT'), ...getSortedRooms('TEAM')];
  const directRooms = getSortedRooms('DIRECT');

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1>💬 Nhắn tin</h1>
        <p>Trao đổi với đội và đồng đội của bạn</p>
      </div>
      <div className="chat-layout">
        {/* ── Left sidebar ── */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input
                placeholder="Tìm kiếm..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', background: 'var(--glass-thick)', border: '0.5px solid var(--border-glass-default)', borderRadius: 999, padding: '7px 10px 7px 30px', fontSize: '0.78rem', color: 'var(--text-1)', outline: 'none' }}
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: 32, height: 32, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              onClick={() => setShowNewChatModal(true)}
              title="Nhắn tin mới"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="chat-room-list">
            {/* Group rooms */}
            {teamRooms.length > 0 && (
              <>
                <div className="chat-section-divider">Nhóm</div>
                {teamRooms.map(r => (
                  <div key={r.id} className={`chat-room-item ${activeRoom?.id === r.id ? 'active' : ''}`} onClick={() => { setActiveRoom(r); setRooms(prev => prev.map(x => x.id === r.id ? { ...x, unreadCount: 0 } : x)); }}>
                    <RoomAvatar room={r} />
                    <div className="chat-room-info">
                      <div className="chat-room-name">{r.name}</div>
                      <div className="chat-room-preview">{r.lastMessage || 'Chưa có tin nhắn'}</div>
                    </div>
                    {r.unreadCount > 0 && <div className="chat-unread-badge">{r.unreadCount}</div>}
                  </div>
                ))}
              </>
            )}

            {/* DM rooms */}
            {directRooms.length > 0 && (
              <>
                <div className="chat-section-divider">Tin nhắn riêng</div>
                {directRooms.map(r => (
                  <div key={r.id} className={`chat-room-item ${activeRoom?.id === r.id ? 'active' : ''}`} onClick={() => { setActiveRoom(r); setRooms(prev => prev.map(x => x.id === r.id ? { ...x, unreadCount: 0 } : x)); }}>
                    <RoomAvatar room={r} isOnline={onlineUsers.has(r.targetUserId)} />
                    <div className="chat-room-info">
                      <div className="chat-room-name">{r.name}</div>
                      <div className="chat-room-preview">{r.lastMessage || ''}</div>
                    </div>
                    {r.unreadCount > 0 && <div className="chat-unread-badge">{r.unreadCount}</div>}
                  </div>
                ))}
              </>
            )}

            {rooms.length === 0 && (
              <div className="empty-state" style={{ padding: 32 }}>
                <MessageCircle size={32} /><p>Chưa có phòng chat nào</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Main chat area ── */}
        {activeRoom ? (
          <div className="chat-main">
            {/* Header */}
            <div className="chat-main-header">
              <RoomAvatar room={activeRoom} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{activeRoom.name}</div>
                <div style={{ fontSize: '0.68rem', color: wsConnected ? 'var(--success)' : 'var(--text-3)', marginTop: 1 }}>
                  {wsConnected ? '● Đã kết nối' : '○ Ngoại tuyến'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  className="btn btn-ghost btn-icon" 
                  title="Tìm kiếm tin nhắn"
                  onClick={() => { setShowSearchBox(p => !p); setMessageSearchQuery(''); setSearchResults([]); }}
                  style={{ color: showSearchBox ? 'var(--accent)' : 'inherit' }}
                >
                  <Search size={15} />
                </button>
                <button 
                  className="btn btn-ghost btn-icon" 
                  title="Họp Video trực tuyến"
                  onClick={() => setShowCallModal(true)}
                  style={{ color: 'var(--accent-light)' }}
                >
                  <Video size={16} />
                </button>
                {activeRoom.type !== 'DIRECT' && (
                  <button 
                    className="btn btn-ghost btn-icon" 
                    title="Danh sách thành viên"
                    onClick={handleViewMembers}
                  >
                    <Users size={15} />
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-icon"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => handleDeleteRoom(activeRoom.id)}
                  title="Xóa cuộc trò chuyện"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Message Search Box */}
            {showSearchBox && (
              <div style={{ padding: '8px 16px', borderBottom: '0.5px solid var(--border-glass-subtle)', background: 'var(--glass-thick, rgba(255,255,255,0.02))', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    placeholder="Nhập từ khóa tìm kiếm tin nhắn..."
                    value={messageSearchQuery}
                    onChange={e => handleMessageSearch(e.target.value)}
                    style={{ flex: 1, background: 'var(--glass-thick)', border: '0.5px solid var(--border-glass-default)', borderRadius: 6, padding: '6px 12px', fontSize: '0.78rem', color: 'var(--text-1)', outline: 'none' }}
                  />
                  <button className="btn btn-ghost btn-icon" onClick={() => { setShowSearchBox(false); setMessageSearchQuery(''); setSearchResults([]); }}><X size={14} /></button>
                </div>
                {searchResults.length > 0 && (
                  <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 600 }}>Kết quả tìm thấy ({searchResults.length}):</div>
                    {searchResults.map(res => (
                      <div 
                        key={res.id} 
                        onClick={() => jumpToMessage(res.id)}
                        style={{ padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: '0.75rem', border: '0.5px solid var(--border-glass-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{res.senderName}</span>
                          <span style={{ color: 'var(--text-1)' }}>{res.content.startsWith('/uploads/') ? '[Tệp đính kèm]' : res.content}</span>
                        </div>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-3)' }}>{formatTime(res.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {messageSearchQuery && searchResults.length === 0 && !searching && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'center', padding: '8px 0' }}>Không tìm thấy kết quả phù hợp</div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="chat-messages-area">
              {messages.map((msg, i) => {
                const isOwn = Number(msg.senderId) === myId;
                const showName = !isOwn && (i === 0 || messages[i-1]?.senderId !== msg.senderId);
                return (
                  <motion.div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    className={`chat-message ${isOwn ? 'own' : 'other'}`}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transition: 'box-shadow 0.3s ease, border-radius 0.3s ease', padding: '4px' }}
                  >
                    {!isOwn && (
                      <div className="chat-avatar-sm" style={{ background: `linear-gradient(135deg, #6366f1, #8b5cf6)`, flexShrink: 0, alignSelf: 'flex-end' }}>
                        {getInitials(msg.senderName)}
                      </div>
                    )}
                    <div 
                      style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '100%', alignItems: isOwn ? 'flex-end' : 'flex-start', position: 'relative' }}
                      onMouseEnter={() => setHoveredMessageId(msg.id)}
                      onMouseLeave={() => { setHoveredMessageId(null); setActiveReactionMenuId(null); }}
                    >
                      {showName && <div className="chat-sender-name">{msg.senderName}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                        <div
                          className={`chat-bubble ${isOwn ? 'own' : 'other'}`}
                          onDoubleClick={() => setReplyTo(msg)}
                          title="Double-click để trả lời"
                          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                        >
                          {msg.replyTo && (
                            <div className="chat-bubble-reply-context" style={{ opacity: 0.8, fontSize: '0.72rem', borderLeft: '2px solid var(--accent)', paddingLeft: '8px', marginBottom: '6px', background: isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: '4px', padding: '4px 8px' }}>
                              <strong style={{ color: 'var(--accent-light)' }}>{msg.replyTo.senderName}</strong>: {msg.replyTo.content.startsWith('/uploads/') ? '[Tệp đính kèm]' : msg.replyTo.content.slice(0, 60)}
                            </div>
                          )}
                          {msg.type === 'IMAGE' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <img
                                src={`http://localhost:8080${msg.content}`}
                                alt="Gửi ảnh"
                                style={{ maxWidth: '280px', maxHeight: '200px', borderRadius: '8px', cursor: 'pointer', objectFit: 'cover' }}
                                onClick={() => window.open(`http://localhost:8080${msg.content}`, '_blank')}
                              />
                            </div>
                          ) : msg.type === 'FILE' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                              <Paperclip size={16} style={{ flexShrink: 0 }} />
                              <a
                                href={`http://localhost:8080${msg.content}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'inherit', textDecoration: 'underline', fontSize: '0.82rem', wordBreak: 'break-all' }}
                              >
                                {msg.content.split('/').pop() || 'Tải xuống tệp tin'}
                              </a>
                            </div>
                          ) : (
                            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</span>
                          )}
                          <div className="chat-bubble-time" style={{ alignSelf: 'flex-end', marginTop: 2 }}>{formatTime(msg.createdAt)}</div>
                        </div>

                        {/* Reaction Picker Button on Hover */}
                        {hoveredMessageId === msg.id && (
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => setActiveReactionMenuId(p => p === msg.id ? null : msg.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}
                              title="Thả cảm xúc"
                            >
                              <Smile size={16} />
                            </button>
                            
                            {/* Emoji Picker Popup */}
                            {activeReactionMenuId === msg.id && (
                              <div style={{ position: 'absolute', bottom: '100%', left: isOwn ? 'auto' : 0, right: isOwn ? 0 : 'auto', background: 'var(--glass-ultra, rgba(30, 30, 46, 0.95))', border: '0.5px solid var(--border-glass-default)', borderRadius: '999px', padding: '4px 8px', display: 'flex', gap: 6, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', backdropFilter: 'blur(10px)', marginBottom: 4 }}>
                                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => { handleReact(msg.id, emoji); setActiveReactionMenuId(null); }}
                                    style={{ background: 'none', border: 'none', fontSize: '1.05rem', cursor: 'pointer', padding: '2px 4px', transition: 'transform 0.1s' }}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Grouped Reactions display */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                          {getGroupedReactions(msg.reactions).map(g => {
                            const hasReacted = g.userIds.includes(myId);
                            return (
                              <button
                                key={g.emoji}
                                onClick={() => handleReact(msg.id, g.emoji)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '2px 6px',
                                  borderRadius: 12,
                                  background: hasReacted ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                  border: hasReacted ? '0.5px solid #6366f1' : '0.5px solid var(--border-glass-subtle)',
                                  fontSize: '0.7rem',
                                  color: 'var(--text-1)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                title={g.userIds.length + ' người phản ứng'}
                              >
                                <span>{g.emoji}</span>
                                <span>{g.count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing indicator */}
              <AnimatePresence>
                {typingUser && (
                  <motion.div className="chat-message other" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="chat-avatar-sm">{getInitials(typingUser)}</div>
                    <div className="chat-bubble other">
                      <div className="typing-indicator">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Reply preview */}
            <AnimatePresence>
              {replyTo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ padding: '8px 16px', borderTop: '0.5px solid var(--border-glass-subtle)', background: 'var(--glass-ultra)', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <CornerUpLeft size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div className="chat-reply-preview" style={{ flex: 1 }}>
                    <strong style={{ color: 'var(--accent-light)' }}>{replyTo.senderName}</strong>: {replyTo.content.slice(0, 60)}{replyTo.content.length > 60 ? '…' : ''}
                  </div>
                  <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={() => setReplyTo(null)}><X size={12} /></button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input bar */}
            <div className="chat-input-bar">
              <input
                type="file"
                id="chat-file-input"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button 
                className="btn btn-ghost btn-icon" 
                title="Đính kèm file"
                onClick={() => document.getElementById('chat-file-input')?.click()}
              >
                <Paperclip size={16} />
              </button>
              <input
                ref={inputRef}
                className="chat-input"
                placeholder={`Nhắn tin ${activeRoom.name}...`}
                value={input}
                onChange={e => handleTyping(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={2000}
              />
              <motion.button
                className="chat-send-btn"
                onClick={sendMessage}
                disabled={!input.trim()}
                whileTap={{ scale: 0.9 }}
              >
                <Send size={16} />
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="chat-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-state">
              <MessageCircle size={48} />
              <h3>Chọn một phòng để bắt đầu</h3>
              <p>Chọn nhóm hoặc tin nhắn riêng từ danh sách bên trái</p>
            </div>
          </div>
        )}
      </div>

      {/* ── New Chat Modal ── */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowNewChatModal(false)}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 400 }}
            >
              <div className="modal-header">
                <span className="modal-title">Bắt đầu trò chuyện mới</span>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowNewChatModal(false)}><X size={15} /></button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass-subtle)', marginBottom: 12 }}>
                <button
                  onClick={() => { setModalTab('direct'); setNewChatSearch(''); }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    borderBottom: modalTab === 'direct' ? '2px solid var(--accent)' : 'none',
                    color: modalTab === 'direct' ? 'var(--text-1)' : 'var(--text-3)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Trò chuyện cá nhân
                </button>
                <button
                  onClick={() => { setModalTab('group'); setNewChatSearch(''); }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    borderBottom: modalTab === 'group' ? '2px solid var(--accent)' : 'none',
                    color: modalTab === 'group' ? 'var(--text-1)' : 'var(--text-3)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Tạo nhóm chat
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {modalTab === 'direct' ? (
                  <>
                    <div style={{ position: 'relative' }}>
                      <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                      <input
                        placeholder="Tìm tên hoặc email thành viên..."
                        value={newChatSearch}
                        onChange={e => setNewChatSearch(e.target.value)}
                        style={{ width: '100%', paddingLeft: 28, paddingRight: 12, height: 36, borderRadius: 8, border: '0.5px solid var(--border-glass-default)', background: 'var(--glass-thick)', color: 'var(--text-1)', fontSize: '0.78rem', outline: 'none' }}
                      />
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thành viên:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
                      {allUsers
                        .filter(u => {
                          const name = u.fullName || u.name || '';
                          const email = u.email || '';
                          const query = newChatSearch.toLowerCase();
                          return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
                        })
                        .map(u => (
                          <div
                            key={u.id}
                            onClick={() => handleStartChat(u.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                              background: 'var(--glass-regular)',
                              border: '0.5px solid var(--border-glass-default)',
                              transition: 'all 0.15s'
                            }}
                            className="new-chat-user-item"
                          >
                            <div className="chat-avatar-sm" style={{ width: 26, height: 26, fontSize: '0.65rem', background: `linear-gradient(135deg, #6366f1, #8b5cf6)` }}>
                              {getInitials(u.fullName || u.name)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500, fontSize: '0.8rem', color: 'var(--text-1)' }}>{u.fullName || u.name}</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{u.email} · {u.role}</div>
                            </div>
                            <MessageCircle size={14} style={{ color: 'var(--accent)' }} />
                          </div>
                        ))}
                      {allUsers.filter(u => {
                        const name = u.fullName || u.name || '';
                        const email = u.email || '';
                        const query = newChatSearch.toLowerCase();
                        return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
                      }).length === 0 && (
                        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.78rem' }}>Không tìm thấy thành viên</div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tên nhóm chat</label>
                      <input
                        placeholder="Nhập tên nhóm..."
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--border-glass-default)', background: 'var(--glass-thick)', color: 'var(--text-1)', fontSize: '0.78rem', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thêm thành viên</label>
                      <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                        <input
                          placeholder="Tìm thành viên tham gia nhóm..."
                          value={newChatSearch}
                          onChange={e => setNewChatSearch(e.target.value)}
                          style={{ width: '100%', paddingLeft: 28, paddingRight: 12, height: 36, borderRadius: 8, border: '0.5px solid var(--border-glass-default)', background: 'var(--glass-thick)', color: 'var(--text-1)', fontSize: '0.78rem', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4, marginTop: 4 }}>
                      {allUsers
                        .filter(u => {
                          const name = u.fullName || u.name || '';
                          const email = u.email || '';
                          const query = newChatSearch.toLowerCase();
                          return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
                        })
                        .map(u => {
                          const isSelected = selectedMemberIds.includes(u.id);
                          return (
                            <div
                              key={u.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedMemberIds(selectedMemberIds.filter(id => id !== u.id));
                                } else {
                                  setSelectedMemberIds([...selectedMemberIds, u.id]);
                                }
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                                background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--glass-regular)',
                                border: isSelected ? '0.5px solid var(--accent)' : '0.5px solid var(--border-glass-default)',
                                transition: 'all 0.15s'
                              }}
                              className="new-chat-user-item"
                            >
                              <div className="chat-avatar-sm" style={{ width: 26, height: 26, fontSize: '0.65rem', background: `linear-gradient(135deg, #6366f1, #8b5cf6)` }}>
                                {getInitials(u.fullName || u.name)}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500, fontSize: '0.8rem', color: 'var(--text-1)' }}>{u.fullName || u.name}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{u.email}</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                              />
                            </div>
                          );
                        })}
                      {allUsers.filter(u => {
                        const name = u.fullName || u.name || '';
                        const email = u.email || '';
                        const query = newChatSearch.toLowerCase();
                        return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
                      }).length === 0 && (
                        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.78rem' }}>Không tìm thấy thành viên</div>
                      )}
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={handleCreateGroup}
                      disabled={!groupName.trim() || selectedMemberIds.length === 0}
                      style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <Users size={14} />
                      <span>Tạo nhóm chat ({selectedMemberIds.length} thành viên)</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Room Members Modal ── */}
      <AnimatePresence>
        {showMembersModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowMembersModal(false)}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 380 }}
            >
              <div className="modal-header">
                <span className="modal-title">Thành viên nhóm ({roomMembers.length})</span>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowMembersModal(false)}><X size={15} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                {roomMembers.map(m => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: 'var(--glass-regular)',
                      border: '0.5px solid var(--border-glass-default)'
                    }}
                  >
                    <div className="chat-avatar-sm" style={{ width: 28, height: 28, fontSize: '0.7rem', background: `linear-gradient(135deg, #6366f1, #8b5cf6)` }}>
                      {getInitials(m.fullName || m.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.8rem', color: 'var(--text-1)' }}>{m.fullName || m.name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{m.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Video Call Modal ── */}
      <AnimatePresence>
        {showCallModal && activeRoom && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCallModal(false)}
            style={{ zIndex: 9999 }}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 960, width: '95vw', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0 }}
            >
              <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass-subtle)' }}>
                <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Video size={16} style={{ color: 'var(--accent-light)' }} />
                  Họp trực tuyến: {activeRoom.name}
                </span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <a 
                    href={`https://meet.jit.si/RinUniOps_Room_${activeRoom.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    Mở tab mới
                  </a>
                  <button className="btn btn-ghost btn-icon" onClick={() => setShowCallModal(false)}><X size={15} /></button>
                </div>
              </div>

              <div style={{ flex: 1, background: '#111', borderRadius: '0 0 12px 12px', overflow: 'hidden', position: 'relative' }}>
                <iframe
                  src={`https://meet.jit.si/RinUniOps_Room_${activeRoom.id}#userInfo.displayName="${encodeURIComponent(user?.fullName || 'User')}"`}
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
