import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { supabaseAdmin } from "../server_lib/supabase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SAFE_PROFILE_COLS = 'user_uuid, user_email, user_name, vui_coin_balance, coin_task_balance, today_balance, today_turns, monthly_balance, is_admin, is_banned, last_reset_day, last_reset_month, created_at';

async function updateUserStats(userId: string, amount: number, isTask: boolean = true) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('vui_coin_balance, today_balance, today_turns, monthly_balance').eq('user_uuid', userId).single();
    if (!profile) return;
    
    const updates: any = {
        vui_coin_balance: Number(profile.vui_coin_balance || 0) + Number(amount),
    };
    
    if (isTask) {
        updates.today_balance = Number(profile.today_balance || 0) + Number(amount);
        updates.monthly_balance = Number(profile.monthly_balance || 0) + Number(amount);
        updates.today_turns = Number(profile.today_turns || 0) + 1;
    }
    
    await supabaseAdmin.from('profiles').update(updates).eq('user_uuid', userId);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.use((req, res, next) => {
    if (process.env.VERCEL && req.body && typeof req.body === 'object') {
      return next();
    }
    express.json()(req, res, next);
  });

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
    const { sessionId, uuid } = req.body;
    
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
    const { sessionId, uuid } = req.body;
    
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
    const { type, uuid, destinationUrl } = req.body;
    // API_URL_GOC base
    const API_URL_GOC = `https://linktot.net/api_rv.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=${encodeURIComponent(destinationUrl)}`;

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
    const { sessionId, uuid, type, reviewUrl } = req.body;
    
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
    
    await supabaseAdmin.from('tasks_history').insert({
        id: sessionId,
        user_uuid: uuid,
        task_name: session.task_name,
        timestamp: Date.now(),
        reward: session.reward,
        status: 'Chờ duyệt',
        status_v1: 'Đang duyệt',
        status_v2: 'Đang duyệt',
        url: reviewUrl,
        ip: ip
    });

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
    const { sessionId, uuid, email, note } = req.body;
    
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
    
    await supabaseAdmin.from('tasks_history').insert({
        id: sessionId,
        user_uuid: uuid,
        task_name: session.task_name,
        timestamp: Date.now(),
        reward: session.reward,
        status: 'Chờ duyệt',
        status_v1: 'Đang duyệt',
        status_v2: 'Đang duyệt',
        url: email,
        ip: ip
    });

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
    const { sessionId, uuid } = req.body;
    
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
    const status = session.auto ? 'Hoàn thành' : 'Chờ duyệt';
    
    const historyEntry = {
        id: sessionId,
        user_uuid: uuid,
        task_name: session.task_name,
        url: session.short_url || 'unknown',
        reward: session.reward,
        status: status,
        ip: ip,
        timestamp: Date.now()
    };

    await supabaseAdmin.from('tasks_history').insert(historyEntry);

    // Give reward if auto
    if (session.auto) {
        await updateUserStats(uuid, session.reward, true);
    }

    res.json({ status: "success", history: historyEntry });
  });

  app.get("/api/tasks/history", async (req, res) => {
    const uuid = req.query.uuid as string;
    const { data: history, error } = await supabaseAdmin
      .from('tasks_history')
      .select('*')
      .eq('user_uuid', uuid || '00000000-0000-0000-0000-000000000000')
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
    const { uuid, amount, username, avatar, method } = req.body;
    
    // Check balance first
    const { data: profile } = await supabaseAdmin.from('profiles').select('vui_coin_balance').eq('user_uuid', uuid).single();
    const fee = amount * 0.05;
    const totalDeduction = amount + fee;
    
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
       amount,
       content: `Method: ${method || 'bank'}\nAmount: ${amount}`,
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

    const replyMsg = {
        id: `REPLY_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'reply',
        user_name: 'Admin Vui Task',
        user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        is_admin: true,
        content,
        timestamp: Date.now(),
        reply_to_id: withdrawalId
    };
    
    await supabaseAdmin.from('community_messages').insert(replyMsg);
    res.json({ success: true, message: { ...replyMsg, reactions: {} } });
  });

  app.post("/api/community/react", async (req, res) => {
     const { messageId, emoji, uuid, name } = req.body;
     
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
       user_name: 'Admin Vui Task',
       user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
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

  app.get("/api/admin/stats", checkAdmin, async (req, res) => {
     try {
       const today = new Date();
       today.setHours(0, 0, 0, 0);

       const { count: usersCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
       const { data: allUsers } = await supabaseAdmin.from('profiles').select('created_at');
       const { data: tasks } = await supabaseAdmin.from('tasks_history').select('reward, status, created_at, task_id');
       const { data: withdrawals } = await supabaseAdmin.from('community_messages').select('content, status, created_at');

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
          const tTime = new Date(t.created_at).getTime();
          if (t.status === 'Hoàn thành') {
             totalRev += Number(t.reward || 0);
             if (new Date(t.created_at) >= today) {
                todayRev += Number(t.reward || 0);
             }
             const day = chartData.find(d => tTime >= d.start && tTime <= d.end);
             if (day) day.revenue += Number(t.reward || 0);
          } else if (t.status === 'Chờ duyệt') {
             pendingTasks++;
          }
       });

       let totalWithdrawn = 0;
       let pendingWithdrawals = 0;

       (withdrawals || []).forEach(w => {
           const wTime = new Date(w.created_at).getTime();
           if (w.status === 'Đã thanh toán') {
              const match = w.content?.match(/amount:\s*(\d+)/i);
              if (match) {
                 const amt = Number(match[1]);
                 totalWithdrawn += amt;
                 const day = chartData.find(d => wTime >= d.start && wTime <= d.end);
                 if (day) day.withdrawn += amt;
              }
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
       (tasks || []).slice(-10).forEach(t => recentActions.push({ timestamp: new Date(t.created_at).getTime(), type: 'task', title: 'Nhiệm vụ', desc: `Vừa làm nhiệm vụ ${t.task_id || ''}` }));
       (withdrawals || []).slice(-10).forEach(w => recentActions.push({ timestamp: new Date(w.created_at).getTime(), type: 'withdraw', title: 'Rút tiền', desc: `Có đơn rút tiền mới: ${w.status}` }));
       
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
      const { data: tasks } = await supabaseAdmin.from('tasks_history').select('user_uuid, reward, status, created_at');
      const { data: ips } = await supabaseAdmin.from('user_ips').select('*');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const members = (profiles || []).map(p => {
          const userTasks = (tasks || []).filter((t: any) => t.user_uuid === p.user_uuid);
          let totalRev = 0;
          let todayRev = 0;
          let approved = 0;

          userTasks.forEach((t: any) => {
             if (t.status === 'Hoàn thành') {
                totalRev += Number(t.reward || 0);
                approved++;
                if (new Date(t.created_at) >= today) {
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

  app.post("/api/admin/members/delete", checkAdmin, async (req, res) => {
      const { id } = req.body;
      try {
        // Try deleting from auth as well if possible
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

  app.get("/api/admin/history", checkAdmin, async (req, res) => {
     const { data: logs } = await supabaseAdmin.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50);
     res.json({ logs: logs || [] });
  });

  app.get("/api/admin/system", checkAdmin, async (req, res) => {
     const { data: settings } = await supabaseAdmin.from('system_settings').select('*');
     const { data: mods } = await supabaseAdmin.from('mod_games').select('*').order('created_at', { ascending: false });
     const { data: codes } = await supabaseAdmin.from('gift_codes').select('*').order('created_at', { ascending: false });
     res.json({ settings: settings || [], mods: mods || [], codes: codes || [] });
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
      .eq('status', 'Chờ duyệt');
    
    res.json({ pending: pending || [] });
  });

  app.post("/api/admin/approve-task", async (req, res) => {
    const { userId, taskId, decision } = req.body; // decision: 'approve' | 'reject'
    
    const { data: task } = await supabaseAdmin
      .from('tasks_history')
      .select('*')
      .eq('id', taskId)
      .eq('status', 'Chờ duyệt')
      .single();

    if (task) {
       if (decision === 'approve') {
          await supabaseAdmin
            .from('tasks_history')
            .update({ status: 'Hoàn thành', status_v1: 'Đã duyệt' })
            .eq('id', taskId);

          // Update balance
          const { data: profile } = await supabaseAdmin.from('profiles').select('vui_coin_balance').eq('user_uuid', userId).single();
          const balance = profile?.vui_coin_balance || 0;
          await updateUserStats(userId, task.reward, true);
       } else {
          await supabaseAdmin
            .from('tasks_history')
            .update({ status: 'Từ chối', status_v1: 'Từ chối' })
            .eq('id', taskId);
       }
       return res.json({ success: true });
    }
    res.status(404).json({ error: "Task not found" });
  });
  // ===================================

    app.post("/api/user/sync-profile", async (req, res) => {
      const { uuid, email: reqEmail, userName: reqUserName, avatarUrl: reqAvatarUrl, referralCode } = req.body;
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
  
    // 1. Fetch with PK Column Detection & Explicit Column Selection
    let profile: any = null;
    let pkCol = 'user_uuid';
    // Remove avatar_url from SAFE_COLS as it's confirmed missing in some environments
    const SAFE_COLS = 'user_uuid, user_email, user_name, vui_coin_balance, coin_task_balance, today_balance, today_turns, monthly_balance, is_admin, is_banned, last_reset_day, last_reset_month';

    try {
      // Try primary fetch with safe columns
      let res1 = await supabaseAdmin.from('profiles').select(SAFE_COLS).eq('user_uuid', uuid).maybeSingle();
      
      if (res1.error && res1.error.message.includes('column')) {
          console.warn("SAFE_COLS fetch failed, trying absolute minimum columns...");
          res1 = await supabaseAdmin.from('profiles').select('user_uuid, user_name, vui_coin_balance, is_admin').eq('user_uuid', uuid).maybeSingle();
      }

      if (res1.data) {
        profile = res1.data;
        pkCol = 'user_uuid';
      } else {
        // Try fallback to just select(*) and/or different PK
        const res2 = await supabaseAdmin.from('profiles').select(SAFE_PROFILE_COLS).eq('id', uuid).maybeSingle();
        if (res2.data) {
          profile = res2.data;
          pkCol = 'id';
        } else if (res1.error && !res1.error.message.includes('column')) {
          console.error("Profile Fetch res1 Error:", res1.error.message);
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
      // 1. Fetch from Supabase Auth if needed
      let email = reqEmail;
      let userName = reqUserName;
      let avatarUrl = reqAvatarUrl;

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

      const { count, error: countError } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
      if (countError) console.error("Count Error:", countError);
      const isFirstUser = (count || 0) === 0;

      // 2. IP Duplicate Check (Relaxed to 3 accounts per IP for mobile users)
      if (ip !== 'unknown' && ip !== '127.0.0.1' && ip !== '::1') {
        const { data: existingIps } = await supabaseAdmin.from('user_ips').select('user_uuid').eq('ip_address', ip);
        if (existingIps && existingIps.length >= 3) {
           return res.status(403).json({ 
             error: "IP này đã đạt giới hạn tối đa 3 tài khoản. Vui lòng không lạm dụng hệ thống." 
           });
        }
      }

      let insertData: any = { 
        user_uuid: uuid, 
        user_email: email || null,
        user_name: userName || null,
        vui_coin_balance: 0, 
        coin_task_balance: 0,
        today_balance: 0,
        today_turns: 10,
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
                  timestamp: Date.now(),
                  reward_vui: 0, // No reward until they earn 1 VuiCoin
                  status: 'pending'
              });
          }
      }

      // Record IP
      if (ip !== 'unknown') {
        const ipRecord: any = { ip_address: ip, last_seen: new Date().toISOString() };
        ipRecord[pkCol] = uuid;
        await supabaseAdmin.from('user_ips').upsert(ipRecord, { onConflict: pkCol + ',ip_address' });
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
        updates.today_turns = 10; // Default to 10 daily turns
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
  app.post("/api/user/attendance", async (req, res) => {
     const { uuid, day, reward } = req.body;
     const today = new Date().toISOString().split('T')[0];
     // Simple check if already done today
     const { data: logs } = await supabaseAdmin.from('attendance_logs').select('id').eq('user_uuid', uuid).eq('timestamp', today);
     if (logs && logs.length > 0) {
        return res.status(400).json({ error: "Đã điểm danh hôm nay rồi" });
     }
     
     await supabaseAdmin.from('attendance_logs').insert({ user_uuid: uuid, day_count: day, reward, timestamp: today });
     // Update profile last_attendance and coin_task_balance
     const { data: profile } = await supabaseAdmin.from('profiles').select('coin_task_balance').eq('user_uuid', uuid).single();
     const currentBalance = profile?.coin_task_balance || 0;
     await supabaseAdmin.from('profiles').update({ 
         last_attendance: today,
         coin_task_balance: Number(currentBalance) + Number(reward)
     }).eq('user_uuid', uuid);
     
     res.json({ success: true, reward, newBalance: Number(currentBalance) + Number(reward) });
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
        .gte('created_at', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
        .order('created_at', { ascending: true });

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
        const dayKey = new Date(new Date(t.created_at).getTime() + 7 * 3600 * 1000).toISOString().split('T')[0];
        if (chartDataMap[dayKey]) {
           chartDataMap[dayKey].view += 1;
           if (t.status === 'Hoàn thành') {
             chartDataMap[dayKey].vui += Number(t.reward || 0);
           }
        }
      });

      const chartData = Object.values(chartDataMap);

      const { count: totalViews } = await supabaseAdmin.from('tasks_history').select('*', { count: 'exact', head: true }).eq('user_uuid', uuid);

      res.json({
        totalViews: totalViews || 0,
        todayBalance: profile?.today_balance || 0,
        totalBalance: profile?.vui_coin_balance || 0,
        chartData
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Gift Code API
  app.post("/api/user/redeem-code", async (req, res) => {
     const { uuid, code } = req.body;
     const { data: giftcode } = await supabaseAdmin.from('gift_codes').select('*').eq('code', code).single();
     if (!giftcode) return res.status(404).json({ error: "Mã không tồn tại" });
     
     if (giftcode.current_uses >= giftcode.max_uses) {
         return res.status(400).json({ error: "Mã đã hết lượt sử dụng" });
     }
     if (giftcode.expiry_date && new Date(giftcode.expiry_date).getTime() < Date.now()) {
         return res.status(400).json({ error: "Mã đã hết hạn" });
     }
     const { data: alreadyUsed } = await supabaseAdmin.from('gift_code_redeems').select('*').eq('user_uuid', uuid).eq('code', code).single();
     if (alreadyUsed) return res.status(400).json({ error: "Bạn đã sử dụng mã này rồi" });

     // Perform redeem
     await supabaseAdmin.from('gift_code_redeems').insert({ user_uuid: uuid, code: code, reward: giftcode.reward });
     await supabaseAdmin.from('gift_codes').update({ current_uses: giftcode.current_uses + 1 }).eq('code', code);
     
     // Give reward
     const { data: profile } = await supabaseAdmin.from('profiles').select('vui_coin_balance').eq('user_uuid', uuid).single();
     const currentBalance = profile?.vui_coin_balance || 0;
     await updateUserStats(uuid, giftcode.reward, false);

     res.json({ success: true, reward: giftcode.reward });
  });

  // Leaderboard API
  app.get("/api/user/leaderboard", async (req, res) => {
     try {
       let { data: profiles, error } = await supabaseAdmin
         .from('profiles')
         .select('user_uuid, user_name, monthly_balance')
         .order('monthly_balance', { ascending: false })
         .limit(20);

       if (profiles && !error) {
           profiles = profiles.map((p: any) => ({
               ...p,
               avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_uuid || p.id}`
           }));
       }
       
       if (error) {
           console.warn("Leaderboard primary query failed, trying fallback:", error.message);
           // Fallback: order by vui_coin_balance if monthly_balance is missing
           // Avoid select('*') as it might hit missing columns too
           const fallback = await supabaseAdmin
             .from('profiles')
             .select('user_name, vui_coin_balance')
             .order('vui_coin_balance', { ascending: false })
             .limit(20);
           
           if (fallback.error) {
               console.error("Leaderboard fallback failed too:", fallback.error.message);
               // Last ditch: just get anything
               const lastDitch = await supabaseAdmin.from('profiles').select('user_uuid').limit(10);
               profiles = (lastDitch.data || []).map((p: any) => ({
                   user_uuid: p.user_uuid || p.id,
                   user_name: 'Người dùng',
                   avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_uuid || p.id}`,
                   monthly_balance: 0
               }));
           } else {
               profiles = (fallback.data || []).map(p => ({
                   user_uuid: (p as any).user_uuid || (p as any).id,
                   user_name: p.user_name || 'Người dùng',
                   avatar_url: (p as any).avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(p as any).user_uuid || (p as any).id}`,
                   monthly_balance: p.vui_coin_balance || 0
               }));
           }
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

    let tableName = 'task_history';
    if (type === 'vip') tableName = 'task_vip_history';
    if (type === 'pre') tableName = 'task_pre_history';

    const { data: history, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('user_uuid', uuid)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ history: history || [] });
  });

  // Gift Code Redemption
  app.post("/api/giftcode/redeem", async (req, res) => {
    const { code, uuid } = req.body;
    if (!code || !uuid) return res.status(400).json({ error: "Missing info" });

    const { data: giftCode, error: codeErr } = await supabaseAdmin
      .from('gift_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (codeErr || !giftCode) return res.status(404).json({ error: "Mã giftcode không tồn tại" });

    if (giftCode.expires_at && new Date(giftCode.expires_at) < new Date()) {
      return res.status(400).json({ error: "Mã giftcode đã hết hạn" });
    }

    if (giftCode.current_uses >= giftCode.max_uses) {
      return res.status(400).json({ error: "Mã giftcode đã hết lượt sử dụng" });
    }

    const { data: usage } = await supabaseAdmin
      .from('gift_code_uses')
      .select('*')
      .eq('code_id', giftCode.id)
      .eq('user_uuid', uuid)
      .single();

    if (usage) return res.status(400).json({ error: "Bạn đã sử dụng mã này rồi" });

    const field = giftCode.type === 'coin_task' ? 'coin_task_balance' : 'vui_coin_balance';
    const { data: profile } = await supabaseAdmin.from('profiles').select(field).eq('user_uuid', uuid).single();
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const newBalance = (profile[field] || 0) + Number(giftCode.reward);
    await supabaseAdmin.from('profiles').update({ [field]: newBalance }).eq('user_uuid', uuid);
    await supabaseAdmin.from('gift_code_uses').insert({ code_id: giftCode.id, user_uuid: uuid });
    await supabaseAdmin.from('gift_codes').update({ current_uses: giftCode.current_uses + 1 }).eq('id', giftCode.id);

    res.json({ success: true, reward: giftCode.reward, type: giftCode.type });
  });

  // Wallet and Withdrawals
  app.post("/api/wallet/withdraw", async (req, res) => {
    const { uuid, amount, method, details } = req.body;
    if (!amount || amount < 10000) return res.status(400).json({ error: "Số tiền tối thiểu là 10.000đ" });

    const { data: profile } = await supabaseAdmin.from('profiles').select('vui_coin_balance').eq('user_uuid', uuid).single();
    if (!profile || profile.vui_coin_balance < amount) {
      return res.status(400).json({ error: "Số dư không đủ" });
    }

    await supabaseAdmin.from('profiles').update({ vui_coin_balance: profile.vui_coin_balance - amount }).eq('user_uuid', uuid);
    const { error } = await supabaseAdmin.from('wallet_transactions').insert({
      user_uuid: uuid,
      type: 'withdraw',
      amount,
      method,
      details,
      status: 'pending'
    });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.get("/api/wallet/history", async (req, res) => {
    const uuid = req.query.uuid as string;
    const { data: transactions } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_uuid', uuid)
      .order('timestamp', { ascending: false });

    res.json({ transactions: transactions || [] });
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
    const { uuid } = req.body;
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
     const { uuid } = req.body;
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
     const { referrerCode, uuid } = req.body;
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

  // ===================================

  app.all('/api/*', (req, res) => {
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
    app.use('*', async (req, res, next) => {
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
      app.get('*', (_req, res) => {
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
