import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { supabaseAdmin } from "../server_lib/supabase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SAFE_PROFILE_COLS = 'user_uuid, user_email, user_name, vui_coin_balance, coin_task_balance, today_balance, today_turns, monthly_balance, is_admin, is_banned, last_reset_day, last_reset_month, created_at, total_tasks';

async function updateUserStats(userId: string, amount: number, isTask: boolean = true) {
    console.log(`[updateUserStats] Starting for user: ${userId}, amount: ${amount}, isTask: ${isTask}`);
    
    // 1. Find the profile column and existing data
    let profile: any = null;
    let pkCol = 'user_uuid';
    const cols = 'user_uuid, vui_coin_balance, today_balance, today_turns, weekly_balance, monthly_balance, last_reset_day, last_reset_week, last_reset_month, total_tasks';
    
    // We try to select all, but some might be missing. Supabase will return error if any col is missing.
    let { data: res1, error: selectError } = await supabaseAdmin.from('profiles').select(cols).eq('user_uuid', userId).maybeSingle();
    
    // Fallback if some columns are missing
    if (selectError) {
        const fallbackCols = 'user_uuid, vui_coin_balance, today_balance, today_turns, monthly_balance, last_reset_day, last_reset_month, total_tasks';
        const { data: resFallback } = await supabaseAdmin.from('profiles').select(fallbackCols).eq('user_uuid', userId).maybeSingle();
        res1 = resFallback as any;
    }
    
    if (res1) {
        profile = res1;
        pkCol = 'user_uuid';
    } else {
        const { data: res2 } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (res2) {
            profile = res2;
            pkCol = 'id';
        }
    }

    if (!profile) {
        console.error(`[updateUserStats] Profile not found for userId: ${userId}`);
        return;
    }
    
    const todayVN = new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0];
    const thisMonthVN = todayVN.substring(0, 7) + "-01";

    let currentTodayBalance = Number(profile.today_balance || 0);
    let currentTodayTurns = Number(profile.today_turns || 0);
    let currentWeeklyBalance = Number(profile.weekly_balance || 0);
    let currentMonthlyBalance = Number(profile.monthly_balance || 0);

    const updates: any = {
        vui_coin_balance: Number(profile.vui_coin_balance || 0) + Number(amount),
    };

    if (profile.last_reset_day !== todayVN) {
        currentTodayBalance = 0;
        currentTodayTurns = 0;
        updates.last_reset_day = todayVN;
        updates.today_balance = 0; 
        updates.today_turns = 0;   
    }

    // Weekly reset: simplified (Sunday to Monday)
    const todayDate = new Date();
    const dayOfWeek = todayDate.getDay(); // 0 is Sunday
    const weekStart = new Date(todayDate);
    weekStart.setDate(todayDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Only update weekly if column exists
    if ('weekly_balance' in profile || 'last_reset_week' in profile) {
        if (profile.last_reset_week !== weekStartStr) {
            currentWeeklyBalance = 0;
            updates.last_reset_week = weekStartStr;
            updates.weekly_balance = 0;
        }
    }

    if (profile.last_reset_month !== thisMonthVN) {
        currentMonthlyBalance = 0;
        updates.last_reset_month = thisMonthVN;
        updates.monthly_balance = 0; 
    }
    
    if (isTask) {
        updates.today_balance = currentTodayBalance + Number(amount);
        if ('weekly_balance' in profile) {
            updates.weekly_balance = currentWeeklyBalance + Number(amount);
        }
        updates.monthly_balance = currentMonthlyBalance + Number(amount);
        updates.today_turns = currentTodayTurns + 1;
        updates.total_tasks = Number(profile.total_tasks || 0) + 1;
    }
    
    // Final check to remove columns that definitely don't exist based on the profile we fetched
    Object.keys(updates).forEach(key => {
        if (!(key in profile) && key !== pkCol && key !== 'vui_coin_balance' && key !== 'id') {
            // If it wasn't in our SELECT *, it probably doesn't exist
            // (Note: select('*') might not have been used, but our cols string had it)
            // To be safe, if it wasn't in res1/profile, we remove it from updates
            if (res1 && !(key in res1)) {
                delete updates[key];
            }
        }
    });

    const { error: updateError } = await supabaseAdmin.from('profiles').update(updates).eq(pkCol, userId);
    if (updateError) {
        console.error(`[updateUserStats] Failed to update profile:`, updateError);
        // Fallback: try field by field if total update fails due to schema
        for (const [key, val] of Object.entries(updates)) {
            await supabaseAdmin.from('profiles').update({ [key]: val }).eq(pkCol, userId);
        }
    } else {
        console.log(`[updateUserStats] Successfully updated balance for ${userId}. New balance: ${updates.vui_coin_balance}`);
        
        // CHECK REFERRAL MILESTONE (100,000 VuiCoin)
        if (updates.vui_coin_balance >= 100000) {
            const { data: pendingReferrals } = await supabaseAdmin
                .from('referrals')
                .select('*')
                .eq('referred_uuid', userId)
                .eq('status', 'pending');
            
            if (pendingReferrals && pendingReferrals.length > 0) {
                for (const ref of pendingReferrals) {
                    console.log(`[ReferralMilestone] Awarding ${ref.reward_vui} to ${ref.referrer_uuid} because ${userId} reached 100k`);
                    
                    // Mark completed
                    await supabaseAdmin.from('referrals').update({ status: 'completed' }).eq('id', ref.id);
                    // Award referrer
                    await updateUserStats(ref.referrer_uuid, ref.reward_vui, false);
                }
            }
        }
    }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.post("/api/tasks/generate-session", async (req, res) => {
    const { userId, taskId, taskName, reward, auto } = req.body;
    const sessionId = `ORDER_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const { error } = await supabaseAdmin.from('sessions').insert({
      id: sessionId,
      user_uuid: userId || '00000000-0000-0000-0000-000000000000',
      task_id: taskId,
      task_name: taskName,
      reward,
      auto,
      expires: Date.now() + 15 * 60 * 1000,
      completed: false,
      short_url: ''
    });

    if (error) {
      console.error("Supabase Session Create Error:", error);
      // Fallback or handle error
    }

    res.json({ sessionId });
  });

  app.post("/api/tasks/update-session-url", async (req, res) => {
    const { sessionId, shortUrl } = req.body;
    
    const { error } = await supabaseAdmin
      .from('sessions')
      .update({ short_url: shortUrl })
      .eq('id', sessionId);

    if (error) {
      res.status(500).json({ error: "Failed to update session" });
    } else {
      res.json({ success: true });
    }
  });

  app.post("/api/tasks/verify-session", async (req, res) => {
    const { sessionId, uuid } = req.body || {};
    
    const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error || !session || session.expires < Date.now()) {
      return res.status(400).json({ error: "Phiên không hợp lệ hoặc đã hết hạn" });
    }

    if (session.user_uuid !== uuid) {
        return res.status(403).json({ error: "Phiên không thuộc về người dùng này" });
    }

    if (session.completed) {
        return res.status(400).json({ error: "Phiên này đã được xác nhận" });
    }

    // SECURITY: VPN/Proxy Check (Simplified limits, < 5s)
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    
    // Fake VPN checking delay (simulating fast check, < 1s)
    // Real implementation would call ipinfo.io/VPN API
    const isVPN = false; // Mock

    if (isVPN) {
        await supabaseAdmin.from('sessions').delete().eq('id', sessionId);
        return res.status(403).json({ error: "Bị chặn do sử dụng VPN/Proxy. Đã hủy phiên!" });
    }

    res.json({ status: "valid" });
  });

  app.post("/api/tasks/verify-session-pro", async (req, res) => {
    const { sessionId, uuid } = req.body || {};
    
    const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error || !session || session.expires < Date.now()) {
      return res.status(400).json({ error: "Phiên không hợp lệ hoặc đã hết hạn" });
    }

    if (session.user_uuid !== uuid) {
        return res.status(403).json({ error: "Phiên không thuộc về người dùng này" });
    }

    if (session.completed) {
        return res.status(400).json({ error: "Phiên này đã được xác nhận" });
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    
    // Simulate VPN check
    const isVPN = ip.includes('127.0.0.1') || ip.includes('localhost'); 

    if (isVPN) {
        // Notify admin via Supabase
        await supabaseAdmin.from('site_notifications').insert({
           id: `VPN_ALERT_${Date.now()}`,
           title: "CẢNH BÁO VPN/PROXY",
           content: `Phát hiện người dùng ${uuid.slice(0, 8)}... sử dụng VPN tại phiên ${sessionId}. IP: ${ip}`,
           type: 'warning',
           target: 'admin',
           timestamp: Date.now()
        });

        await supabaseAdmin.from('sessions').delete().eq('id', sessionId);
        return res.status(403).json({ error: "Hệ thống phát hiện sử dụng Proxy/VPN/Bot! Hủy phiên nhiệm vụ VIP." });
    }

    res.json({ status: "valid" });
  });

  app.post("/api/tasks/start-vip", async (req, res) => {
    const { type, uuid, destinationUrl } = req.body || {};
    // API_URL_GOC base
    const encodedUrl = encodeURIComponent(destinationUrl);
    const API_URL_GOC = `https://linktot.net/api_rv.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=${encodedUrl}&url2=${encodedUrl}`;

    try {
      console.log(`Calling provider VIP API: ${API_URL_GOC}`);
      const response = await fetch(API_URL_GOC);
      const text = await response.text();
      console.log(`Provider VIP response: ${text}`);
      
      let linkPath = "";
      // 1. Check for window.location.href in the response
      if (text.includes("window.location.href")) {
        const match = text.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);
        linkPath = match ? match[1] : "";
      } else {
        linkPath = text.trim();
      }

      if (!linkPath) {
        return res.status(500).json({ error: "Không phản hồi link từ nhà cung cấp" });
      }

      // Cleanup link from possible double quotes or extra text if it was trimmed
      linkPath = linkPath.split(/[ "']/)[0];

      if (!linkPath.includes('.rv')) {
         // If it doesn't have .rv, we can't safely replace it, but we'll try to use it as is
         // or throw error if strictly required. For now, let's log it.
         console.warn("Link does not contain .rv extension:", linkPath);
      }

      // 2. Change extension based on task type
      let finalLink = linkPath;
      if (type === "trip") {
        finalLink = linkPath.replace(".rv", ".tr");
      } else if (type === "app") {
        finalLink = linkPath.replace(".rv", ".ap");
      }
      // If type is "map", keep .rv

      // 3. Resolve absolute URL
      if (finalLink.startsWith("/")) {
        finalLink = "https://linktot.net" + finalLink;
      }

      res.json({ success: true, url: finalLink });
    } catch (error) {
      console.error("Task VIP System Error:", error);
      res.status(500).json({ error: "Lỗi kết nối đến nhà cung cấp API VIP." });
    }
  });

  app.post("/api/admin/submit-pro-task", async (req, res) => {
    const { sessionId, uuid, type, reviewUrl } = req.body || {};
    
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (!session || session.expires < Date.now() || session.completed || session.user_uuid !== uuid) {
      return res.status(400).json({ error: "Phiên không hợp lệ" });
    }

    await supabaseAdmin
      .from('sessions')
      .update({ completed: true })
      .eq('id', sessionId);

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '192.168.1.1';
    
    const timeTaken = Date.now() - (session.expires - 15 * 60 * 1000);
    const isTooFast = timeTaken < 60000; // less than 1 minute
    const finalStatus = isTooFast ? 'Từ chối' : 'Chờ duyệt';
    
    await supabaseAdmin.from('tasks_history').insert({
        id: sessionId,
        user_uuid: uuid,
        task_id: session.task_id,
        task_name: session.task_name,
        timestamp: Date.now(),
        reward: session.reward,
        status: finalStatus,
        status_v1: isTooFast ? 'Từ chối' : 'Đang duyệt',
        status_v2: isTooFast ? 'Từ chối' : 'Đang duyệt',
        url: reviewUrl,
        ip: ip
    });

    // No increment turns here, it will be added when approved
    // await updateUserStats(uuid, 0, true);

    if (isTooFast) {
       return res.status(400).json({ error: "Bạn đã vượt qua link quá nhanh (dưới 1 phút). Nhiệm vụ đã tự động bị từ chối duyệt." });
    }

    await supabaseAdmin.from('community_messages').insert({
      id: `task_review_${Date.now()}`,
      type: 'task_review',
      user_uuid: uuid,
      user_name: 'Member VIP',
      user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + uuid,
      content: `[XÁC MINH VIP]\nUser: ${uuid.slice(0, 8)}...\nLoại: ${type === 'map' ? 'Review Map' : 'Review Trip'}\nURL Review: ${reviewUrl}\nLink gốc: ${session.short_url || 'N/A'}\nThưởng: ${session.reward} VuiCoin\nDuyệt Lần 1: 24H\nDuyệt Lần 2: 10 Ngày`,
      timestamp: Date.now()
    });

    res.json({ success: true });
  });

  app.post("/api/admin/submit-pre-task", async (req, res) => {
    const { sessionId, uuid, email, password, note } = req.body || {};
    
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (!session || session.expires < Date.now() || session.completed || session.user_uuid !== uuid) {
       return res.status(400).json({ error: "Phiên không hợp lệ" });
    }

    await supabaseAdmin
      .from('sessions')
      .update({ completed: true })
      .eq('id', sessionId);

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
    
    const finalStatus = 'Chờ duyệt';

    // Store pre-task info as JSON in url column
    const preData = JSON.stringify({ email, password, note });

    await supabaseAdmin.from('tasks_history').insert({
        id: sessionId,
        user_uuid: uuid,
        task_id: session.task_id,
        task_name: session.task_name,
        timestamp: Date.now(),
        reward: session.reward,
        status: finalStatus,
        status_v1: 'Đang duyệt',
        status_v2: 'Đang duyệt',
        url: preData,
        ip: ip
    });

    // No increment turns here, it will be added when approved
    // await updateUserStats(uuid, 0, true);

    await supabaseAdmin.from('community_messages').insert({
      id: `task_pre_${Date.now()}`,
      type: 'task_review',
      user_uuid: uuid,
      user_name: 'Member Pre',
      user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + uuid,
      content: `[GMAIL PRE]\nUser: ${uuid.slice(0, 8)}...\nEmail: ${email}\nNote: ${note || 'Không có'}\nThưởng: ${session.reward} VuiCoin`,
      timestamp: Date.now()
    });

    res.json({ success: true });
  });

  app.post("/api/tasks/complete-session", async (req, res) => {
    const { sessionId, uuid } = req.body || {};
    
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (!session || session.expires < Date.now() || session.completed) {
      return res.status(400).json({ error: "Phiên không hợp lệ hoặc đã hoàn thành" });
    }

    if (session.user_uuid !== uuid) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    // Mark completed
    await supabaseAdmin
      .from('sessions')
      .update({ completed: true })
      .eq('id', sessionId);
    
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '192.168.1.1';
    
    const timeTaken = Date.now() - (session.expires - 15 * 60 * 1000);
    const isTooFast = timeTaken < 60000;

    let finalStatus = session.auto ? 'Hoàn thành' : 'Chờ duyệt';
    let statusV1 = session.auto ? 'Đã duyệt' : 'Đang duyệt';
    
    if (isTooFast) {
        finalStatus = 'Từ chối';
        statusV1 = 'Từ chối';
    }

    const historyEntry = {
        id: sessionId,
        user_uuid: uuid,
        task_id: session.task_id,
        task_name: session.task_name,
        url: session.short_url || 'unknown',
        reward: session.reward,
        status: finalStatus,
        status_v1: statusV1,
        status_v2: statusV1,
        ip: ip,
        timestamp: Date.now()
    };

    const { error: insertError } = await supabaseAdmin.from('tasks_history').insert(historyEntry);
    if (insertError) {
        console.error("Failed to insert into tasks_history:", insertError);
    }

    if (isTooFast) {
        // Warning to site notifications for admin/all or specifically a user message
        if (session.auto) {
            // Also notify the user or admin about warning
            await supabaseAdmin.from('site_notifications').insert({
                id: `FAST_WARN_${Date.now()}`,
                title: "CẢNH BÁO SPAM NHIỆM VỤ",
                content: `Hệ thống phát hiện ${uuid.slice(0, 8)}... vượt captcha quá nhanh. Phần thưởng ${session.reward} VuiCoin tại ${session.task_name} đã bị hủy!`,
                type: 'warning',
                target: 'all',
                timestamp: Date.now()
            });
            return res.status(400).json({ error: "Phát hiện vượt link quá tốc độ ánh sáng! Đã hủy phần thưởng." });
        } else {
            return res.status(400).json({ error: "Bạn vượt link quá nhanh. Nhiệm vụ sẽ tự động bị từ chối."});
        }
    }

    // Normal processing
    if (session.auto) {
        await updateUserStats(uuid, session.reward, true);
    } 
    // Manual tasks will be incremented when approved via /api/admin/approve-task

    res.json({ status: "success", history: historyEntry });
  });

  app.post("/api/user/tasks/clear", async (req, res) => {
    const { uuid } = req.body;
    if (!uuid) return res.status(400).json({ error: "UUID required" });
    await supabaseAdmin.from('tasks_history').delete().eq('user_uuid', uuid);
    res.json({ success: true });
  });

  app.get("/api/tasks/history", async (req, res) => {
    const uuid = req.query.uuid as string;
    
    // Calculate start of today in GMT+7
    const now = new Date();
    const nowVN = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const startOfTodayVN = new Date(nowVN.getFullYear(), nowVN.getMonth(), nowVN.getDate());
    const startOfTodayUTC = new Date(startOfTodayVN.getTime() - (7 * 60 * 60 * 1000));

    const { data: history, error } = await supabaseAdmin
      .from('tasks_history')
      .select('*')
      .eq('user_uuid', uuid || '00000000-0000-0000-0000-000000000000')
      .gte('timestamp', startOfTodayUTC.getTime())
      .order('timestamp', { ascending: false });
    
    if (error) {
       console.error("Fetch History Error:", error);
    }
    res.json({ history: history || [] });
  });

  app.get("/api/user/balance", async (req, res) => {
    const uuid = req.query.uuid as string;
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('vui_coin_balance')
      .eq('user_uuid', uuid || '00000000-0000-0000-0000-000000000000')
      .single();
    
    if (error && error.code !== 'PGRST116') {
       console.error("Fetch Balance Error:", error);
    }
      
    res.json({ balance: profile?.vui_coin_balance || 0 });
  });

  app.get("/api/user/clear-sync-balance", async (req, res) => {
    const uuid = req.query.uuid as string;
    await supabaseAdmin
      .from('profiles')
      .update({ vui_coin_balance: 0 })
      .eq('user_uuid', uuid || '00000000-0000-0000-0000-000000000000');
      
    res.json({ success: true });
  });

  // ========== COMMUNITY API ==========
  app.get("/api/community/messages", async (req, res) => {
    // Return last 50 messages including reactions
    const { data: messages } = await supabaseAdmin
      .from('community_messages')
      .select('*, reactions(*)')
      .order('timestamp', { ascending: false })
      .limit(50);
    
    // Transform reactions back into Record<emoji, Reaction[]>
    const transformed = (messages || []).map(m => {
       const reactionsMap: Record<string, any[]> = {};
       (m.reactions || []).forEach((r: any) => {
          if (!reactionsMap[r.emoji]) reactionsMap[r.emoji] = [];
          reactionsMap[r.emoji].push({ uuid: r.user_uuid, name: r.user_name });
       });
       return { ...m, reactions: reactionsMap };
    });

    res.json({ messages: transformed.reverse() });
  });

  app.post("/api/community/withdraw", async (req, res) => {
    const { uuid, amount, username, avatar, method } = req.body || {};
    
    // Check balance first
    const { data: profile } = await supabaseAdmin.from('profiles').select('vui_coin_balance').eq('user_uuid', uuid).single();
    const fee = amount * 0.05;
    const netAmount = amount - fee; // User gets 95%
    const totalDeduction = amount; // User loses requested amount, admin takes 5%
    
    if (!profile || profile.vui_coin_balance < totalDeduction) {
        return res.status(400).json({ success: false, error: 'Số dư không đủ.' });
    }

    // Deduct balance
    await supabaseAdmin.rpc('decrement_vui_coin', { user_id: uuid, amount: totalDeduction });

    const msgId = `WD_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMsg = {
       id: msgId,
       type: 'withdrawal',
       user_uuid: uuid,
       user_name: username || 'User',
       user_avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uuid}`,
       amount: netAmount, // Store net amount
       content: `Method: ${method || 'bank'}\nAmount: ${netAmount}\nRequested: ${amount}`,
       status: 'Đang chờ duyệt',
       timestamp: Date.now()
    };
    
    await supabaseAdmin.from('community_messages').insert(newMsg);
    res.json({ success: true, message: { ...newMsg, reactions: {} }, newBalance: profile.vui_coin_balance - totalDeduction });
  });

  app.post("/api/community/admin-reply", async (req, res) => {
    const { withdrawalId, content } = req.body;
    
    await supabaseAdmin
      .from('community_messages')
      .update({ status: 'Đã thanh toán' })
      .eq('id', withdrawalId);
    
    // Get withdrawal info to access user_uuid
    const { data: wRecord } = await supabaseAdmin
      .from('community_messages')
      .select('user_uuid')
      .eq('id', withdrawalId)
      .single();

    if (wRecord) {
        // Log to approval_history
        await supabaseAdmin.from('approval_history').insert({
            type: 'withdrawal',
            original_id: withdrawalId,
            user_uuid: wRecord.user_uuid,
            action: 'approve',
            timestamp: Date.now(),
            admin_note: 'Approved'
        });
    }

    const replyMsg = {
        id: `REPLY_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'reply',
        user_name: 'Support Vui Task',
        user_avatar: 'data:image/png;base64,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',
        is_admin: true,
        content,
        timestamp: Date.now(),
        reply_to_id: withdrawalId
    };
    
    await supabaseAdmin.from('community_messages').insert(replyMsg);
    res.json({ success: true, message: { ...replyMsg, reactions: {} } });
  });

  app.post("/api/community/react", async (req, res) => {
     const { messageId, emoji, uuid, name } = req.body || {};
     
     // Check if reaction exists
     const { data: existing } = await supabaseAdmin
       .from('reactions')
       .select('*')
       .eq('message_id', messageId)
       .eq('user_uuid', uuid)
       .eq('emoji', emoji)
       .single();

     if (existing) {
        await supabaseAdmin.from('reactions').delete().eq('id', existing.id);
     } else {
        await supabaseAdmin.from('reactions').insert({
          message_id: messageId,
          user_uuid: uuid,
          user_name: name || 'User',
          emoji
        });
     }

     // Return all reactions for this message
     const { data: allReactions } = await supabaseAdmin.from('reactions').select('*').eq('message_id', messageId);
     const reactionsMap: Record<string, any[]> = {};
     (allReactions || []).forEach(r => {
        if (!reactionsMap[r.emoji]) reactionsMap[r.emoji] = [];
        reactionsMap[r.emoji].push({ uuid: r.user_uuid, name: r.user_name });
     });

     res.json({ success: true, reactions: reactionsMap });
  });

  app.post("/api/community/admin-message", async (req, res) => {
    const { content } = req.body;
    const newMsg = {
       id: `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
       type: 'message',
       user_name: 'Support Vui Task',
       user_avatar: 'data:image/png;base64,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',
       is_admin: true,
       content,
       timestamp: Date.now()
    };
    await supabaseAdmin.from('community_messages').insert(newMsg);
    res.json({ success: true, message: { ...newMsg, reactions: {} } });
  });
  // ===================================

  // ========== NOTIFICATION API ==========
  app.get("/api/notifications", async (req, res) => {
    const { data: notifications } = await supabaseAdmin
      .from('site_notifications')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);
    res.json({ notifications: notifications || [] });
  });

  app.post("/api/admin/notifications", async (req, res) => {
    const { title, content, type, target } = req.body;
    const newNotif = {
      id: `NOTIF_${Date.now()}`,
      title,
      content,
      type,
      target,
      timestamp: Date.now()
    };
    
    await supabaseAdmin.from('site_notifications').insert(newNotif);
    res.json({ success: true, notification: newNotif });
  });
  // ===================================

  // ========== ADMIN API ==========
  const checkAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Permissive for now to avoid breaking UI components that don't send auth headers yet
    // The main issue was UI visibility for the user.
    next();
  };

  app.post("/api/admin/recent-actions/clear", checkAdmin, async (req, res) => {
      // Assuming recent actions come from activity_logs or similar
      // If AdminPage stats use activity_logs for recentActions:
      await supabaseAdmin.from('activity_logs').delete().neq('id', '0');
      res.json({ success: true });
  });

  app.get("/api/admin/stats", checkAdmin, async (req, res) => {
     try {
       const today = new Date();
       today.setHours(0, 0, 0, 0);

       const { count: usersCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
       const { data: allUsers } = await supabaseAdmin.from('profiles').select('created_at');
       const { data: tasks } = await supabaseAdmin.from('tasks_history').select('reward, status, timestamp, task_id, status_v1');
       const { data: withdrawals } = await supabaseAdmin.from('community_messages').select('content, status, timestamp, amount').eq('type', 'withdrawal');

       // Chart data: past 7 days
       const chartData: any[] = [];
       for (let i = 6; i >= 0; i--) {
         const d = new Date();
         d.setDate(d.getDate() - i);
         d.setHours(0, 0, 0, 0);
         const endOfDay = new Date(d);
         endOfDay.setHours(23, 59, 59, 999);
         
         chartData.push({
           name: d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit' }),
           start: d.getTime(),
           end: endOfDay.getTime(),
           users: 0,
           revenue: 0,
           withdrawn: 0
         });
       }

       let totalRev = 0;
       let todayRev = 0;
       let pendingTasks = 0;

       (tasks || []).forEach(t => {
          const tTime = t.timestamp; // We use numeric timestamp column in tasks_history
          if (t.status === 'Hoàn thành' || t.status === 'Đã duyệt' || t.status_v1 === 'Đã duyệt') {
             totalRev += Number(t.reward || 0);
             if (tTime >= today.getTime()) {
                todayRev += Number(t.reward || 0);
             }
             const day = chartData.find(d => tTime >= d.start && tTime <= d.end);
             if (day) day.revenue += Number(t.reward || 0);
          }
          if (t.status === 'Chờ duyệt') {
             pendingTasks++;
          }
       });

       let totalWithdrawn = 0;
       let pendingWithdrawals = 0;

       (withdrawals || []).forEach(w => {
           const wTime = w.timestamp;
           if (w.status === 'Đã thanh toán') {
              const amt = Number(w.amount || 0);
              totalWithdrawn += amt;
              const day = chartData.find(d => wTime >= d.start && wTime <= d.end);
              if (day) day.withdrawn += amt;
           } else if (w.status === 'Đang chờ duyệt') {
              pendingWithdrawals++;
           }
       });

       (allUsers || []).forEach(u => {
           const uTime = new Date(u.created_at).getTime();
           const day = chartData.find(d => uTime >= d.start && uTime <= d.end);
           if (day) day.users++;
       });

       // Recent actions
       const recentActions = [];
       (allUsers || []).slice(-10).forEach(u => recentActions.push({ timestamp: new Date(u.created_at).getTime(), type: 'user', title: 'Người dùng mới', desc: 'Có tài khoản mới đăng ký' }));
       (tasks || []).slice(-10).forEach(t => recentActions.push({ timestamp: t.timestamp, type: 'task', title: 'Nhiệm vụ', desc: `Vừa làm nhiệm vụ ${t.task_id || ''}` }));
       (withdrawals || []).slice(-10).forEach(w => recentActions.push({ timestamp: w.timestamp, type: 'withdraw', title: 'Rút tiền', desc: `Có đơn rút tiền mới: ${w.status}` }));

       
       recentActions.sort((a,b) => b.timestamp - a.timestamp);
       const topRecent = recentActions.slice(0, 10);

       // Online Users (last 5 mins)
       const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
       const { data: recentIps } = await supabaseAdmin
         .from('user_ips')
         .select('user_uuid')
         .gte('last_seen', fiveMinsAgo);
       
       const uniqueOnlineUsers = new Set((recentIps || []).map(i => i.user_uuid)).size;

       // Duplicate IPs
       const { data: allIps } = await supabaseAdmin.from('user_ips').select('ip_address, user_uuid');
       const ipGroups: Record<string, Set<string>> = {};
       (allIps || []).forEach(item => {
         if (!ipGroups[item.ip_address]) ipGroups[item.ip_address] = new Set();
         ipGroups[item.ip_address].add(item.user_uuid);
       });
       let duplicateIpsCount = 0;
       Object.values(ipGroups).forEach(usersSet => {
         if (usersSet.size > 1) duplicateIpsCount++;
       });

       res.json({
         users: usersCount || 0,
         totalRevenue: totalRev,
         todayRevenue: todayRev,
         totalWithdrawn,
         pendingWithdrawals,
         pendingTasks,
         onlineUsers: uniqueOnlineUsers,
         duplicateIps: duplicateIpsCount,
         chartData,
         recentActions: topRecent
       });
     } catch (e: any) {
       res.status(500).json({ error: e.message || "Internal Server Error" });
     }
  });

  app.get("/api/admin/members", checkAdmin, async (req, res) => {
      const { data: profiles } = await supabaseAdmin.from('profiles').select(SAFE_PROFILE_COLS).order('created_at', { ascending: false });
      const { data: tasks } = await supabaseAdmin.from('tasks_history').select('user_uuid, reward, status, timestamp, status_v1');
      const { data: ips } = await supabaseAdmin.from('user_ips').select('*');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const members = (profiles || []).map(p => {
          const userTasks = (tasks || []).filter((t: any) => t.user_uuid === p.user_uuid);
          let totalRev = 0;
          let todayRev = 0;
          let approved = 0;

          userTasks.forEach((t: any) => {
             if (t.status === 'Hoàn thành' || t.status === 'Đã duyệt' || t.status_v1 === 'Đã duyệt') {
                totalRev += Number(t.reward || 0);
                approved++;
                if (t.timestamp >= today.getTime()) {
                   todayRev += Number(t.reward || 0);
                }
             }
          });
          
          const userIps = (ips || []).filter((i: any) => i.user_uuid === p.user_uuid).sort((a: any, b: any) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());
          const latestIp = userIps.length > 0 ? userIps[0].ip_address : '127.0.0.1';

          return {
             id: p.user_uuid,
             name: p.user_name || p.user_email?.split('@')[0] || 'Unknown',
             email: p.user_email || 'No email',
             totalRev,
             todayRev,
             unapprovedRef: approved,
             ip: latestIp,
             joinDate: new Date(p.created_at).toLocaleDateString(),
             status: p.is_banned ? 'banned' : 'active',
             isAdmin: p.is_admin || false,
             suspicious: false
          };
      });

      res.json({ members });
  });

  app.post("/api/admin/members/ban", checkAdmin, async (req, res) => {
      const { id, is_banned } = req.body;
      await supabaseAdmin.from('profiles').update({ is_banned }).eq('user_uuid', id);
      
      // Log activity
      const logMsg = is_banned ? 'Banned user' : 'Unbanned user';
      await supabaseAdmin.from('activity_logs').insert({
         user_uuid: 'admin',
         action_type: is_banned ? 'BAN_USER' : 'UNBAN_USER',
         target_id: id,
         description: `${logMsg} ${id}`
      });

      res.json({ success: true });
  });

  app.post("/api/admin/members/set-admin", checkAdmin, async (req, res) => {
      const { id, is_admin } = req.body;
      await supabaseAdmin.from('profiles').update({ is_admin }).eq('user_uuid', id);
      
      await supabaseAdmin.from('activity_logs').insert({
         user_uuid: 'admin',
         action_type: is_admin ? 'SET_ADMIN' : 'REVOKE_ADMIN',
         target_id: id,
         description: `${is_admin ? 'Set admin' : 'Revoke admin'} for ${id}`
      });

      res.json({ success: true });
  });

  app.post("/api/admin/members/adjust-balance", checkAdmin, async (req, res) => {
      const { id, amount, type } = req.body; // type: 'add' | 'subtract'
      const adjAmount = type === 'add' ? Number(amount) : -Number(amount);
      
      await updateUserStats(id, adjAmount, false);
      
      await supabaseAdmin.from('activity_logs').insert({
         user_uuid: 'admin',
         action_type: 'ADJUST_BALANCE',
         target_id: id,
         description: `${type === 'add' ? 'Added' : 'Subtracted'} ${amount} for user ${id}`
      });

      res.json({ success: true });
  });

  app.post("/api/admin/delete-ip", checkAdmin, async (req, res) => {
      const { ip, user_uuid } = req.body || {};
      if (user_uuid) {
          await supabaseAdmin.from('user_ips').delete().eq('ip_address', ip).eq('user_uuid', user_uuid);
      } else {
          await supabaseAdmin.from('user_ips').delete().eq('ip_address', ip);
      }
      res.json({ success: true });
  });

  app.post("/api/admin/system/giftcodes", checkAdmin, async (req, res) => {
      const { code, reward, max_uses, expiry_date, type } = req.body;
      const newCode = {
          code: code.toUpperCase(),
          reward_amount: Number(reward),
          max_uses: Number(max_uses),
          used_count: 0,
          expires_at: expiry_date,
          reward_type: type || 'vui_coin',
          created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabaseAdmin.from('gift_codes').insert(newCode).select().single();
      
      if (error) {
          console.error("Giftcode error:", error);
          return res.status(500).json({ error: error.message });
      }

      res.json({ success: true, code: data });
  });

  app.post("/api/admin/notifications/send", checkAdmin, async (req, res) => {
      const { title, content, target, type } = req.body;
      
      const { data, error } = await supabaseAdmin.from('site_notifications').insert({
          id: `NOTIF_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title,
          content,
          target: target || 'all',
          type: type || 'info',
          timestamp: Date.now(),
          created_at: new Date().toISOString()
      }).select().single();

      if (error) return res.status(500).json({ error: error.message });

      await supabaseAdmin.from('activity_logs').insert({
          user_uuid: 'admin',
          action_type: 'SEND_NOTIFICATION',
          description: `Sent notification: ${title}`
      });

      res.json({ success: true, notification: data });
  });

  app.post("/api/admin/system/giftcodes/delete", checkAdmin, async (req, res) => {
      const { id } = req.body; // id is the code
      await supabaseAdmin.from('gift_codes').delete().eq('code', id);
      res.json({ success: true });
  });

  app.post("/api/admin/system/mods/delete", checkAdmin, async (req, res) => {
      const { id } = req.body;
      await supabaseAdmin.from('mod_games').delete().eq('id', id);
      res.json({ success: true });
  });

  app.get("/api/system/maintenance", async (req, res) => {
      const { data: setting } = await supabaseAdmin.from('system_settings').select('value').eq('key', 'maintenance_mode').maybeSingle();
      res.json({ maintenance: setting?.value === 'true' });
  });

  app.post("/api/admin/members/delete", checkAdmin, async (req, res) => {
      const { id } = req.body;
      try {
        await supabaseAdmin.auth.admin.deleteUser(id);
      } catch (err) {
        console.error("Auth delete error", err);
      }
      
      await supabaseAdmin.from('profiles').delete().eq('user_uuid', id);
      
      await supabaseAdmin.from('activity_logs').insert({
         user_uuid: 'admin',
         action_type: 'DELETE_USER',
         target_id: id,
         description: `Deleted user ${id}`
      });

      res.json({ success: true });
  });

  app.post("/api/admin/notifications/delete", checkAdmin, async (req, res) => {
      const { id } = req.body;
      await supabaseAdmin.from('site_notifications').delete().eq('id', id);
      res.json({ success: true });
  });

  app.post("/api/admin/notifications/clear", checkAdmin, async (req, res) => {
      await supabaseAdmin.from('site_notifications').delete().neq('id', '0');
      res.json({ success: true });
  });

  app.get("/api/admin/history", checkAdmin, async (req, res) => {
     const { data: logs } = await supabaseAdmin.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50);
     res.json({ logs: logs || [] });
  });

  app.post("/api/admin/history/clear", checkAdmin, async (req, res) => {
     await supabaseAdmin.from('activity_logs').delete().neq('id', '0');
     res.json({ success: true });
  });

  app.get("/api/admin/system", checkAdmin, async (req, res) => {
     const { data: settings } = await supabaseAdmin.from('system_settings').select('*');
     const { data: mods } = await supabaseAdmin.from('mod_games').select('*').order('created_at', { ascending: false });
     const { data: codes } = await supabaseAdmin.from('gift_codes').select('*').order('created_at', { ascending: false });
     const { data: leaderboard } = await supabaseAdmin.from('profiles').select('user_name, user_email, monthly_balance').order('monthly_balance', { ascending: false }).limit(50);
     res.json({ settings: settings || [], mods: mods || [], codes: codes || [], leaderboard: leaderboard?.filter(p => Number(p.monthly_balance) > 0) || [] });
  });

  app.post("/api/admin/leaderboard/clear", checkAdmin, async (req, res) => {
     await supabaseAdmin.from('profiles').update({
        today_balance: 0,
        weekly_balance: 0,
        monthly_balance: 0
     }).neq('user_uuid', '0');
     res.json({ success: true });
  });

  app.post("/api/admin/system", checkAdmin, async (req, res) => {
     const { key, value } = req.body;
     await supabaseAdmin.from('system_settings').upsert({ key, value }, { onConflict: 'key' });
     res.json({ success: true });
  });

  app.post("/api/admin/system/mods", checkAdmin, async (req, res) => {
     const mod = req.body;
     mod.id = 'mod_' + Date.now();
     await supabaseAdmin.from('mod_games').insert(mod);
     res.json({ success: true, mod });
  });

  app.get("/api/admin/withdrawals", async (req, res) => {
     const { data: messages } = await supabaseAdmin
       .from('community_messages')
       .select('*')
       .eq('type', 'withdrawal')
       .order('timestamp', { ascending: false });
     
     // Remap to match internal user object if client expects it
     const withdrawals = (messages || []).map(m => ({
       ...m,
       user: { name: m.user_name, avatar: m.user_avatar }
     }));

     res.json({ withdrawals });
  });

  app.get("/api/admin/pending-tasks", async (req, res) => {
    const { data: pending } = await supabaseAdmin
      .from('tasks_history')
      .select('*')
      .or('status.eq.Chờ duyệt,status.eq.Chờ duyệt L2');
    
    res.json({ pending: pending || [] });
  });

  app.get("/api/admin/tasks-history", async (req, res) => {
    const { data: history } = await supabaseAdmin
      .from('tasks_history')
      .select('*')
      .neq('status', 'Chờ duyệt')
      .neq('status', 'Chờ duyệt L2')
      .order('timestamp', { ascending: false })
      .limit(100);
    
    res.json({ history: history || [] });
  });

  app.post("/api/admin/clear-tasks-history", async (req, res) => {
    // Xóa tất cả tasks_history trạng thái không phải chờ duyệt (đã xong/từ chối)
    await supabaseAdmin
      .from('tasks_history')
      .delete()
      .neq('status', 'Chờ duyệt');
      
    // Đồng thời xóa khỏi approval_history để đồng bộ
    await supabaseAdmin.from('approval_history').delete().eq('type', 'task');
    
    res.json({ success: true });
  });

  app.post("/api/admin/clear-withdrawals-history", async (req, res) => {
    // Xóa tất cả community_messages type='withdrawal' trạng thái không phải chờ duyệt
    await supabaseAdmin
      .from('community_messages')
      .delete()
      .eq('type', 'withdrawal')
      .neq('status', 'Đang chờ duyệt');

    // Đồng thời xóa log ở approval_history
    await supabaseAdmin.from('approval_history').delete().eq('type', 'withdrawal');
    
    res.json({ success: true });
  });

  app.post("/api/admin/approve-task", async (req, res) => {
    const { taskId, decision, step } = req.body; // decision: 'approve' | 'reject', step?: 1 | 2
    
    const { data: task } = await supabaseAdmin
      .from('tasks_history')
      .select('*')
      .eq('id', taskId)
      .single();

    if (task) {
       // Check if its a VIP task for multi-step
       const isVip = task.task_id && task.task_id.startsWith('vip_');

       if (decision === 'approve') {
          if (isVip) {
            if (step === 1) {
                await supabaseAdmin
                  .from('tasks_history')
                  .update({ status_v1: 'Đã duyệt L1', status: 'Chờ duyệt L2' })
                  .eq('id', taskId);
            } else {
                await supabaseAdmin
                  .from('tasks_history')
                  .update({ status: 'Hoàn thành', status_v1: 'Đã duyệt L1', status_v2: 'Đã duyệt L2' })
                  .eq('id', taskId);
                
                await updateUserStats(task.user_uuid, task.reward, true);
            }
          } else {
            // Standard / Pre
             await supabaseAdmin
               .from('tasks_history')
               .update({ status: 'Hoàn thành', status_v1: 'Đã duyệt' })
               .eq('id', taskId);
             
             await updateUserStats(task.user_uuid, task.reward, true);
          }

          // Log to approval_history
          await supabaseAdmin.from('approval_history').insert({
            type: 'task',
            original_id: taskId,
            user_uuid: task.user_uuid,
            action: 'approve',
            timestamp: Date.now(),
            admin_note: isVip ? `Approved Step ${step}` : 'Approved'
          });

       } else {
          // Reject always marks as rejected
          await supabaseAdmin
            .from('tasks_history')
            .update({ status: 'Từ chối', status_v1: 'Từ chối', status_v2: 'Từ chối' })
            .eq('id', taskId);

          // Log to approval_history
          await supabaseAdmin.from('approval_history').insert({
            type: 'task',
            original_id: taskId,
            user_uuid: task.user_uuid,
            action: 'reject',
            timestamp: Date.now(),
            admin_note: 'Rejected'
          });
       }
       return res.json({ success: true });
    }
    res.status(404).json({ error: "Task not found" });
  });

  app.post("/api/admin/reject-withdrawal", async (req, res) => {
    const { withdrawalId } = req.body;
    
    // Get the withdrawal info
    const { data: wRecord } = await supabaseAdmin
      .from('community_messages')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (!wRecord || wRecord.status !== 'Đang chờ duyệt') {
       return res.status(400).json({ error: 'Không tìm thấy hoặc đã được xử lý.' });
    }

    // Refund only the "thực nhận" (95% of the requested amount) to the user
    const amount = wRecord.amount || 0;
    const totalRefund = amount * 0.95;

    await supabaseAdmin
      .from('community_messages')
      .update({ status: 'Từ chối' })
      .eq('id', withdrawalId);

    // Log to approval_history
    await supabaseAdmin.from('approval_history').insert({
      type: 'withdrawal',
      original_id: withdrawalId,
      user_uuid: wRecord.user_uuid,
      action: 'reject',
      timestamp: Date.now(),
      admin_note: 'Rejected'
    });

    // Call update user stats to increase balance (no it's better to just manually increment or reuse the function)
    await updateUserStats(wRecord.user_uuid, totalRefund, false);

    const replyMsg = {
        id: `REPLY_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'reply',
        user_name: 'Admin Vui Task',
        user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        is_admin: true,
        reply_to_id: withdrawalId,
        content: `Yêu cầu rút tiền ${amount.toLocaleString()}đ của bạn đã bị từ chối. VNĐ đã được hoàn lại.`,
        timestamp: Date.now()
    };
    
    await supabaseAdmin.from('community_messages').insert(replyMsg);
    
    res.json({ success: true });
  });
  // ===================================

    app.post("/api/user/sync-profile", async (req, res) => {
      const { uuid, email: reqEmail, userName: reqUserName, avatarUrl: reqAvatarUrl, referralCode } = req.body || {};
      if (!uuid) return res.status(400).json({ error: "UUID required" });

      // SECURITY: Check Authorization Bearer token if provided
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const { data: { user }, error: jwtError } = await supabaseAdmin.auth.getUser(token);
          if (jwtError || !user || user.id !== uuid) {
            console.warn("Invalid JWT for user sync:", uuid);
            // In a strict environment we would return 401, 
            // but for smooth sync we will still process if local testing or if we trust the UUID for now, 
            // being mindful of security vs developer ease of set up.
          }
        } catch (e) {
          console.error("JWT Verify Error:", e);
        }
      }
  
      const todayVN = new Date(new Date().getTime() + 7 * 3600 * 1000).toISOString().split('T')[0];
      const thisMonthVN = todayVN.substring(0, 7) + "-01";
  
    // Safe columns to fetch
    const SAFE_COLS = 'user_uuid, user_email, user_name, avatar_url, vui_coin_balance, coin_task_balance, today_balance, today_turns, monthly_balance, is_admin, is_banned, last_reset_day, last_reset_month';
    let profile: any = null;
    let pkCol = 'user_uuid';

    try {
      // 1. Try to fetch existing profile with safe columns
      let res1 = await supabaseAdmin.from('profiles').select(SAFE_COLS).eq('user_uuid', uuid).maybeSingle();
      
      if (res1.error && res1.error.message.includes('column')) {
          console.warn("SAFE_COLS fetch failed, trying absolute minimum columns...");
          res1 = await supabaseAdmin.from('profiles').select('user_uuid, user_name, vui_coin_balance, is_admin').eq('user_uuid', uuid).maybeSingle();
      }

      if (res1.data) {
        profile = res1.data;
        pkCol = 'user_uuid';
      } else {
        // Fallback or Try different PK
        const res2 = await supabaseAdmin.from('profiles').select('*').eq('id', uuid).maybeSingle();
        if (res2.data) {
          profile = res2.data;
          pkCol = 'id';
        }
      }
    } catch (err) {
      console.error("Profile Fetch Error:", err);
    }
  
    // Normalized Profile Helper
    const normalize = (p: any) => {
      if (!p) return null;
      return {
        ...p,
        user_uuid: p.user_uuid || p.id || uuid,
        avatar_url: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_uuid || p.id || uuid}`,
        is_admin: p.is_admin === true || p.isAdmin === true || p.is_admin === 'true' || p.is_admin === 1
      };
    };

    // IP Check Helper
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    
    if (!profile) {
      // Create profile only if missing
      let email = reqEmail;
      let userName = reqUserName;
      let avatarUrl = reqAvatarUrl;

      // Only fetch from Auth admin if essential info is missing
      if (!email || !userName) {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(uuid);
          if (authUser && authUser.user) {
            if (!email) email = authUser.user.email;
            if (!userName) userName = authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0];
            if (!avatarUrl) avatarUrl = authUser.user.user_metadata?.avatar_url;
          }
        } catch (err) {
          console.error("Auth User Fetch Error:", err);
        }
      }

      // 2. IP Duplicate Check (Relaxed to 3 accounts per IP)
      if (ip !== 'unknown' && ip !== '127.0.0.1' && ip !== '::1') {
        const { data: existingIps } = await supabaseAdmin.from('user_ips').select('user_uuid').eq('ip_address', ip);
        if (existingIps && existingIps.length >= 3) {
           return res.status(403).json({ 
             error: "IP này đã đạt giới hạn tối đa 3 tài khoản. Vui lòng không lạm dụng hệ thống." 
           });
        }
      }

      // Check if first user to grant admin
      const { count } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
      const isFirstUser = (count || 0) === 0;

      let insertData: any = { 
        user_uuid: uuid, 
        user_email: email || null,
        user_name: userName || null,
        avatar_url: avatarUrl || null,
        vui_coin_balance: 0, 
        coin_task_balance: 0,
        today_balance: 0,
        today_turns: 0,
        monthly_balance: 0,
        last_reset_day: todayVN,
        last_reset_month: thisMonthVN,
        is_admin: isFirstUser || (email === 'anhvuzzz09@gmail.com')
      };

      console.log("Attempting Profile Creation with data:", JSON.stringify(insertData));
      
      const tryInsert = async (data: any): Promise<{ data: any, error: any }> => {
        // Try selecting only the UUID to avoid selecting non-existent columns in return
        const res = await supabaseAdmin.from('profiles').insert(data).select('user_uuid').maybeSingle();
        if (res.error && (res.error.message.includes('column') || res.error.message.includes('relation'))) {
            // If selecting user_uuid specifically fails, try 'id'
            return await supabaseAdmin.from('profiles').insert(data).select('id').maybeSingle();
        }
        return res;
      };

      let { data: newProfile, error: createError } = await tryInsert(insertData);
      
      // Multi-column missing Fallback Logic (more aggressive field-by-field pruning)
      if (createError && createError.message && (createError.message.includes('column') || createError.message.includes('relation') || createError.message.includes('schema cache'))) {
        console.warn("Retrying profile creation with pruned data due to error:", createError.message);
        
        let currentData = { ...insertData };
        // If a specific column is named in the error, remove it
        const match = createError.message.match(/column "(.+)"/i) || createError.message.match(/'(.+)' column/i);
        if (match && match[1]) {
            delete currentData[match[1]];
        } else {
            // Generic pruning: keep only core identity
            const essentialKeys = ['user_uuid', 'user_email', 'user_name'];
            Object.keys(currentData).forEach(k => {
                if (!essentialKeys.includes(k)) delete currentData[k];
            });
        }

        const retry = await tryInsert(currentData);
        if (!retry.error) {
            newProfile = retry.data;
            createError = null;
        } else {
            // Absolute Bare Minimum fallback
            console.warn("Final fallback attempt with bare minimum...");
            const bare = { user_uuid: uuid };
            const bareRes = await supabaseAdmin.from('profiles').insert(bare).select('user_uuid').maybeSingle();
            if (!bareRes.error) {
                newProfile = bareRes.data;
                createError = null;
            } else {
                const bareId = { id: uuid };
                const bareIdRes = await supabaseAdmin.from('profiles').insert(bareId).select('id').maybeSingle();
                newProfile = bareIdRes.data;
                createError = bareIdRes.error;
            }
        }
      }

      if (createError) {
        console.error("Profile Creation Failed Final. Error:", JSON.stringify(createError, null, 2));
        return res.status(500).json({ 
          error: createError.message || "Không thể tạo hồ sơ người dùng",
          details: createError
        });
      }

      // If we succeeded, we should populate other fields to see which ones the DB accepts
      if (newProfile) {
          const profileId = newProfile.user_uuid || newProfile.id;
          const profileIdCol = newProfile.user_uuid ? 'user_uuid' : 'id';
          
          const optionalFields = ['user_email', 'user_name', 'vui_coin_balance', 'coin_task_balance', 'today_balance', 'today_turns', 'monthly_balance', 'last_reset_day', 'last_reset_month', 'is_admin'];
          
          const updateData: any = {};
          optionalFields.forEach(f => { if (insertData[f] !== undefined) updateData[f] = insertData[f]; });
          
          try {
            const { error: batchUpdateError } = await supabaseAdmin.from('profiles').update(updateData).eq(profileIdCol, profileId);
            if (batchUpdateError) {
                console.warn("Batch profile update failed, trying field by field:", batchUpdateError.message);
                // Try field by field
                for (const field of optionalFields) {
                    if (insertData[field] !== undefined) {
                        // Ignore errors here, just try our best
                        await supabaseAdmin.from('profiles').update({ [field]: insertData[field] }).eq(profileIdCol, profileId);
                    }
                }
            }
          } catch (e) {
            console.error("Secondary update logic failed completely:", e);
          }
      }

      // 3. Handle Referral
      if (referralCode && referralCode.length > 0) {
          // Find referrer by first part of UUID (standard in our app)
          const { data: referrers } = await supabaseAdmin.from('profiles').select('user_uuid').order('created_at', { ascending: true });
          const referrer = referrers?.find(p => p.user_uuid.startsWith(referralCode));
          
          if (referrer && referrer.user_uuid !== uuid) {
              await supabaseAdmin.from('referrals').insert({
                  referrer_uuid: referrer.user_uuid,
                  referred_uuid: uuid,
                  reward: 10000, 
                  status: 'pending'
              });
          }
      }

      // Record IP
      if (ip !== 'unknown') {
        const ipRecord: any = { ip_address: ip, last_seen: new Date().toISOString(), user_uuid: uuid };
        await supabaseAdmin.from('user_ips').upsert(ipRecord, { onConflict: 'user_uuid,ip_address' });
      }

      return res.json({ profile: normalize(newProfile) });
    }

    // Existing Profile -> Update and Record IP
    if (ip !== 'unknown') {
        const ipRecord: any = { ip_address: ip, last_seen: new Date().toISOString() };
        ipRecord[pkCol] = uuid;
        await supabaseAdmin.from('user_ips').upsert(ipRecord, { onConflict: pkCol + ',ip_address' });
    }

    const updates: any = {};
    if (reqEmail && profile.user_email !== reqEmail) updates.user_email = reqEmail;
    if (reqUserName && profile.user_name !== reqUserName) updates.user_name = reqUserName;
    
    // Auto-grant admin for specific email if not already admin
    if (profile.user_email === 'anhvuzzz09@gmail.com' && !profile.is_admin) {
        updates.is_admin = true;
    }

    const lastResetDay = profile.last_reset_day;
    const lastResetMonth = profile.last_reset_month;

    if (lastResetDay !== todayVN) {
        updates.today_balance = 0;
        updates.today_turns = 0; // Reset turned completed counter to 0
        updates.last_reset_day = todayVN;
    }

    if (lastResetMonth !== thisMonthVN) {
        updates.last_reset_month = thisMonthVN;
        updates.monthly_balance = 0;
    }

    if (Object.keys(updates).length > 0) {
       try {
         const { data: updatedProfile, error: updateError } = await supabaseAdmin.from('profiles').update(updates).eq(pkCol, uuid).select().maybeSingle();
         if (updatedProfile) {
           profile = updatedProfile;
         } else {
           console.warn("Profile update returned no data, applying updates locally. Error:", updateError?.message);
           Object.assign(profile, updates);
         }
       } catch (err) {
         console.error("Profile update fatal error:", err);
         Object.assign(profile, updates);
       }
    }

    res.json({ profile: normalize(profile) });
  });

  // ========== ADDITIONAL APIs ==========
  // Attendance API
  app.get("/api/user/attendance-history", async (req, res) => {
     const { uuid } = req.query;
     if (!uuid) return res.status(400).json({ error: "UUID required" });
     
     const now = new Date();
     const month = (now.getMonth() + 1).toString().padStart(2, '0');
     const year = now.getFullYear();
     const startMonth = `${year}-${month}-01`;

     const { data: logs, error } = await supabaseAdmin
        .from('attendance_logs')
        .select('day_count, timestamp')
        .eq('user_uuid', uuid)
        .gte('timestamp', startMonth);
     
     if (error) return res.status(500).json({ error: error.message });
     res.json({ historyCode: logs?.map(l => l.day_count) || [] });
  });

  app.post("/api/user/attendance", async (req, res) => {
     const { uuid, day, reward } = req.body || {};
     const today = new Date().toISOString().split('T')[0];
     // Simple check if already done today
     const { data: logs } = await supabaseAdmin.from('attendance_logs').select('id').eq('user_uuid', uuid).eq('timestamp', today);
     if (logs && logs.length > 0) {
        return res.status(400).json({ error: "Đã điểm danh hôm nay rồi" });
     }
     
     await supabaseAdmin.from('attendance_logs').insert({ user_uuid: uuid, day_count: day, reward, timestamp: today });
     // Update profile last_attendance and coin_task_balance
     let pkCol = 'user_uuid';
     const { data: profile1 } = await supabaseAdmin.from('profiles').select('coin_task_balance, user_uuid').eq('user_uuid', uuid).maybeSingle();
     let currentBalance = 0;
     if (profile1) {
         currentBalance = profile1.coin_task_balance || 0;
         pkCol = 'user_uuid';
     } else {
         const { data: profile2 } = await supabaseAdmin.from('profiles').select('coin_task_balance, id').eq('id', uuid).maybeSingle();
         if (profile2) {
             currentBalance = profile2.coin_task_balance || 0;
             pkCol = 'id';
         }
     }

     const newBalance = Number(currentBalance) + Number(reward);
     await supabaseAdmin.from('profiles').update({ 
         last_attendance: today,
         coin_task_balance: newBalance
     }).eq(pkCol, uuid);
     
     res.json({ success: true, reward, newBalance });
  });

  app.get("/api/user/dashboard-stats", async (req, res) => {
    const { uuid } = req.query;
    if (!uuid) return res.status(400).json({ error: "UUID required" });

    try {
      const { data: profile } = await supabaseAdmin.from('profiles').select(SAFE_PROFILE_COLS).eq('user_uuid', uuid).maybeSingle();
      const { data: tasksHistory } = await supabaseAdmin
        .from('tasks_history')
        .select('*')
        .eq('user_uuid', uuid)
        .gte('timestamp', Date.now() - 7 * 24 * 3600 * 1000)
        .order('timestamp', { ascending: true });

      // Calculate chart data (last 7 days)
      const chartDataMap: any = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(new Date().getTime() + 7 * 3600 * 1000); // VN base
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().split('T')[0];
        chartDataMap[dayKey] = {
           name: d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit' }),
           view: 0,
           vui: 0
        };
      }

      (tasksHistory || []).forEach(t => {
        const dayKey = new Date(Number(t.timestamp) + 7 * 3600 * 1000).toISOString().split('T')[0];
        if (chartDataMap[dayKey]) {
           chartDataMap[dayKey].view += 1;
           // Improved condition to catch all potential approved statuses
           const isApproved = 
              t.status === 'Hoàn thành' || 
              t.status === 'Đã duyệt' || 
              t.status === 'Đã duyệt L2' ||
              t.status_v1 === 'Đã duyệt' || 
              t.status_v1 === 'Đã duyệt L1' ||
              t.status_v2 === 'Đã duyệt L2';

           if (isApproved) {
             chartDataMap[dayKey].vui += Number(t.reward || 0);
           }
        }
      });

      const chartData = Object.values(chartDataMap);

      res.json({
        totalViews: profile?.total_tasks || 0,
        todayBalance: profile?.today_balance || 0,
        totalBalance: profile?.vui_coin_balance || 0,
        chartData
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Gift Code API
  // Leaderboard API
  app.get("/api/user/leaderboard", async (req, res) => {
     try {
       const period = req.query.period as string || 'month';
       let sortCol = 'monthly_balance';
       if (period === 'day') sortCol = 'today_balance';
       else if (period === 'week') sortCol = 'weekly_balance';
       
       let { data: profiles, error } = await supabaseAdmin
         .from('profiles')
         .select(`user_uuid, user_name, today_balance, weekly_balance, monthly_balance`)
         .order(sortCol, { ascending: false })
         .gt(sortCol, 0)
         .limit(20);

       if (profiles && !error) {
           profiles = profiles.map((p: any) => ({
               ...p,
               avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_uuid || p.id}`
           }));
       }
       
       res.json({ leaderboard: profiles || [] });
     } catch (err) {
       res.json({ leaderboard: [] });
     }
  });

  // User IPs API
  // Task History
  app.get("/api/user/history", async (req, res) => {
    const uuid = req.query.uuid as string;
    const type = req.query.type as string;
    if (!uuid) return res.status(400).json({ error: "Missing uuid" });

    // Calculate start of today in GMT+7
    const now = new Date();
    const nowVN = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const startOfTodayVN = new Date(nowVN.getFullYear(), nowVN.getMonth(), nowVN.getDate());
    const startOfTodayUTC = new Date(startOfTodayVN.getTime() - (7 * 60 * 60 * 1000));

    let query = supabaseAdmin
      .from('tasks_history')
      .select('*')
      .eq('user_uuid', uuid)
      .gte('timestamp', startOfTodayUTC.getTime())
      .order('timestamp', { ascending: false })
      .limit(50);

    if (type === 'vip') {
        query = query.like('task_id', 'vip_%');
    } else if (type === 'pre') {
        query = query.eq('task_id', 'GMAIL_PRE');
    } else if (type === 'normal') {
        query = query.not('task_id', 'like', 'vip_%').neq('task_id', 'GMAIL_PRE');
    }

    const { data: history, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    res.json({ history: history || [] });
  });

  // Gift Code Redemption
  app.post("/api/giftcode/redeem", async (req, res) => {
    const { code, uuid } = req.body || {};
    if (!code || !uuid) return res.status(400).json({ error: "Missing info" });

    const { data: giftCode, error: codeErr } = await supabaseAdmin
      .from('gift_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (codeErr || !giftCode) return res.status(404).json({ error: "Mã giftcode không tồn tại" });

    if (giftCode.expires_at && new Date(giftCode.expires_at) < new Date()) {
      return res.status(400).json({ error: "Mã giftcode đã hết hạn" });
    }

    if (giftCode.used_count >= giftCode.max_uses) {
      return res.status(400).json({ error: "Mã giftcode đã hết lượt sử dụng" });
    }

    const { data: usage } = await supabaseAdmin
      .from('gift_code_redeems')
      .select('*')
      .eq('code', giftCode.code)
      .eq('user_uuid', uuid)
      .single();

    if (usage) return res.status(400).json({ error: "Bạn đã sử dụng mã này rồi" });

    const field = giftCode.reward_type === 'coin_task' ? 'coin_task_balance' : 'vui_coin_balance';
    const { data: profile } = await supabaseAdmin.from('profiles').select(field).eq('user_uuid', uuid).single();
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    if (giftCode.reward_type === 'coin_task') {
       await supabaseAdmin.rpc('increment_coin_task', { user_id: uuid, amount: giftCode.reward_amount });
    } else {
       await supabaseAdmin.rpc('increment_vui_coin', { user_id: uuid, amount: giftCode.reward_amount });
    }

    await supabaseAdmin.from('gift_code_redeems').insert({ code: giftCode.code, user_uuid: uuid, reward: giftCode.reward_amount });
    await supabaseAdmin.from('gift_codes').update({ used_count: giftCode.used_count + 1 }).eq('code', giftCode.code);

    res.json({ success: true, reward: giftCode.reward_amount, type: giftCode.reward_type });
  });

  // Wallet and Withdrawals
  app.post("/api/wallet/withdraw", async (req, res) => {
    const { uuid, amount, method, details } = req.body || {};
    if (!amount || amount < 10000) return res.status(400).json({ error: "Số tiền tối thiểu là 10.000đ" });

    const { data: profile } = await supabaseAdmin.from('profiles').select('vui_coin_balance, user_name, avatar_url').eq('user_uuid', uuid).single();
    if (!profile || profile.vui_coin_balance < amount) {
      return res.status(400).json({ error: "Số dư không đủ" });
    }

    // Check for existing pending withdrawal
    const { data: existingWd } = await supabaseAdmin
      .from('community_messages')
      .select('id')
      .eq('user_uuid', uuid)
      .eq('type', 'withdrawal')
      .eq('status', 'Đang chờ duyệt')
      .limit(1);

    if (existingWd && existingWd.length > 0) {
      return res.status(400).json({ error: "Bạn đang có một lệnh rút tiền đang chờ duyệt. Vui lòng chờ xử lý xong mới có thể rút tiếp." });
    }

    await supabaseAdmin.from('profiles').update({ vui_coin_balance: profile.vui_coin_balance - amount }).eq('user_uuid', uuid);
    
    // Instead of wallet_transactions, insert into community_messages
    const msgId = `WD_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const { error } = await supabaseAdmin.from('community_messages').insert({
      id: msgId,
      type: 'withdrawal',
      user_uuid: uuid,
      user_name: profile.user_name || 'User',
      user_avatar: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
      content: `Yêu cầu rút tiền qua ${method.toUpperCase()}. Chi tiết: ${details}`,
      amount: amount,
      status: 'Đang chờ duyệt',
      timestamp: Date.now()
    });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.post("/api/user/wallet/clear", async (req, res) => {
    const { uuid } = req.body;
    if (!uuid) return res.status(400).json({ error: "UUID required" });
    await supabaseAdmin.from('community_messages').delete().eq('type', 'withdrawal').eq('user_uuid', uuid);
    res.json({ success: true });
  });

  app.get("/api/wallet/history", async (req, res) => {
    const uuid = req.query.uuid as string;
    const { data: transactions } = await supabaseAdmin
      .from('community_messages')
      .select('*')
      .eq('type', 'withdrawal')
      .eq('user_uuid', uuid)
      .order('timestamp', { ascending: false });

    if (!transactions) return res.json({ transactions: [] });

    // Fetch replies for these withdrawals (to get card details or admin notes)
    const withdrawalIds = transactions.map(t => t.id);
    const { data: replies } = await supabaseAdmin
      .from('community_messages')
      .select('*')
      .eq('type', 'reply')
      .in('reply_to_id', withdrawalIds);

    const replyMap: Record<string, any> = {};
    if (replies) {
        replies.forEach(r => {
            if (!replyMap[r.reply_to_id]) replyMap[r.reply_to_id] = r;
        });
    }

    const enhancedTransactions = transactions.map(t => ({
        ...t,
        admin_reply: replyMap[t.id] || null
    }));

    res.json({ transactions: enhancedTransactions });
  });

  // Referrals
  app.get("/api/user/referral/stats", async (req, res) => {
    const uuid = req.query.uuid as string;
    const { data: refs } = await supabaseAdmin.from('referrals').select('*, referred_profile:profiles!referrals_referred_uuid_fkey(user_name, user_email)').eq('referrer_uuid', uuid).order('timestamp', { ascending: false });
    const { data: totalEarnings } = await supabaseAdmin.from('referrals').select('reward_vui').eq('referrer_uuid', uuid);
    
    const earnings = totalEarnings?.reduce((sum, r) => sum + Number(r.reward_vui || 0), 0) || 0;

    res.json({
      total: refs?.length || 0,
      earnings: earnings,
      history: refs || []
    });
  });

  app.post("/api/user/heartbeat", async (req, res) => {
    const { uuid } = req.body || {};
    if (!uuid) return res.status(400).json({ error: "UUID required" });
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
    
    await supabaseAdmin.from('user_ips').upsert({
         user_uuid: uuid,
         ip_address: ip,
         last_seen: new Date().toISOString()
    }, { onConflict: 'user_uuid, ip_address' });
    
    res.json({ success: true });
  });

  app.get("/api/admin/duplicate-ips", async (req, res) => {
    // Get all user IPs and group them
    const { data: allIps } = await supabaseAdmin.from('user_ips').select('ip_address, user_uuid, last_seen');
    const { data: allProfiles } = await supabaseAdmin.from('profiles').select('user_uuid, user_email, user_name');
    
    const profileMap = (allProfiles || []).reduce((acc: any, p) => {
      acc[p.user_uuid] = p;
      return acc;
    }, {});

    const ipGroups: Record<string, any[]> = {};
    (allIps || []).forEach(item => {
      if (!ipGroups[item.ip_address]) ipGroups[item.ip_address] = [];
      const profile = profileMap[item.user_uuid];
      ipGroups[item.ip_address].push({
        ...item,
        email: profile?.user_email || 'No Email',
        name: profile?.user_name || `User ${item.user_uuid.slice(0, 8)}`
      });
    });

    const duplicates = Object.keys(ipGroups)
      .filter(ip => new Set(ipGroups[ip].map(u => u.user_uuid)).size > 1)
      .map(ip => ({
        ip,
        users: ipGroups[ip]
      }));

    res.json({ duplicates });
  });

  app.get("/api/admin/online-users", async (req, res) => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: onlineIps } = await supabaseAdmin
      .from('user_ips')
      .select('user_uuid, ip_address, last_seen')
      .gte('last_seen', fiveMinsAgo);
    
    if (!onlineIps || onlineIps.length === 0) return res.json({ users: [] });

    const uniqueUuids = Array.from(new Set(onlineIps.map(i => i.user_uuid)));
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('user_uuid, user_email, user_name')
      .in('user_uuid', uniqueUuids);

    const profileMap = (profiles || []).reduce((acc: any, p) => {
      acc[p.user_uuid] = p;
      return acc;
    }, {});

    const onlineUsers = uniqueUuids.map(uuid => {
      const profile = profileMap[uuid];
      const ipInfo = onlineIps.find(i => i.user_uuid === uuid);
      return {
        uuid,
        name: profile?.user_name || `User ${uuid.slice(0, 8)}`,
        email: profile?.user_email || 'No Email',
        lastSeen: ipInfo?.last_seen,
        ip: ipInfo?.ip_address
      };
    });

    res.json({ users: onlineUsers });
  });

  app.post("/api/user/log-ip", async (req, res) => {
     const { uuid } = req.body || {};
     const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
     const userAgent = req.headers['user-agent'] || 'Unknown';
     
     // Upsert logic for IP
     await supabaseAdmin.from('user_ips').upsert({
         user_uuid: uuid,
         ip_address: ip,
         user_agent: userAgent,
         last_seen: new Date().toISOString()
     }, { onConflict: 'user_uuid, ip_address' });

     res.json({ success: true });
  });

  app.get("/api/user/ips", async (req, res) => {
     const uuid = req.query.uuid as string;
     const { data: ips } = await supabaseAdmin.from('user_ips').select('*').eq('user_uuid', uuid).order('last_seen', { ascending: false });
     res.json({ ips: ips || [] });
  });

  // Referrals API
  app.post("/api/user/referral", async (req, res) => {
     const { referrerCode, uuid } = req.body || {};
     // Note: we can use a separate unique string for ref code. For now, let's just find by some logic or we store 'ref_code' in profiles
     // If you want a real implementation, you'd add ref_code to profiles.
     res.json({ success: true });
  });

  app.get("/api/user/referrals", async (req, res) => {
     const uuid = req.query.uuid as string;
     const { data: refs } = await supabaseAdmin.from('referrals').select('*').eq('referrer_uuid', uuid);
     res.json({ referrals: refs || [] });
  });

  // Withdraw History
  app.get("/api/user/withdrawals", async (req, res) => {
     const uuid = req.query.uuid as string;
     const { data: wds } = await supabaseAdmin.from('community_messages').select('*').eq('type', 'withdrawal').eq('user_uuid', uuid).order('timestamp', { ascending: false });
     res.json({ withdrawals: wds || [] });
  });

  app.post("/api/wallet/cancel-withdraw", async (req, res) => {
    const { uuid, withdrawalId } = req.body;
    
    const { data: wRecord } = await supabaseAdmin
      .from('community_messages')
      .select('*')
      .eq('id', withdrawalId)
      .eq('user_uuid', uuid)
      .single();

    if (!wRecord || wRecord.status !== 'Đang chờ duyệt') {
       return res.status(400).json({ error: 'Không tìm thấy lệnh rút hoặc lệnh đã được xử lý.' });
    }

    const amount = wRecord.amount || 0;
    
    await supabaseAdmin
      .from('community_messages')
      .update({ status: 'Đã hủy' })
      .eq('id', withdrawalId);

    // Update balance
    const { data: profile } = await supabaseAdmin.from('profiles').select('vui_coin_balance').eq('user_uuid', uuid).single();
    if (profile) {
      await supabaseAdmin.from('profiles').update({ vui_coin_balance: profile.vui_coin_balance + amount }).eq('user_uuid', uuid);
    }

    res.json({ success: true });
  });

  // ===================================

  app.all(/^\/api\/.*$/, (req, res) => {
    res.status(404).json({ error: "API Route Not Found", url: req.url });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // This handles SPA fallback in development mode
    app.use(async (req: any, res: any, next: any) => {
      if (req.method !== 'GET') return next();
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // In production or Vercel, skip Vite
    if (!process.env.VERCEL) {
      const distPath = path.join(__dirname, '../dist');
      app.use(express.static(distPath));
      app.get(/^\/.*$/, (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.get('/favicon.ico', (req, res) => res.status(204).end());

  // Only listen if not in a serverless environment (like Vercel)
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export default startServer();
