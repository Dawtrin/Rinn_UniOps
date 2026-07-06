-- ===================================
-- INITIAL SEED DATA (Safe for re-run)
-- ===================================

-- Keep existing data and only insert missing ones (non-destructive seed)


-- Departments
INSERT IGNORE INTO departments (id, name, description) VALUES
(1, 'Ban Chuyên môn', 'Phụ trách kỹ thuật nhảy và biên đạo'),
(2, 'Ban Truyền thông', 'Phụ trách mạng xã hội, ảnh, video'),
(3, 'Ban Đối ngoại', 'Phụ trách liên hệ đối tác, tài trợ'),
(4, 'Ban Hậu cần', 'Phụ trách trang phục, đạo cụ, hậu trường');

-- Users (password = "password123" has been hashed with BCrypt)
INSERT IGNORE INTO users (id, full_name, email, password_hash, phone, role, department_id, is_active, xp, level, avatar_url, created_at, updated_at) VALUES
(1, 'Nguyễn Thị Lan', 'admin@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0912345678', 'ADMIN', 1, true, 1200, 5, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', NOW(), NOW()),
(2, 'Trần Thanh Sơn', 'son.tran@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0987654321', 'MANAGER', 2, true, 950, 4, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', NOW(), NOW()),
(3, 'Đỗ Minh Tuấn', 'tuan.do@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0901234567', 'MANAGER', 4, true, 870, 4, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', NOW(), NOW()),
(4, 'Phạm Hồng Anh', 'anh.pham@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0934567890', 'MEMBER', 1, true, 540, 3, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NOW(), NOW()),
(5, 'Lê Gia Huy', 'huy.le@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0978901234', 'MEMBER', 1, true, 320, 2, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', NOW(), NOW()),
(6, 'Vũ Quỳnh Anh', 'quynhanh.vu@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0967890123', 'MEMBER', 2, true, 620, 3, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', NOW(), NOW()),
(7, 'Bùi Thế Anh', 'theanh.bui@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0956789012', 'MEMBER', 2, true, 150, 1, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', NOW(), NOW()),
(8, 'Hoàng Thu Trang', 'trang.hoang@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0945678901', 'MEMBER', 4, true, 280, 2, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', NOW(), NOW()),
(9, 'Đặng Quốc Huy', 'quochuy.dang@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0923456789', 'MEMBER', NULL, true, 0, 1, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', NOW(), NOW());

INSERT IGNORE INTO users (id, full_name, email, password_hash, phone, role, department_id, is_active, xp, level, avatar_url, created_at, updated_at) VALUES
(10, 'Nguyễn Minh Quân', 'quan.nguyen@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0912111222', 'MEMBER', 1, true, 450, 3, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', NOW(), NOW()),
(11, 'Lê Thị Thu Hà', 'ha.le@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0912333444', 'MEMBER', 1, true, 380, 2, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', NOW(), NOW()),
(12, 'Phạm Quốc Bảo', 'bao.pham@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0912555666', 'MEMBER', 1, true, 210, 1, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', NOW(), NOW()),
(13, 'Trần Minh Hoàng', 'hoang.tran@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0912777888', 'MEMBER', 1, true, 190, 1, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', NOW(), NOW()),
(14, 'Vũ Tiến Đạt', 'dat.vu@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0912999000', 'MEMBER', 1, true, 120, 1, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', NOW(), NOW()),
(15, 'Lâm Thùy Chi', 'chi.lam@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0922111222', 'MEMBER', 2, true, 580, 3, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', NOW(), NOW()),
(16, 'Đỗ Tấn Phát', 'phat.do@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0922333444', 'MEMBER', 2, true, 410, 2, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', NOW(), NOW()),
(17, 'Hoàng Mai Hoa', 'hoa.hoang@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0922555666', 'MEMBER', 2, true, 300, 2, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NOW(), NOW()),
(18, 'Phùng Gia Bảo', 'giabao.phung@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0922777888', 'MEMBER', 2, true, 220, 1, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', NOW(), NOW()),
(19, 'Trịnh Khánh Linh', 'linh.trinh@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0922999000', 'MEMBER', 2, true, 180, 1, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', NOW(), NOW()),
(20, 'Bùi Hữu Phước', 'phuoc.bui@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0933111222', 'MEMBER', 3, true, 390, 2, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', NOW(), NOW()),
(21, 'Ngô Bá Khải', 'khai.ngo@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0933333444', 'MEMBER', 3, true, 290, 2, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', NOW(), NOW()),
(22, 'Đặng Thảo Vy', 'vy.dang@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0933555666', 'MEMBER', 3, true, 250, 2, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', NOW(), NOW()),
(23, 'Vương Gia Kiệt', 'kiet.vuong@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0933777888', 'MEMBER', 3, true, 140, 1, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', NOW(), NOW()),
(24, 'Lý Hoài An', 'an.ly@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0933999000', 'MEMBER', 3, true, 90, 1, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', NOW(), NOW()),
(25, 'Dương Đức Thịnh', 'thinh.duong@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0944111222', 'MEMBER', 4, true, 480, 3, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', NOW(), NOW()),
(26, 'Phan Văn Hùng', 'hung.phan@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0944333444', 'MEMBER', 4, true, 310, 2, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', NOW(), NOW()),
(27, 'Kiều Minh Anh', 'minhanh.kieu@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0944555666', 'MEMBER', 4, true, 260, 2, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', NOW(), NOW()),
(28, 'Vũ Thành Long', 'long.vu@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0944777888', 'MEMBER', 4, true, 190, 1, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', NOW(), NOW()),
(29, 'Nguyễn Khánh Huyền', 'huyen.nguyen@club.com', '$2a$10$yJRmMmVIpeLgo/KNaTztluS95R0wDKnyPYiSzctRcsrggOpWF73oy', '0944999000', 'MEMBER', 4, true, 110, 1, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', NOW(), NOW());

-- Gán manager cho department
UPDATE departments SET manager_id = 1 WHERE id = 1;
UPDATE departments SET manager_id = 2 WHERE id = 2;
UPDATE departments SET manager_id = 3 WHERE id = 4;

-- Teams
INSERT IGNORE INTO teams (id, name, description, department_id, leader_id, avatar_color, is_active, created_at) VALUES
(1, 'Đội Popping A', 'Đội tập trung phát triển kỹ năng nhảy Popping đỉnh cao', 1, 4, '#6366f1', true, NOW()),
(2, 'Đội Breaking B', 'Đội rèn luyện sức bền, nhào lộn Breaking', 1, 5, '#8b5cf6', true, NOW()),
(3, 'Đội Media', 'Đội chụp ảnh, thiết kế, sản xuất truyền thông', 2, 6, '#38bdf8', true, NOW()),
(4, 'Đội Logistics', 'Đội điều phối trang thiết bị, nước uống, hậu cần', 4, 8, '#34d399', true, NOW());

-- Team Members
INSERT IGNORE INTO team_members (id, team_id, user_id, joined_at) VALUES
(1, 1, 4, NOW()),
(2, 1, 1, NOW()),
(3, 2, 5, NOW()),
(4, 3, 6, NOW()),
(5, 3, 7, NOW()),
(6, 4, 8, NOW());

INSERT IGNORE INTO team_members (id, team_id, user_id, joined_at) VALUES
(7, 1, 10, NOW()),
(8, 1, 11, NOW()),
(9, 2, 12, NOW()),
(10, 2, 13, NOW()),
(11, 2, 14, NOW()),
(12, 3, 15, NOW()),
(13, 3, 16, NOW()),
(14, 3, 17, NOW()),
(15, 3, 18, NOW()),
(16, 3, 19, NOW()),
(17, 4, 25, NOW()),
(18, 4, 26, NOW()),
(19, 4, 27, NOW()),
(20, 4, 28, NOW()),
(21, 4, 29, NOW());

-- Events
INSERT IGNORE INTO events (id, title, description, location, status, start_time, end_time, department_id, created_by, created_at, updated_at) VALUES
(1, 'Festival Nghệ thuật Mùa hè 2026', 'Sự kiện nghệ thuật lớn nhất trong năm với sự tham gia của tất cả các ban.', 'Sân khấu chính trường Đại học', 'APPROVED', '2026-05-30 19:00:00', '2026-05-30 22:00:00', 1, 1, NOW(), NOW()),
(2, 'Giao lưu câu lạc bộ Vũ đạo bạn', 'Đêm diễn giao lưu giao hữu kỹ năng nhảy và giao lưu học hỏi.', 'Hội trường B2', 'PLANNING', '2026-06-05 18:00:00', '2026-06-05 21:00:00', 1, 1, NOW(), NOW()),
(3, 'Workshop Choreography cơ bản', 'Hướng dẫn kỹ thuật cơ bản cho thành viên mới và định hình phong cách.', 'Phòng gương Tầng 3', 'COMPLETED', '2026-05-20 09:00:00', '2026-05-20 11:00:00', 1, 1, NOW(), NOW());

-- Event Sessions
INSERT IGNORE INTO event_sessions (id, title, session_date, start_time, end_time, location, type, event_id, created_at) VALUES
(11, 'Ráp đội hình sân khấu', '2026-05-29', '14:00:00', '16:00:00', 'Sân khấu chính', 'REHEARSAL', 1, NOW()),
(12, 'Biểu diễn chính thức', '2026-05-30', '19:00:00', '21:30:00', 'Sân khấu chính', 'PERFORMANCE', 1, NOW()),
(21, 'Tập ráp bài giao lưu', '2026-06-04', '18:00:00', '20:00:00', 'Hội trường B2', 'PRACTICE', 2, NOW()),
(22, 'Tập nâng cao Popping', '2026-06-18', '19:30:00', '21:30:00', 'Phòng gương Tầng 3', 'PRACTICE', 2, NOW()),
(31, 'Luyện tập giãn cơ và nhảy cơ bản', '2026-05-20', '09:00:00', '11:00:00', 'Phòng gương Tầng 3', 'PRACTICE', 3, NOW()),
(41, 'Biên đạo bài diễn mới', '2026-07-08', '19:00:00', '21:00:00', 'Hội trường B2', 'PRACTICE', 2, NOW()),
(42, 'Họp kỹ thuật nội bộ', '2026-07-22', '08:30:00', '10:00:00', 'Phòng họp A', 'PRACTICE', 2, NOW());

-- Attendances
INSERT IGNORE INTO attendances (id, session_id, user_id, check_in_time, status, note, created_at) VALUES
(1, 31, 4, '2026-05-20 08:55:00', 'PRESENT', 'Đúng giờ', NOW()),
(2, 31, 5, '2026-05-20 09:05:00', 'LATE', 'Trùng lịch học nhẹ', NOW()),
(3, 31, 6, '2026-05-20 08:58:00', 'PRESENT', 'Đúng giờ', NOW()),
(4, 11, 4, '2026-05-29 13:50:00', 'PRESENT', 'Đầy đủ', NOW()),
(5, 11, 5, '2026-05-29 13:55:00', 'PRESENT', 'Đúng giờ', NOW()),
(6, 11, 6, '2026-05-29 14:02:00', 'LATE', 'Đi học về muộn', NOW()),
(7, 12, 4, '2026-05-30 18:45:00', 'PRESENT', 'Đầy đủ', NOW()),
(8, 12, 5, '2026-05-30 18:50:00', 'PRESENT', 'Đúng giờ', NOW()),
(9, 12, 6, '2026-05-30 18:48:00', 'PRESENT', 'Đầy đủ', NOW()),
(10, 21, 4, '2026-06-04 17:55:00', 'PRESENT', 'Đúng giờ', NOW()),
(11, 21, 5, '2026-06-04 18:02:00', 'PRESENT', 'Đi làm về thẳng phòng tập', NOW()),
(12, 21, 6, '2026-06-04 18:00:00', 'PRESENT', 'Đúng giờ', NOW()),
(13, 22, 4, '2026-06-18 19:25:00', 'PRESENT', 'Đúng giờ', NOW()),
(14, 22, 5, '2026-06-18 19:30:00', 'PRESENT', 'Đúng giờ', NOW()),
(15, 22, 6, '2026-06-18 19:28:00', 'PRESENT', 'Đúng giờ', NOW()),
(16, 41, 4, '2026-07-08 18:50:00', 'PRESENT', 'Đúng giờ', NOW()),
(17, 41, 5, '2026-07-08 18:55:00', 'PRESENT', 'Đúng giờ', NOW()),
(18, 41, 6, '2026-07-08 19:00:00', 'PRESENT', 'Đúng giờ', NOW()),
(19, 42, 4, '2026-07-22 08:25:00', 'PRESENT', 'Đúng giờ', NOW()),
(20, 42, 5, '2026-07-22 08:30:00', 'PRESENT', 'Đúng giờ', NOW()),
(21, 42, 6, '2026-07-22 08:28:00', 'PRESENT', 'Đúng giờ', NOW());

-- Tasks
INSERT IGNORE INTO tasks (id, title, description, deadline, priority, status, event_id, department_id, assigned_by, created_at, updated_at) VALUES
(101, 'Biên đạo bài nhảy Popping mới', 'Biên đạo phần điệp khúc cho đội Popping A bài nhảy Festival.', '2026-05-30 23:59:59', 'HIGH', 'TODO', 1, 1, 2, NOW(), NOW()),
(102, 'Thiết kế poster Festival', 'Thiết kế ấn phẩm truyền thông chính thức, đăng bài lên fanpage.', '2026-05-29 23:59:59', 'HIGH', 'IN_PROGRESS', 1, 2, 2, NOW(), NOW()),
(103, 'Tập nhào lộn cơ bản Breaking', 'Ráp đội hình Breaking B học các động tác nhào lộn cơ bản.', '2026-05-28 23:59:59', 'MEDIUM', 'REVIEW', 1, 1, 2, NOW(), NOW()),
(104, 'Chuẩn bị nước và ăn nhẹ', 'Chuẩn bị đồ uống phục vụ buổi tập lớn.', '2026-05-28 23:59:59', 'LOW', 'DONE', 1, 4, 3, NOW(), NOW()),
(105, 'Chụp ảnh buổi giao lưu', 'Ghi lại các khoảnh khắc giao lưu làm tư liệu truyền thông.', '2026-06-05 23:59:59', 'MEDIUM', 'TODO', 2, 2, 2, NOW(), NOW()),
(106, 'Thiết kế kịch bản âm thanh', 'Chuẩn bị danh sách nhạc nền và thiết bị loa đài cho Rehearsal.', '2026-05-29 18:00:00', 'MEDIUM', 'DONE', 1, 1, 1, NOW(), NOW()),
(107, 'Truyền thông sự kiện tuần', 'Đăng tải các nội dung truyền thông cho buổi giao lưu tiếp theo.', '2026-06-03 12:00:00', 'LOW', 'DONE', 2, 2, 2, NOW(), NOW()),
(108, 'Thuê trang phục biểu diễn', 'Liên hệ nhà cung cấp để chuẩn bị phục trang cho đội nhảy.', '2026-05-28 17:00:00', 'HIGH', 'DONE', 1, 4, 1, NOW(), NOW()),
(109, 'Tổng dọn dẹp phòng gương', 'Dọn dẹp và trả lại phòng gương sau buổi workshop.', '2026-05-21 11:30:00', 'LOW', 'DONE', 3, 1, 3, NOW(), NOW()),
(110, 'Kiểm kê đạo cụ', 'Thống kê số lượng mic và thiết bị âm thanh cầm tay.', '2026-06-10 18:00:00', 'MEDIUM', 'DONE', 2, 4, 3, NOW(), NOW()),
(111, 'Liên hệ tài trợ nước uống', 'Liên hệ đại diện hãng để xin tài trợ nước khoáng cho Festival.', '2026-05-28 17:00:00', 'MEDIUM', 'TODO', 1, 3, 1, NOW(), NOW()),
(112, 'Gửi thư mời câu lạc bộ bạn', 'Gửi thư mời các CLB vũ đạo trong trường đến giao lưu.', '2026-06-04 18:00:00', 'LOW', 'TODO', 2, 3, 1, NOW(), NOW()),
(113, 'Lập hồ sơ xin tài trợ hiện kim', 'Chuẩn bị hồ sơ dự án gửi các nhà tài trợ tiềm năng.', '2026-05-25 17:00:00', 'HIGH', 'IN_PROGRESS', 1, 3, 1, NOW(), NOW());

-- Force update departments for existing tasks (safe update)
UPDATE tasks SET department_id = 1 WHERE id IN (101, 103, 106, 109);
UPDATE tasks SET department_id = 2 WHERE id IN (102, 105, 107);
UPDATE tasks SET department_id = 4 WHERE id IN (104, 108, 110);
UPDATE tasks SET department_id = 3 WHERE id IN (111, 112, 113);

-- Task Assignees
INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES
(101, 4),
(102, 6),
(103, 5),
(104, 8),
(105, 7),
(106, 4),
(107, 6),
(108, 8),
(109, 5),
(110, 8),
(111, 20),
(112, 21),
(113, 22);

-- Schedules
INSERT IGNORE INTO schedules (id, title, scope_type, scope_id, week_start, week_end, status, created_by, created_at) VALUES
(1, 'Lịch tập Popping & Breaking', 'CLB', 1, '2026-05-25', '2026-05-31', 'PUBLISHED', 1, NOW());

-- Schedule Slots
INSERT IGNORE INTO schedule_slots (id, schedule_id, day_of_week, start_time, end_time, title, location, type, color, notes) VALUES
(1, 1, 2, '19:00:00', '21:00:00', 'Tập Popping', 'Phòng tập Tầng 2', 'PRACTICE', '#6366f1', 'Mang giầy đầy đủ'),
(2, 1, 1, '08:00:00', '09:00:00', 'Họp ban Chuyên môn', 'Phòng họp A', 'MEETING', '#f59e0b', 'Báo cáo kế hoạch tuần'),
(3, 1, 3, '19:00:00', '21:00:00', 'Tập Popping', 'Phòng tập Tầng 2', 'PRACTICE', '#6366f1', 'Ráp bài bridge'),
(4, 1, 4, '14:00:00', '16:00:00', 'Tổng duyệt Festival', 'Sân khấu chính', 'PERFORMANCE', '#f43f5e', 'Trang phục biểu diễn');

-- Chat Rooms
INSERT IGNORE INTO chat_rooms (id, name, type, scope_id, created_by, created_at) VALUES
(1, 'Đội Popping A', 'TEAM', 1, 1, NOW()),
(2, 'Ban Chuyên môn', 'DEPARTMENT', 1, 1, NOW()),
(3, 'Trần Thanh Sơn (Direct)', 'DIRECT', NULL, 1, NOW()),
(4, 'Vũ Quỳnh Anh (Direct)', 'DIRECT', NULL, 1, NOW());

-- Chat Room Members
INSERT IGNORE INTO chat_room_members (id, room_id, user_id, joined_at) VALUES
(1, 1, 4, NOW()),
(2, 1, 1, NOW()),
(3, 1, 5, NOW()),
(4, 2, 1, NOW()),
(5, 2, 4, NOW()),
(6, 2, 5, NOW()),
(7, 3, 1, NOW()),
(8, 3, 2, NOW()),
(9, 4, 1, NOW()),
(10, 4, 6, NOW());

INSERT IGNORE INTO chat_room_members (id, room_id, user_id, joined_at) VALUES
(11, 2, 10, NOW()),
(12, 2, 11, NOW()),
(13, 2, 12, NOW()),
(14, 2, 13, NOW()),
(15, 2, 14, NOW()),
(16, 1, 10, NOW()),
(17, 1, 11, NOW());

-- Chat Messages
INSERT IGNORE INTO chat_messages (id, room_id, sender_id, content, type, is_deleted, created_at) VALUES
(1, 1, 4, 'Tập 19h tối nay nhé mọi người!', 'TEXT', false, '2026-05-28 18:00:00'),
(2, 1, 5, 'Ok mình đến đúng giờ 👍', 'TEXT', false, '2026-05-28 18:02:00'),
(3, 1, 4, 'Nhớ mang giày tập nha!', 'TEXT', false, '2026-05-28 18:05:00'),
(4, 1, 1, 'Chị sẽ qua xem hai đứa tập nhé.', 'TEXT', false, '2026-05-28 18:10:00'),
(5, 1, 4, 'Dạ vâng ạ! Warm-up bài cũ xong mình học bridge mới chị ơi', 'TEXT', false, '2026-05-28 18:12:00'),
(6, 2, 1, 'Nhắc mọi người nộp tự đánh giá KPI tháng 5 nhé', 'TEXT', false, '2026-05-28 09:00:00'),
(7, 2, 4, 'Dạ vâng em vừa nộp xong rồi chị.', 'TEXT', false, '2026-05-28 09:05:00'),
(8, 2, 1, 'OK em', 'TEXT', false, '2026-05-28 09:10:00'),
(9, 3, 2, 'Oke mình hiểu rồi, cảm ơn', 'TEXT', false, '2026-05-28 17:00:00'),
(10, 4, 6, 'Cảm ơn bạn nhiều! 🙏', 'TEXT', false, '2026-05-28 16:00:00');

-- Self Evaluations
INSERT IGNORE INTO self_evaluations (id, user_id, eval_month, content, achievements, improvements, status, submitted_at, created_at, updated_at) VALUES
(1, 4, '2026-05', 'Em đã hoàn thành biên tập 2 bài nhảy mới cho Đội Popping A và hỗ trợ ban hậu cần chuẩn bị đạo cụ biểu diễn.', 'Thuộc bài nhảy rất nhanh, luôn đến sớm 15 phút để chuẩn bị phòng tập.', 'Cần luyện thêm khả năng giao tiếp và truyền đạt động tác cho các bạn mới.', 'REVIEWED', '2026-05-28 09:00:00', NOW(), NOW()),
(2, 5, '2026-05', 'Đã tích cực tham gia ráp đội hình Breaking B và đi tập đầy đủ các ngày trong tuần.', 'Học được các skill nhào lộn mới rất khó.', 'Có một số hôm đi muộn do trùng lịch học trên trường.', 'REVIEWED', '2026-05-28 09:02:00', NOW(), NOW()),
(3, 6, '2026-05', 'Chụp ảnh sự kiện giao lưu và edit video recap đăng tải TikTok.', 'Video recap đạt mốc 2.5k view chỉ sau 1 ngày.', 'Cần nâng cao kỹ năng xử lý ánh sáng khi chụp ảnh buổi tối.', 'REVIEWED', '2026-05-28 09:05:00', NOW(), NOW()),
(4, 10, '2026-06', 'Em đã tham gia đầy đủ các buổi tập của đội Popping A, thuộc bài nhảy chính và hỗ trợ hướng dẫn động tác cho thành viên mới.', 'Thuộc bài nhanh, đi tập đúng giờ 100%, tích cực hỗ trợ các bạn.', 'Cần tự tin hơn khi đứng trước gương nhảy solo.', 'REVIEWED', '2026-06-20 09:00:00', NOW(), NOW()),
(5, 11, '2026-06', 'Hoàn thành tốt các buổi tập và tham gia biểu diễn giao lưu.', 'Nhiệt tình tham gia hoạt động chung của Ban.', 'Đôi lúc còn tập trung chưa cao trong các buổi tập dài.', 'SUBMITTED', '2026-06-20 10:30:00', NOW(), NOW()),
(6, 12, '2026-06', 'Bản nháp tự đánh giá của em về hoạt động trong ban Chuyên môn.', 'Đã đi tập Breaking đều đặn.', 'Cần cải thiện thể lực.', 'DRAFT', NULL, NOW(), NOW()),
(7, 15, '2026-06', 'Đã chụp ảnh tư liệu cho 3 buổi tập của CLB và dựng 1 video recap ngắn đăng Tiktok.', 'Video đạt tương tác tốt, hoàn thành đúng deadline.', 'Cần nâng cao kỹ năng chỉnh màu ảnh sự kiện.', 'REVIEWED', '2026-06-21 14:00:00', NOW(), NOW()),
(8, 16, '2026-06', 'Viết bài truyền thông cho buổi giao lưu CLB và tương tác trên Fanpage.', 'Bài viết đạt lượng tiếp cận cao.', 'Cần linh hoạt hơn trong khâu chọn chủ đề.', 'SUBMITTED', '2026-06-21 15:00:00', NOW(), NOW()),
(9, 20, '2026-06', 'Liên hệ làm việc với 3 nhà tài trợ tiềm năng cho sự kiện sắp tới và nhận được phản hồi tốt.', 'Đàm phán được hợp đồng tài trợ trị giá 5 triệu đồng.', 'Cần chuẩn bị slide proposal chỉn chu hơn.', 'REVIEWED', '2026-06-20 16:00:00', NOW(), NOW()),
(10, 25, '2026-06', 'Phụ trách vận chuyển loa đài và chuẩn bị đồ uống cho tất cả các buổi tập lớn của CLB.', 'Nhiệt tình, chu đáo, không ngại khó ngại khổ.', 'Cần quản lý danh sách thiết bị mượn kỹ càng hơn để tránh thất lạc.', 'REVIEWED', '2026-06-20 17:00:00', NOW(), NOW()),
(11, 26, '2026-06', 'Hỗ trợ chuẩn bị trang phục biểu diễn và sắp xếp hội trường.', 'Đến sớm dọn dẹp phòng tập và chuẩn bị đầy đủ dụng cụ.', 'Một số buổi đi muộn do vướng lịch thi học kỳ.', 'SUBMITTED', '2026-06-20 18:00:00', NOW(), NOW()),
(12, 27, '2026-06', 'Bản nháp đánh giá hoạt động hậu cần tháng 6.', 'Đã chuẩn bị đồ uống đầy đủ.', 'Không có.', 'DRAFT', NULL, NOW(), NOW());

-- Manager Evaluations
INSERT IGNORE INTO manager_evaluations (id, self_evaluation_id, manager_id, task_score, attendance_score, attitude_score, final_score, grade, comment, evaluated_at) VALUES
(1, 1, 2, 90, 100, 95, 95, 'EXCELLENT', 'Em hoạt động xuất sắc, dẫn dắt đội Popping A tiến bộ vượt bậc.', NOW()),
(2, 2, 2, 70, 75, 80, 75, 'GOOD', 'Cố gắng đi tập đúng giờ hơn nhé em.', NOW()),
(3, 3, 2, 85, 90, 90, 88, 'GOOD', 'Hình ảnh và video truyền thông chất lượng tốt, tiếp tục phát huy.', NOW()),
(4, 4, 1, 95, 90, 95, 93, 'EXCELLENT', 'Em hoạt động rất tích cực, tiến bộ vượt bậc và hỗ trợ ban rất nhiều.', NOW()),
(5, 7, 2, 85, 80, 90, 85, 'GOOD', 'Hỗ trợ dựng video tốt, đi họp tương đối đầy đủ. Phát huy nhé.', NOW()),
(6, 9, 1, 90, 95, 90, 91, 'EXCELLENT', 'Hoàn thành xuất sắc nhiệm vụ đối ngoại, mang lại tài trợ cho CLB.', NOW()),
(7, 10, 3, 80, 90, 85, 84, 'GOOD', 'Chuẩn bị đạo cụ đầy đủ, trách nhiệm cao trong công việc.', NOW());

-- ===================================
-- ADVANCED MODULES SEED DATA (Safe for re-run)
-- ===================================

-- 1. Recruitment Applications
INSERT IGNORE INTO recruitment_applications (id, full_name, email, phone, introduction, cv_url, department_id, status, score, comments, created_at, updated_at) VALUES
(1, 'Lê Văn Nam', 'nam.le@example.com', '0911223344', 'Em muốn tham gia ban chuyên môn để rèn luyện vũ đạo.', 'https://drive.google.com/file/d/cv_nam_le', 1, 'SUBMITTED', NULL, NULL, NOW(), NOW()),
(2, 'Trần Minh Thu', 'thu.tran@example.com', '0988776655', 'Em thích làm truyền thông, chụp ảnh và dựng video ngắn.', 'https://drive.google.com/file/d/cv_thu_tran', 2, 'INTERVIEW_SCHEDULED', 85, 'Ứng viên năng nổ, có portfolio tốt.', NOW(), NOW()),
(3, 'Phan Hoàng Nam', 'nam.phan@example.com', '0966554433', 'Em có kinh nghiệm đối ngoại, giao tiếp tiếng Anh tốt.', 'https://drive.google.com/file/d/cv_nam_phan', 3, 'ACCEPTED', 90, 'Kỹ năng giao tiếp xuất sắc, rất phù hợp.', NOW(), NOW());

-- 2. Inventory Items
INSERT IGNORE INTO inventory_items (id, name, description, quantity, available_quantity, item_condition, location, image_url, created_at) VALUES
(1, 'Loa kéo Sony MHC-V43D', 'Loa kéo công suất lớn chuyên dùng tập ngoài trời', 2, 2, 'GOOD', 'Kho tủ A1', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300', NOW()),
(2, 'Trang phục biểu diễn Popping', 'Trang phục vest trắng đen cho nhóm nhảy Popping', 15, 10, 'GOOD', 'Tủ đồ B2', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=300', NOW()),
(3, 'Đèn LED cầm tay RGB', 'Đèn LED quay video đổi màu', 4, 3, 'GOOD', 'Hộp kỹ thuật C1', 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=300', NOW()),
(4, 'Mic không dây Shure', 'Bộ 2 micro không dây phục vụ họp và workshop', 2, 1, 'REPAIRING', 'Kho tủ A2', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300', NOW());

-- 3. Borrow Requests
INSERT IGNORE INTO borrow_requests (id, item_id, user_id, quantity, borrow_date, expected_return_date, actual_return_date, status, notes, reject_reason, created_at) VALUES
(1, 2, 4, 5, '2026-06-20', '2026-06-22', NULL, 'BORROWED', 'Mượn trang phục cho đội Popping A ráp bài', NULL, NOW()),
(2, 3, 6, 1, '2026-06-21', '2026-06-21', '2026-06-21', 'RETURNED', 'Mượn quay video Tiktok ngoài trời', NULL, NOW()),
(3, 1, 5, 1, '2026-06-25', '2026-06-26', NULL, 'PENDING', 'Mượn tập nhảy Breaking cuối tuần', NULL, NOW());

-- 4. Club Fund Transactions
INSERT IGNORE INTO club_fund_transactions (id, title, amount, type, category, receipt_url, recorded_by, created_at) VALUES
(1, 'Đóng quỹ thành viên tháng 5', 500000, 'INCOME', 'MEMBERSHIP_FEE', NULL, 1, NOW()),
(2, 'Nhận tài trợ từ Trung tâm Anh ngữ', 3000000, 'INCOME', 'SPONSOR', 'https://drive.google.com/file/d/sponsor_receipt', 1, NOW()),
(3, 'Mua nước uống cho buổi tập lớn', -150000, 'EXPENSE', 'DRINKS', NULL, 2, NOW()),
(4, 'Thuê trang phục diễn Festival', -1200000, 'EXPENSE', 'PROPS', 'https://drive.google.com/file/d/invoice_props', 1, NOW());

-- 5. Budget Requests
INSERT IGNORE INTO budget_requests (id, title, amount, description, status, reject_reason, requested_by, approved_by, event_id, created_at) VALUES
(1, 'Kinh phí in ấn vé và poster Festival', 800000, 'Kinh phí in ấn vé giấy lưu niệm và 5 băng rôn treo trường.', 'APPROVED', NULL, 2, 1, 1, NOW()),
(2, 'Chi phí thuê loa công suất lớn giao lưu', 500000, 'Mượn thêm 1 loa kéo siêu lớn từ đơn vị âm thanh.', 'PENDING', NULL, 2, NULL, 2, NOW());

-- 6. Shared Resource Items
INSERT IGNORE INTO resource_items (id, name, type, url, category, description, file_size, uploaded_by, created_at) VALUES
(1, 'Điều lệ và Quy chế CLB Vũ đạo', 'FILE', 'https://drive.google.com/file/d/bylaws_clb', 'BYLAWS', 'Văn bản quy định quyền hạn và trách nhiệm của thành viên.', 102400, 1, NOW()),
(2, 'Mẫu thiết kế logo và Slide thuyết trình', 'FILE', 'https://drive.google.com/file/d/logo_templates', 'DESIGN_ASSETS', 'Bộ nhận diện thương hiệu CLB bao gồm file AI, PNG và slide mẫu.', 5242880, 2, NOW()),
(3, 'Video hướng dẫn nhảy cơ bản Popping', 'LINK', 'https://youtube.com/watch?v=popping_basic', 'TRAINING_VIDEOS', 'Video bài tập giãn cơ và các động tác cơ bản từ biên đạo.', NULL, 1, NOW());

-- 7. Polls
INSERT IGNORE INTO polls (id, title, description, allow_multiple, is_closed, expires_at, created_by, created_at) VALUES
(1, 'Lựa chọn trang phục cho đêm diễn Festival?', 'Mọi người vote xem nên dùng Vest Đen hay Sơ mi Trắng nhé.', false, false, '2026-06-30 23:59:59', 1, NOW()),
(2, 'Lịch họp Ban chủ nhiệm tuần sau', 'Chọn ca họp phù hợp cho tất cả mọi người.', true, false, '2026-06-25 18:00:00', 1, NOW());

-- 8. Poll Options
INSERT IGNORE INTO poll_options (id, poll_id, option_text) VALUES
(1, 1, 'Vest đen sang trọng, lịch lãm'),
(2, 1, 'Sơ mi trắng phối cà vạt trẻ trung'),
(3, 2, 'Tối Thứ Hai (19:00 - 21:00)'),
(4, 2, 'Sáng Thứ Bảy (09:00 - 11:00)'),
(5, 2, 'Chiều Chủ Nhật (14:00 - 16:00)');

-- 9. Poll Votes
INSERT IGNORE INTO poll_votes (id, poll_id, option_id, user_id, created_at) VALUES
(1, 1, 1, 4, NOW()),
(2, 1, 1, 5, NOW()),
(3, 1, 2, 6, NOW()),
(4, 2, 3, 4, NOW()),
(5, 2, 4, 4, NOW()),
(6, 2, 4, 5, NOW());

-- 10. Event Tickets
INSERT IGNORE INTO event_tickets (id, event_id, full_name, email, phone, ticket_code, status, check_in_time, created_at) VALUES
(1, 1, 'Lê Minh Tuấn', 'tuan.le@example.com', '0981122334', 'TKT-FESTIVAL-001', 'CHECKED_IN', '2026-05-30 18:45:00', NOW()),
(2, 1, 'Nguyễn Thu Thủy', 'thuy.nguyen@example.com', '0972233445', 'TKT-FESTIVAL-002', 'REGISTERED', NULL, NOW()),
(3, 2, 'Phạm Văn Nam', 'nam.pham@example.com', '0963344556', 'TKT-GIAOLUU-001', 'REGISTERED', NULL, NOW());

-- ===================================
-- EXTRA EVENT, SESSION, SCHEDULE SEED DATA (JUNE - JULY 2026)
-- ===================================

-- 11. Extra Events for June - July 2026
INSERT IGNORE INTO events (id, title, description, location, status, start_time, end_time, department_id, created_by, created_at, updated_at) VALUES
(4, 'Teambuilding Hè CLB Vũ đạo 2026', 'Sự kiện dã ngoại và kết nối các thành viên trong câu lạc bộ tại bãi biển Mỹ Khê.', 'Bãi biển Mỹ Khê', 'APPROVED', '2026-07-04 07:00:00', '2026-07-05 18:00:00', 3, 1, NOW(), NOW()),
(5, 'Đại nhạc hội Chào tân sinh viên 2026', 'Đêm biểu diễn nhạc hội chào đón khóa tân sinh viên mới của trường.', 'Sân vận động trường', 'APPROVED', '2026-07-15 19:00:00', '2026-07-15 22:30:00', 1, 1, NOW(), NOW()),
(6, 'Giải đấu Vũ đạo Đối kháng Battle CLB 2026', 'Giải đấu nhảy đối kháng 1vs1 thường niên mở rộng giữa các ban ngành và khách mời.', 'Nhà thi đấu đa năng', 'APPROVED', '2026-07-28 18:00:00', '2026-07-30 22:00:00', 1, 1, NOW(), NOW());

-- 12. Extra Event Sessions
INSERT IGNORE INTO event_sessions (id, title, session_date, start_time, end_time, location, type, event_id, created_at) VALUES
(41, 'Tập trung di chuyển dã ngoại', '2026-07-04', '06:30:00', '07:30:00', 'Cổng trường Đại học', 'PRACTICE', 4, NOW()),
(42, 'Trò chơi Teambuilding bãi biển', '2026-07-04', '08:00:00', '11:30:00', 'Bãi biển Mỹ Khê', 'PERFORMANCE', 4, NOW()),
(43, 'Gala Dinner & Giao lưu lửa trại', '2026-07-04', '18:30:00', '21:30:00', 'Khu cắm trại Mỹ Khê', 'PERFORMANCE', 4, NOW()),
(51, 'Tổng duyệt Âm thanh & Ánh sáng Chào tân', '2026-07-15', '14:00:00', '17:00:00', 'Sân vận động trường', 'REHEARSAL', 5, NOW()),
(52, 'Biểu diễn chính thức Nhạc hội Chào tân', '2026-07-15', '19:00:00', '22:30:00', 'Sân vận động trường', 'PERFORMANCE', 5, NOW()),
(61, 'Thi đấu vòng loại đối kháng 1vs1', '2026-07-28', '18:00:00', '22:00:00', 'Nhà thi đấu đa năng', 'PERFORMANCE', 6, NOW()),
(62, 'Chung kết & Lễ trao giải Battle CLB', '2026-07-30', '18:00:00', '22:00:00', 'Nhà thi đấu đa năng', 'PERFORMANCE', 6, NOW());

-- 13. Extra Schedules
INSERT IGNORE INTO schedules (id, title, scope_type, scope_id, week_start, week_end, status, created_by, created_at) VALUES
(2, 'Lịch hoạt động tuần 25 (Hè)', 'CLB', 1, '2026-06-15', '2026-06-21', 'PUBLISHED', 1, NOW()),
(3, 'Lịch tập luyện tuần 26', 'CLB', 1, '2026-06-22', '2026-06-28', 'PUBLISHED', 1, NOW()),
(4, 'Lịch hoạt động tuần 27 (Dã ngoại)', 'CLB', 1, '2026-06-29', '2026-07-05', 'PUBLISHED', 1, NOW()),
(5, 'Lịch tập luyện tuần 28 (Chuẩn bị nhạc hội)', 'CLB', 1, '2026-07-06', '2026-07-12', 'PUBLISHED', 1, NOW()),
(6, 'Lịch tổng duyệt tuần 29 (Chào tân)', 'CLB', 1, '2026-07-13', '2026-07-19', 'PUBLISHED', 1, NOW()),
(7, 'Lịch tập luyện tuần 30 (Giải đấu Battle)', 'CLB', 1, '2026-07-20', '2026-07-26', 'PUBLISHED', 1, NOW()),
(8, 'Lịch hoạt động tuần 31 (Chung kết Battle)', 'CLB', 1, '2026-07-27', '2026-08-02', 'PUBLISHED', 1, NOW());

-- 14. Extra Schedule Slots
-- Week of June 15 - June 21
INSERT IGNORE INTO schedule_slots (id, schedule_id, day_of_week, start_time, end_time, title, location, type, color, notes) VALUES
(10, 2, 1, '19:00:00', '21:00:00', 'Tập Popping Cơ bản', 'Phòng tập Tầng 2', 'PRACTICE', '#6366f1', 'Tập bài cũ'),
(11, 2, 2, '19:00:00', '21:00:00', 'Tập Breaking B', 'Phòng tập Tầng 3', 'PRACTICE', '#8b5cf6', 'Luyện kỹ thuật freeze'),
(12, 2, 3, '09:00:00', '11:00:00', 'Họp BCN Câu lạc bộ', 'Phòng họp A', 'MEETING', '#f59e0b', 'Báo cáo tài chính tháng 6'),
(13, 2, 5, '18:30:00', '21:30:00', 'Lớp Nhảy Hiện Đại', 'Sân thể chất', 'PRACTICE', '#6366f1', 'Mang nước uống đầy đủ'),
(14, 2, 6, '15:00:00', '17:00:00', 'Ráp đội hình Popping A', 'Sân khấu chính', 'PRACTICE', '#6366f1', 'Trang phục tự do');

-- Week of June 22 - June 28
INSERT IGNORE INTO schedule_slots (id, schedule_id, day_of_week, start_time, end_time, title, location, type, color, notes) VALUES
(20, 3, 1, '19:00:00', '21:00:00', 'Tập Popping Nâng cao', 'Phòng tập Tầng 2', 'PRACTICE', '#6366f1', 'Học tổ hợp mới'),
(21, 3, 2, '19:00:00', '21:00:00', 'Tập Breaking Powermove', 'Phòng tập Tầng 3', 'PRACTICE', '#8b5cf6', 'Luyện thể lực'),
(22, 3, 3, '09:00:00', '11:00:00', 'Họp Kế hoạch dã ngoại', 'Phòng họp B', 'MEETING', '#f59e0b', 'Chuẩn bị teambuilding'),
(23, 3, 5, '18:30:00', '21:30:00', 'Giao lưu nhảy tự do', 'Sảnh nhà A', 'OTHER', '#10b981', 'Mở rộng giao lưu bên ngoài'),
(24, 3, 6, '15:00:00', '17:00:00', 'Tập Choreography nhóm', 'Sân khấu chính', 'PRACTICE', '#6366f1', 'Tập bài nhóm chính');

-- Week of June 29 - July 5
INSERT IGNORE INTO schedule_slots (id, schedule_id, day_of_week, start_time, end_time, title, location, type, color, notes) VALUES
(30, 4, 1, '19:00:00', '21:00:00', 'Tập Popping A', 'Phòng tập Tầng 2', 'PRACTICE', '#6366f1', 'Ráp đội hình'),
(31, 4, 2, '19:00:00', '21:00:00', 'Tập Breaking B', 'Phòng tập Tầng 3', 'PRACTICE', '#8b5cf6', 'Luyện footwork'),
(32, 4, 3, '09:00:00', '11:00:00', 'Họp chốt danh sách dã ngoại', 'Phòng họp A', 'MEETING', '#f59e0b', 'Chốt xe và nước uống'),
(33, 4, 6, '07:00:00', '17:00:00', 'Teambuilding ngày 1', 'Bãi biển Mỹ Khê', 'OTHER', '#10b981', 'Tập trung tại cổng trường lúc 06:30'),
(34, 4, 7, '08:00:00', '16:00:00', 'Teambuilding ngày 2', 'Khu du lịch sinh thái', 'OTHER', '#10b981', 'Chơi trò chơi lớn và trao giải');

-- Week of July 6 - July 12
INSERT IGNORE INTO schedule_slots (id, schedule_id, day_of_week, start_time, end_time, title, location, type, color, notes) VALUES
(40, 5, 1, '19:00:00', '21:00:00', 'Tập bài diễn Chào tân', 'Phòng tập Tầng 2', 'PRACTICE', '#6366f1', 'Ráp bài nhạc chính'),
(41, 5, 2, '19:00:00', '21:00:00', 'Tập nhào lộn Breaking', 'Phòng tập Tầng 3', 'PRACTICE', '#8b5cf6', 'Ghép bài nhảy với Popping'),
(42, 5, 3, '09:00:00', '11:00:00', 'Họp phân công nhân sự Nhạc hội', 'Phòng họp A', 'MEETING', '#f59e0b', 'Phân công kỹ thuật, hậu cần'),
(43, 5, 5, '18:30:00', '21:30:00', 'Luyện tập thể lực chung', 'Sân thể chất', 'PRACTICE', '#6366f1', 'Luyện bài sức bền'),
(44, 5, 6, '15:00:00', '18:00:00', 'Sơ duyệt chương trình', 'Hội trường B2', 'PERFORMANCE', '#f43f5e', 'Duyệt bài nhảy của các đội');

-- Week of July 13 - July 19
INSERT IGNORE INTO schedule_slots (id, schedule_id, day_of_week, start_time, end_time, title, location, type, color, notes) VALUES
(50, 6, 1, '19:00:00', '21:00:00', 'Tổng duyệt 1 Popping A', 'Hội trường B2', 'PRACTICE', '#6366f1', 'Ráp nhạc khớp sân khấu'),
(51, 6, 2, '19:00:00', '21:00:00', 'Tổng duyệt 1 Breaking B', 'Hội trường B2', 'PRACTICE', '#8b5cf6', 'Khớp tuyến đi hình'),
(52, 6, 3, '09:00:00', '11:00:00', 'Họp kỹ thuật âm thanh ánh sáng', 'Phòng họp A', 'MEETING', '#f59e0b', 'Làm việc với đội kỹ thuật trường'),
(53, 6, 4, '14:00:00', '18:00:00', 'Tổng duyệt Sân khấu Nhạc hội', 'Sân vận động trường', 'PERFORMANCE', '#f43f5e', 'Trang phục diễn đầy đủ'),
(54, 6, 5, '19:00:00', '22:30:00', 'Đêm diễn Chào tân sinh viên', 'Sân vận động trường', 'PERFORMANCE', '#f43f5e', 'Đêm diễn chính thức');

-- Week of July 20 - July 26
INSERT IGNORE INTO schedule_slots (id, schedule_id, day_of_week, start_time, end_time, title, location, type, color, notes) VALUES
(60, 7, 1, '19:00:00', '21:00:00', 'Luyện nhảy đối kháng 1vs1', 'Phòng tập Tầng 2', 'PRACTICE', '#6366f1', 'Rèn luyện kỹ năng battle freestyle'),
(61, 7, 2, '19:00:00', '21:00:00', 'Luyện kỹ thuật cypher Breaking', 'Phòng tập Tầng 3', 'PRACTICE', '#8b5cf6', 'Cypher giao lưu tự do'),
(62, 7, 3, '09:00:00', '11:00:00', 'Họp thống nhất thể lệ Giải Battle', 'Phòng họp A', 'MEETING', '#f59e0b', 'Chốt ban giám khảo và giải thưởng'),
(63, 7, 5, '18:30:00', '21:30:00', 'Workshop kỹ năng Freestyle', 'Sảnh nhà A', 'OTHER', '#10b981', 'Trưởng ban chuyên môn chia sẻ kinh nghiệm');

-- Week of July 27 - August 2
INSERT IGNORE INTO schedule_slots (id, schedule_id, day_of_week, start_time, end_time, title, location, type, color, notes) VALUES
(70, 8, 1, '19:00:00', '21:00:00', 'Tập trung chuẩn bị giải đấu', 'Nhà thi đấu đa năng', 'PRACTICE', '#6366f1', 'Sắp xếp thảm đấu và hệ thống loa'),
(71, 8, 2, '18:00:00', '22:00:00', 'Vòng Loại Giải Battle CLB', 'Nhà thi đấu đa năng', 'PERFORMANCE', '#f43f5e', 'Thi đấu vòng loại chọn top 8'),
(72, 8, 3, '09:00:00', '11:00:00', 'Họp đánh giá vòng loại', 'Phòng họp B', 'MEETING', '#f59e0b', 'Rút kinh nghiệm khâu tổ chức'),
(73, 8, 4, '18:00:00', '22:00:00', 'Chung kết Giải Đấu Battle CLB', 'Nhà thi đấu đa năng', 'PERFORMANCE', '#f43f5e', 'Thi đấu chung kết và trao giải thưởng');

-- 15. Extra Tasks for June - July 2026
INSERT IGNORE INTO tasks (id, title, description, deadline, priority, status, event_id, assigned_by, created_at, updated_at) VALUES
(201, 'Chuẩn bị thảm đấu và hệ thống loa Battle', 'Chuẩn bị lắp đặt thảm xốp và kết nối loa đài cho khu vực thi đấu.', '2026-07-27 17:00:00', 'HIGH', 'TODO', 6, 1, NOW(), NOW()),
(202, 'Thiết kế ấn phẩm truyền thông Chào tân', 'Thiết kế banner chính và khung ảnh đại diện cho thành viên CLB.', '2026-07-12 23:59:59', 'HIGH', 'IN_PROGRESS', 5, 2, NOW(), NOW()),
(203, 'Liên hệ thuê xe di chuyển teambuilding', 'Liên hệ nhà xe đặt 2 xe 45 chỗ đưa đón thành viên đi Mỹ Khê.', '2026-06-28 12:00:00', 'MEDIUM', 'TODO', 4, 3, NOW(), NOW());

-- 16. Extra Task Assignees
INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES
(201, 8),
(202, 6),
(203, 7);

-- 17. Seed Attendances for June 2026 (Sessions 21 and 22)
INSERT IGNORE INTO attendances (session_id, user_id, check_in_time, status, note, created_at) VALUES
(21, 1, '2026-06-04 17:55:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:55:00'),
(21, 2, '2026-06-04 17:58:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:58:00'),
(21, 3, '2026-06-04 18:02:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 18:02:00'),
(21, 4, '2026-06-04 17:50:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:50:00'),
(21, 5, '2026-06-04 17:54:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:54:00'),
(21, 6, '2026-06-04 18:01:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 18:01:00'),
(21, 7, NULL, 'ABSENT', 'Vắng mặt', '2026-06-04 18:00:00'),
(21, 8, '2026-06-04 17:52:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:52:00'),
(21, 9, '2026-06-04 17:56:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:56:00'),
(21, 10, '2026-06-04 17:59:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:59:00'),
(21, 11, '2026-06-04 18:03:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 18:03:00'),
(21, 12, NULL, 'ABSENT', 'Vắng mặt', '2026-06-04 18:00:00'),
(21, 13, '2026-06-04 17:51:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:51:00'),
(21, 14, '2026-06-04 17:57:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:57:00'),
(21, 15, '2026-06-04 18:00:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 18:00:00'),
(21, 16, '2026-06-04 18:05:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 18:05:00'),
(21, 17, '2026-06-04 17:53:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:53:00'),
(21, 18, NULL, 'ABSENT', 'Vắng mặt', '2026-06-04 18:00:00'),
(21, 19, '2026-06-04 17:58:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:58:00'),
(21, 20, '2026-06-04 18:01:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 18:01:00'),
(21, 21, '2026-06-04 18:02:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 18:02:00'),
(21, 22, '2026-06-04 17:56:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:56:00'),
(21, 23, NULL, 'ABSENT', 'Vắng mặt', '2026-06-04 18:00:00'),
(21, 24, '2026-06-04 17:59:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:59:00'),
(21, 25, '2026-06-04 18:00:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 18:00:00'),
(21, 26, '2026-06-04 17:51:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:51:00'),
(21, 27, '2026-06-04 17:55:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:55:00'),
(21, 28, '2026-06-04 17:58:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-04 17:58:00'),
(21, 29, NULL, 'ABSENT', 'Vắng mặt', '2026-06-04 18:00:00'),
(22, 1, '2026-06-18 19:25:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:25:00'),
(22, 2, '2026-06-18 19:28:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:28:00'),
(22, 3, NULL, 'ABSENT', 'Vắng mặt', '2026-06-18 19:30:00'),
(22, 4, '2026-06-18 19:20:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:20:00'),
(22, 5, '2026-06-18 19:24:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:24:00'),
(22, 6, '2026-06-18 19:31:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:31:00'),
(22, 7, '2026-06-18 19:26:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:26:00'),
(22, 8, '2026-06-18 19:22:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:22:00'),
(22, 9, NULL, 'ABSENT', 'Vắng mặt', '2026-06-18 19:30:00'),
(22, 10, '2026-06-18 19:29:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:29:00'),
(22, 11, '2026-06-18 19:33:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:33:00'),
(22, 12, '2026-06-18 19:27:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:27:00'),
(22, 13, '2026-06-18 19:21:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:21:00'),
(22, 14, '2026-06-18 19:27:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:27:00'),
(22, 15, NULL, 'ABSENT', 'Vắng mặt', '2026-06-18 19:30:00'),
(22, 16, '2026-06-18 19:35:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:35:00'),
(22, 17, '2026-06-18 19:23:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:23:00'),
(22, 18, '2026-06-18 19:26:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:26:00'),
(22, 19, '2026-06-18 19:28:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:28:00'),
(22, 20, '2026-06-18 19:31:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:31:00'),
(22, 21, NULL, 'ABSENT', 'Vắng mặt', '2026-06-18 19:30:00'),
(22, 22, '2026-06-18 19:26:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:26:00'),
(22, 23, '2026-06-18 19:29:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:29:00'),
(22, 24, '2026-06-18 19:29:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:29:00'),
(22, 25, '2026-06-18 19:30:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:30:00'),
(22, 26, '2026-06-18 19:21:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:21:00'),
(22, 27, NULL, 'ABSENT', 'Vắng mặt', '2026-06-18 19:30:00'),
(22, 28, '2026-06-18 19:28:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:28:00'),
(22, 29, '2026-06-18 19:25:00', 'PRESENT', 'Có mặt đúng giờ', '2026-06-18 19:25:00');
