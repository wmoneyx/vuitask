-- 1. Đảm bảo bảng Profiles có đầy đủ trường
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vui_coin_balance FLOAT DEFAULT 0;

-- 2. Index để ép buộc chỉ 1 đơn rút tiền Đang chờ duyệt cho mỗi người dùng (Optional performance/constraint)
-- CREATE UNIQUE INDEX IF NOT EXISTS one_pending_withdrawal_per_user 
-- ON community_messages (user_uuid) 
-- WHERE (type = 'withdrawal' AND status = 'Đang chờ duyệt');

-- 3. Cập nhật trạng thái Vip Task để hỗ trợ L1, L2
-- Task history thường dùng link tới task_history, đảm bảo có trường status_v1, status_v2 nếu cần theo dõi riêng
-- Hoặc sử dụng cấu trúc JSON trong url (như hiện tại đang làm cho Task Pre)

-- 4. Ví dụ SQL để tạo bảng community_messages nếu chưa có
CREATE TABLE IF NOT EXISTS community_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_uuid UUID REFERENCES profiles(user_uuid),
    user_name TEXT,
    user_avatar TEXT,
    content TEXT,
    type TEXT NOT NULL DEFAULT 'message', -- 'message', 'withdrawal', 'reply'
    status TEXT DEFAULT 'Gửi thành công', -- 'Đang chờ duyệt', 'Đã thanh toán', 'Từ chối', 'Đã hủy'
    amount FLOAT, -- Dành cho withdrawal
    reply_to_id UUID, -- Nếu là reply
    reactions JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT FALSE
);

-- 5. Bảng lịch sử duyệt (Approval History)
CREATE TABLE IF NOT EXISTS approval_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_uuid UUID,
    target_uuid UUID, -- User nhận
    type TEXT, -- 'withdrawal', 'task'
    original_id UUID, -- ID của withdrawal hoặc task
    action TEXT, -- 'approve', 'reject'
    amount FLOAT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
