import TelegramBot from 'node-telegram-bot-api';
import { supabaseAdmin } from './supabase.js';

const token = process.env.TELEGRAM_TASK_BOT_TOKEN || '8779964754:AAGb6SsR9jWwc4209l02CI56M5q6qCAgIfo';

let bot: TelegramBot | null = null;
const userStates = new Map<number, { step: string, data?: any }>();
const linkedAccounts = new Map<number, any>();

const TASKS = [
    { id: 'link4m', name: 'LINK4M', maxViews: 2, reward: 300, auto: true, apiUrl: 'https://link4m.co/api-shorten/v2?api=68208afab6b8fc60542289b6&url=' },
    { id: 'utl4', name: 'UTL 3 STEP', maxViews: 999, reward: 453, auto: true, apiUrl: 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=4&url=' },
    { id: 'utl3', name: 'UTL 2 STEP', maxViews: 999, reward: 385, auto: true, apiUrl: 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=3&url=' },
    { id: 'utl2', name: 'UTL 1 STEP', maxViews: 999, reward: 349, auto: true, apiUrl: 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=2&url=' },
    { id: 'linktot', name: 'LINKTOT', maxViews: 4, reward: 400, auto: true, apiUrl: 'https://linktot.net/JSON_QL_API.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=' },
    { id: 'timmap', name: 'TIMMAP', maxViews: 2, reward: 200, auto: true, apiUrl: 'https://linktot.net/api_timmap_pt.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=' },
    { id: 'bbmkts', name: 'BBMKTS', maxViews: 1, reward: 300, auto: false, apiUrl: 'https://bbmkts.com/dapi?token=d285ce6c761cc5961316783a&longurl=' },
    { id: 'layma', name: 'LAYMA', maxViews: 2, reward: 200, auto: true, apiUrl: 'https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=de2c099a8fd17d1cc6c7068209e5fa5d&format=json&url=' },
    { id: 'vip_map', name: 'VIP MAP', maxViews: 999, reward: 1200, auto: false, apiUrl: 'https://linktot.net/api_rv.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=' },
    { id: 'vip_trip', name: 'VIP TRIP', maxViews: 999, reward: 2900, auto: false, apiUrl: 'https://linktot.net/api_rv.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=' },
];

function getMenuKeyboard(isAdmin = false) {
    const keyboard: any[][] = [
        [{ text: '🎯 LÀM NHIỆM VỤ' }],
        [{ text: '💰 VÍ & RÚT TIỀN' }, { text: '👤 XEM TÀI KHOẢN' }],
        [{ text: '🏆 XẾP HẠNG' }, { text: '🤝 GIỚI THIỆU BẠN BÈ' }],
        [{ text: '📜 LỊCH SỬ LÀM NV' }, { text: '📜 LỊCH SỬ RÚT TIỀN' }],
        [{ text: '💬 THAM GIA NHÓM CHAT' }, { text: '🌐 TRUY CẬP WEBSITE' }]
    ];

    if (isAdmin) {
        keyboard.push([{ text: '📢 THÔNG BÁO CỦA ADMIN' }]);
        keyboard.push([{ text: '📊 THỐNG KÊ BOT (ADMIN)' }]);
        keyboard.push([{ text: '⚙️ DUYỆT NHIỆM VỤ (ADMIN)' }, { text: '⚙️ DUYỆT RÚT (ADMIN)' }]);
        keyboard.push([{ text: '📜 LỊCH SỬ DUYỆT (ADMIN)' }]);
    }

    return {
        reply_markup: {
            keyboard,
            resize_keyboard: true
        }
    };
}

export function setupTelegramBot() {
    if (!token) return;

    bot = new TelegramBot(token, { polling: true });

    bot.onText(/\/start(.*)/, (msg, match) => {
        const chatId = msg.chat.id;
        userStates.delete(chatId);
        const currentUser = linkedAccounts.get(chatId);
        
        const payload = match?.[1]?.trim();
        
        if (!currentUser) {
            userStates.set(chatId, { step: 'WAIT_FOR_AUTH_ACTION', data: { pendingPayload: payload } });
            bot?.sendMessage(chatId, 'Chào mừng bạn đến với <b>VuiTask Bot!</b>\n\nVui lòng chọn một trong các tùy chọn dưới đây để tiếp tục:', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔑 ĐĂNG NHẬP', callback_data: 'auth_login' }],
                        [{ text: '📝 ĐĂNG KÝ', callback_data: 'auth_register' }]
                    ]
                }
            });
            return;
        }

        bot?.sendMessage(chatId, 'Chào mừng bạn đến với VuiTask Bot! Vui lòng chọn chức năng dưới đây:', getMenuKeyboard(currentUser.is_admin));
        
        // Handle payload if exists
        if (payload && payload.startsWith('task_')) {
            handleTaskCreation(chatId, payload.replace('task_', ''), currentUser);
        }
    });

    async function handleTaskCreation(chatId: number, taskId: string, currentUser: any) {
        const task = TASKS.find(t => t.id === taskId);
        if (!task) return;

        bot?.sendMessage(chatId, `Đang tạo liên kết nhiệm vụ ${task.name}...`);

        try {
            // Determine max views
            let maxViews = task.maxViews;
            const msVN = Date.now() + 7 * 3600 * 1000;
            const vnDateStr = new Date(msVN).toISOString().split('T')[0]; 
            const midnightVN = new Date(`${vnDateStr}T00:00:00.000Z`).getTime() - 7 * 3600 * 1000;

            const { data: historyData } = await supabaseAdmin
                .from('tasks_history')
                .select('id')
                .eq('task_id', task.id)
                .gte('timestamp', midnightVN)
                .eq('user_uuid', currentUser.user_uuid);

            if (historyData && historyData.length >= maxViews) {
                bot?.sendMessage(chatId, `❌ Bạn đã hết lượt làm nhiệm vụ ${task.name} hôm nay.`);
                return;
            }

            // Create session
            const sessionId = `ORDER_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            await supabaseAdmin.from('sessions').insert({
                id: sessionId,
                user_uuid: currentUser.user_uuid,
                task_id: task.id,
                task_name: task.name,
                reward: task.reward,
                auto: task.auto,
                expires: Date.now() + 15 * 60 * 1000,
                completed: false,
                short_url: '',
                fingerprint: `bot_${chatId}`
            });

            const verifyPage = taskId.startsWith('vip_') ? 'verifytaskpro' : 'verifytask';
            const destinationUrl = `https://www.vuitask.online/${verifyPage}?code=${sessionId}&uuid=${currentUser.user_uuid}`;
            const apiRequestUrl = task.apiUrl + encodeURIComponent(destinationUrl);

            // Fetch shortlink from provider directly
            const response = await fetch(apiRequestUrl);
            const text = await response.text();
            
            let linkPath = "";
            
            try {
                const parsed = JSON.parse(text);
                linkPath = parsed.shortenedUrl || parsed.url || parsed.bbmktsUrl || parsed.short_url || parsed.data?.short_url || parsed.data?.url || parsed.data || parsed.result || "";
            } catch (e) {}

            if (!linkPath && text.includes("http")) { // Basic check
                const urls = text.match(/https?:\/\/[^\s"']+/g);
                if (urls && urls.length > 0) {
                    if (task.id === 'bbmkts') {
                        const bUrl = urls.find(u => u.includes('bbmkts.com'));
                        linkPath = bUrl ? bUrl : urls[0];
                    } else {
                        linkPath = urls[urls.length - 1]; // Often the last URL
                    }
                }
            }

            if (!linkPath || !linkPath.startsWith('http')) {
                linkPath = text.trim();
            }

            if (!linkPath.startsWith('http')) {
                 bot?.sendMessage(chatId, `❌ Đã có lỗi xảy ra khi lấy link từ ${task.name}. Vui lòng thử lại sau. (Chi tiết: ${text.substring(0, 50)})`);
                 return;
            }

             await supabaseAdmin.from('sessions').update({ short_url: linkPath }).eq('id', sessionId);

             bot?.sendMessage(chatId, `✅ <b>Nhiệm vụ ${task.name} đã sẵn sàng!</b>\n\n🔗 Nhấn vào link sau để thực hiện:\n${linkPath}\n\n👉 <i>Sau khi vượt link xong, hệ thống sẽ tự động cộng tiền (Nhiệm vụ Duyệt Tự động) hoặc bạn cần chờ admin duyệt (Nhiệm vụ Thủ công).</i>`, { parse_mode: 'HTML', disable_web_page_preview: true });

        } catch (err) {
             bot?.sendMessage(chatId, `❌ Đã có lỗi xảy ra. Hãy chắc chắn bạn đã thử lại.`);
        }
    }

    bot.on('callback_query', async (query) => {
        if (!query.data || !bot) return;
        const chatId = query.message?.chat.id;
        if (!chatId) return;

        if (query.data === 'auth_login') {
            const state = userStates.get(chatId);
            userStates.set(chatId, { step: 'WAIT_FOR_LOGIN_CREDS', data: state?.data });
            bot.sendMessage(chatId, 'Vui lòng cung cấp thông tin đăng nhập của bạn (Email và Mật khẩu) cách nhau bởi dấu cách.\n\n(Ví dụ: `email@gmail.com 123456`)', { parse_mode: 'Markdown' });
            return;
        }

        if (query.data === 'auth_register') {
            const state = userStates.get(chatId);
            userStates.set(chatId, { step: 'WAIT_FOR_REGISTER_CREDS', data: state?.data });
            bot.sendMessage(chatId, 'Vui lòng cung cấp email và mật khẩu mới để tạo tài khoản.\n\n(Ví dụ: `email@gmail.com 123456`)', { parse_mode: 'Markdown' });
            return;
        }

        const currentUser = linkedAccounts.get(chatId);
        if (!currentUser) {
            bot.sendMessage(chatId, 'Vui lòng gõ /start để đăng nhập.');
            return;
        }

        if (query.data === 'wallet_withdraw') {
            userStates.set(chatId, { step: 'WAIT_FOR_WITHDRAW_AMOUNT' });
            bot.sendMessage(chatId, '💰 <b>RÚT TIỀN</b>\n━━━━━━━━━━━━━━\nVui lòng nhập số tiền bạn muốn rút (tối thiểu 20,000 VuiCoin):', { parse_mode: 'HTML' });
            return;
        }

        if (query.data === 'wallet_info') {
            userStates.set(chatId, { step: 'WAIT_FOR_PROFILE_NAME' });
            bot.sendMessage(chatId, '👤 <b>CẬP NHẬT THÔNG TIN</b>\n━━━━━━━━━━━━━━\nVui lòng nhập <b>Họ và Tên</b> của bạn để admin tiện đối soát khi rút tiền:', { parse_mode: 'HTML' });
            return;
        }

        if (query.data.startsWith('task_')) {
            const taskId = query.data.replace('task_', '');
            const task = TASKS.find(t => t.id === taskId);
            if (!task) return;

            bot.sendMessage(chatId, `Đang tạo liên kết nhiệm vụ ${task.name}...`);

            try {
                // Determine max views
                let maxViews = task.maxViews;
                const msVN = Date.now() + 7 * 3600 * 1000;
                const vnDateStr = new Date(msVN).toISOString().split('T')[0]; 
                const midnightVN = new Date(`${vnDateStr}T00:00:00.000Z`).getTime() - 7 * 3600 * 1000;

                const { data: historyData } = await supabaseAdmin
                    .from('tasks_history')
                    .select('id')
                    .eq('task_id', task.id)
                    .gte('timestamp', midnightVN)
                    .eq('user_uuid', currentUser.user_uuid);

                if (historyData && historyData.length >= maxViews) {
                    bot.sendMessage(chatId, `❌ Bạn đã hết lượt làm nhiệm vụ ${task.name} hôm nay.`);
                    return;
                }

                // Create session
                const sessionId = `ORDER_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                await supabaseAdmin.from('sessions').insert({
                    id: sessionId,
                    user_uuid: currentUser.user_uuid,
                    task_id: task.id,
                    task_name: task.name,
                    reward: task.reward,
                    auto: task.auto,
                    expires: Date.now() + 15 * 60 * 1000,
                    completed: false,
                    short_url: '',
                    fingerprint: `bot_${chatId}`
                });

                const verifyPage = taskId.startsWith('vip_') ? 'verifytaskpro' : 'verifytask';
                const destinationUrl = `https://www.vuitask.online/${verifyPage}?code=${sessionId}&uuid=${currentUser.user_uuid}`;
                const apiRequestUrl = task.apiUrl + encodeURIComponent(destinationUrl);

                // Fetch shortlink from provider directly
                const response = await fetch(apiRequestUrl);
                const text = await response.text();
                
                let linkPath = "";
                
                try {
                    const parsed = JSON.parse(text);
                    linkPath = parsed.shortenedUrl || parsed.url || parsed.bbmktsUrl || parsed.short_url || parsed.data?.short_url || parsed.data?.url || parsed.data || parsed.result || "";
                } catch (e) {}

                if (!linkPath && text.includes("http")) { // Basic check
                    const urls = text.match(/https?:\/\/[^\s"']+/g);
                    if (urls && urls.length > 0) {
                        if (task.id === 'bbmkts') {
                            const bUrl = urls.find(u => u.includes('bbmkts.com'));
                            linkPath = bUrl ? bUrl : urls[0];
                        } else {
                            linkPath = urls[urls.length - 1]; // Often the last URL
                        }
                    }
                }

                if (!linkPath || !linkPath.startsWith('http')) {
                    linkPath = text.trim();
                }

                if (!linkPath.startsWith('http')) {
                     bot.sendMessage(chatId, `❌ Đã có lỗi xảy ra khi lấy link từ ${task.name}. Vui lòng thử lại sau. (Chi tiết: ${text.substring(0, 50)})`);
                     return;
                }

                 await supabaseAdmin.from('sessions').update({ short_url: linkPath }).eq('id', sessionId);

                 bot.sendMessage(chatId, `✅ <b>Nhiệm vụ ${task.name} đã sẵn sàng!</b>\n\n🔗 Nhấn vào link sau để thực hiện:\n${linkPath}\n\n👉 <i>Sau khi vượt link xong, hệ thống sẽ tự động cộng tiền (Nhiệm vụ Duyệt Tự động) hoặc bạn cần chờ admin duyệt (Nhiệm vụ Thủ công).</i>`, { parse_mode: 'HTML', disable_web_page_preview: true });

            } catch (err) {
                 bot.sendMessage(chatId, `❌ Đã có lỗi xảy ra. Hãy chắc chắn bạn đã thử lại.`);
            }
        }
    });

    bot.on('message', async (msg) => {
        if (!msg.text || msg.text === '/start' || msg.text.startsWith('/login')) return;
        const chatId = msg.chat.id;
        const text = msg.text;

        const state = userStates.get(chatId);
        
        let currentUser = linkedAccounts.get(chatId);
        
        // Refresh user profile if linked
        if (currentUser) {
            const { data } = await supabaseAdmin.from('profiles').select('*').eq('user_uuid', currentUser.user_uuid).maybeSingle();
            if (data) {
                currentUser = data;
                linkedAccounts.set(chatId, data);
            }
        }

        try {
            // -- Handle States --
            if (!currentUser && (state?.step === 'WAIT_FOR_LOGIN_CREDS' || state?.step === 'WAIT_FOR_REGISTER_CREDS')) {
                const parts = text.trim().split(' ');
                if (parts.length < 2) {
                    bot?.sendMessage(chatId, '❌ Định dạng không hợp lệ. Gõ:\n`Email MậtKhẩu`\n(Ví dụ: `abc@gmail.com 123456`)', { parse_mode: 'Markdown' });
                    return;
                }
                const email = parts[0];
                const password = parts[1];
                
                const pendingPayload = state?.data?.pendingPayload;
                // If payload is not a task, treat it as a referral code
                const referralCode = (pendingPayload && !pendingPayload.startsWith('task_')) ? pendingPayload : null;

                // Check existing account via profiles table
                const { data: existingProfile } = await supabaseAdmin.from('profiles').select('*').eq('user_email', email).maybeSingle();
                
                if (state.step === 'WAIT_FOR_LOGIN_CREDS') {
                    if (existingProfile) {
                         const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(existingProfile.user_uuid);
                         if (authError || !authData.user) {
                              bot?.sendMessage(chatId, `❌ Mật khẩu hoặc email không chính xác.`);
                              return;
                         }
                          const { error: updateErr } = await supabaseAdmin.from('profiles').update({ telegram_chat_id: String(chatId) }).eq('user_uuid', existingProfile.user_uuid);
                          linkedAccounts.set(chatId, { ...existingProfile, telegram_chat_id: String(chatId) });
                          const pendingPayload = state?.data?.pendingPayload;
                          userStates.delete(chatId);
                          bot?.sendMessage(chatId, `✅ Đã đăng nhập vào tài khoản: ${existingProfile.user_email}`, getMenuKeyboard(existingProfile.is_admin));
                          if (pendingPayload && pendingPayload.startsWith('task_')) {
                              handleTaskCreation(chatId, pendingPayload.replace('task_', ''), existingProfile);
                          }
                    } else {
                        bot?.sendMessage(chatId, `❌ Tài khoản không tồn tại. Vui lòng gõ /start để đăng ký.`);
                    }
                } else if (state.step === 'WAIT_FOR_REGISTER_CREDS') {
                    if (existingProfile) {
                        bot?.sendMessage(chatId, `❌ Email đã tồn tại. Vui lòng gõ /start để đăng nhập.`);
                    } else {
                        bot?.sendMessage(chatId, `⏳ Đang tạo tài khoản mới...`);
                        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                             email,
                             password,
                             email_confirm: true
                        });
                        
                        if (createError) {
                            bot?.sendMessage(chatId, `❌ Lỗi tạo tài khoản: ${createError.message}`);
                            return;
                        }

                        if (newUser.user) {
                            const { data: p } = await supabaseAdmin.from('profiles').select('*').eq('user_uuid', newUser.user.id).maybeSingle();
                            if (p) {
                               await supabaseAdmin.from('profiles').update({ telegram_chat_id: String(chatId) }).eq('user_uuid', p.user_uuid);
                               linkedAccounts.set(chatId, { ...p, telegram_chat_id: String(chatId) });
                               const pendingPayload = state?.data?.pendingPayload;
                               userStates.delete(chatId);
                               bot?.sendMessage(chatId, `✅ Đăng ký và đăng nhập thành công: ${email}`, getMenuKeyboard(p.is_admin));
                               if (pendingPayload && pendingPayload.startsWith('task_')) {
                                   handleTaskCreation(chatId, pendingPayload.replace('task_', ''), p);
                               }
                            } else {
                                 await supabaseAdmin.from('profiles').insert({ user_uuid: newUser.user.id, user_email: email, vui_coin_balance: 0, coin_task_balance: 0 });
                                 const { data: p2 } = await supabaseAdmin.from('profiles').select('*').eq('user_uuid', newUser.user.id).single();
                                 linkedAccounts.set(chatId, { ...p2, telegram_chat_id: String(chatId) });
                                 const pendingPayload = state?.data?.pendingPayload;
                                 userStates.delete(chatId);
                                 
                                 if (referralCode) {
                                     const { data: referrers } = await supabaseAdmin.from('profiles').select('user_uuid').order('created_at', { ascending: true });
                                     const referrer = referrers?.find(rp => rp.user_uuid.startsWith(referralCode));
                                     if (referrer && referrer.user_uuid !== newUser.user.id) {
                                         await supabaseAdmin.from('referrals').insert({
                                             referrer_uuid: referrer.user_uuid,
                                             referred_uuid: newUser.user.id,
                                             reward: 2000, 
                                             status: 'pending'
                                         });
                                     }
                                 }
                                 bot?.sendMessage(chatId, `✅ Đăng ký và đăng nhập thành công: ${email}`, getMenuKeyboard());
                                 if (pendingPayload && pendingPayload.startsWith('task_')) {
                                     handleTaskCreation(chatId, pendingPayload.replace('task_', ''), p2);
                                 }
                            }
                        }
                    }
                }
                return;
            }

            if (state?.step === 'WAIT_FOR_PROFILE_NAME') {
                const fullName = text.trim();
                if (fullName.length < 2) {
                    bot?.sendMessage(chatId, '❌ Tên quá ngắn. Vui lòng nhập lại Họ và Tên:');
                    return;
                }

                const { error } = await supabaseAdmin.from('profiles').update({ user_name: fullName }).eq('user_uuid', currentUser.user_uuid);
                if (error) {
                    bot?.sendMessage(chatId, '❌ Lỗi khi cập nhật thông tin. Vui lòng thử lại.');
                } else {
                    bot?.sendMessage(chatId, `✅ Đã cập nhật tên: <b>${fullName}</b>`, { parse_mode: 'HTML', ...getMenuKeyboard(currentUser.is_admin) });
                    userStates.delete(chatId);
                }
                return;
            }

            if (!currentUser) {
                bot?.sendMessage(chatId, 'Vui lòng đăng nhập trước bằng lệnh /start');
                return;
            }

            if (state?.step === 'WAIT_FOR_WITHDRAW_AMOUNT') {
                const amount = parseInt(text.replace(/,/g, ''));
                if (isNaN(amount) || amount < 20000) {
                    bot?.sendMessage(chatId, '❌ Số tiền không hợp lệ. Tối thiểu là 20,000 VuiCoin. Vui lòng thử lại hoặc gõ /start để hủy.');
                    return;
                }
                if (!currentUser || currentUser.vui_coin_balance < amount) {
                    bot?.sendMessage(chatId, '❌ Số dư không đủ.');
                    userStates.delete(chatId);
                    return;
                }
                userStates.set(chatId, { step: 'WAIT_FOR_WITHDRAW_METHOD', data: { amount } });
                bot?.sendMessage(chatId, '🏦 Chọn phương thức rút tiền:\n1. ZaloPay\n2. Bank (Ngân hàng)\n3. Thẻ cào\n\nVui lòng gõ tên phương thức (vd: ZaloPay):');
                return;
            }
            if (state?.step === 'WAIT_FOR_WITHDRAW_METHOD') {
                const method = text.toLowerCase().trim();
                if (!['zalopay', 'zalo pay', 'bank', 'thẻ cào', 'the cao'].includes(method)) {
                    bot?.sendMessage(chatId, '❌ Phương thức không hợp lệ. Gõ ZaloPay, Bank, hoặc Thẻ cào.');
                    return;
                }
                userStates.set(chatId, { step: 'WAIT_FOR_WITHDRAW_DETAILS', data: { ...state.data, method: method === 'the cao' ? 'thẻ cào' : method } });
                bot?.sendMessage(chatId, `📝 Vui lòng nhập thông tin nhận tiền cho ${method.toUpperCase()} (Tên tài khoản, Số điện thoại/STK, Ngân hàng nếu có):`);
                return;
            }
            if (state?.step === 'WAIT_FOR_WITHDRAW_DETAILS') {
                const details = text.trim();
                const { amount, method } = state.data;
                const msgId = `WD_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                
                const fee = amount * 0.05;
                const netAmount = amount - fee;
                const adminMethod = method.toUpperCase() === 'THẺ CÀO' ? 'THE_CAO' : method.toUpperCase();
                
                await supabaseAdmin.from('profiles').update({ vui_coin_balance: currentUser.vui_coin_balance - amount }).eq('user_uuid', currentUser.user_uuid);
                
                const detailsJson = JSON.stringify({
                    accountNumber: details,
                    holderName: currentUser.user_name || 'User',
                    bankName: adminMethod === 'BANK' ? 'BANK' : adminMethod,
                    cardType: adminMethod === 'THE_CAO' ? 'THẺ CÀO' : adminMethod,
                    requestedAmount: amount
                });

                await supabaseAdmin.from('community_messages').insert({
                    id: msgId,
                    type: 'withdrawal',
                    user_uuid: currentUser.user_uuid,
                    user_name: currentUser.user_name || 'User',
                    user_avatar: currentUser.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
                    content: `Yêu cầu rút tiền qua ${adminMethod}. Chi tiết: ${detailsJson}`,
                    amount: netAmount,
                    status: 'Đang chờ duyệt',
                    timestamp: Date.now()
                });

                userStates.delete(chatId);
                bot?.sendMessage(chatId, `✅ Đã tạo lệnh rút ${amount.toLocaleString()} VuiCoin qua ${method.toUpperCase()}.\nThực nhận (sau phí 5%): ${netAmount.toLocaleString()} VuiCoin\nMã đơn: ${msgId}\nVui lòng chờ admin duyệt.`, getMenuKeyboard(currentUser.is_admin));
                
                // Notify via Telegram Group
                const { sendTelegramNotification } = await import('./telegram.js');
                
                // Mask email or uuid - Hide 2/3 as requested
                const rawUser = currentUser.user_email || currentUser.user_uuid;
                let maskedUser = '';
                if (rawUser.includes('@')) {
                    const [user, domain] = rawUser.split('@');
                    const showCount = Math.max(1, Math.floor(user.length / 3));
                    maskedUser = user.substring(0, showCount) + '*'.repeat(user.length - showCount) + '@' + domain;
                } else {
                    const showCount = Math.max(1, Math.floor(rawUser.length / 3));
                    maskedUser = rawUser.substring(0, showCount) + '*'.repeat(rawUser.length - showCount);
                }

                await sendTelegramNotification(`
🔔 <b>YÊU CẦU RÚT TIỀN MỚI</b>
━━━━━━━━━━━━━━━━━━
👤 User: <code>${maskedUser}</code>
💰 Số tiền: ${amount.toLocaleString()} VuiCoin
🏦 Phương thức: ${method.toUpperCase()}
👉 Bot hỗ trợ: @vuitaskonlinebotvuotlink_bot
`.trim());

                return;
            }
            // Admin states
            if (state?.step === 'WAIT_FOR_ADMIN_ANNOUNCEMENT') {
                const ann = text.trim();
                await supabaseAdmin.from('community_messages').insert({
                    id: `ann_${Date.now()}`,
                    type: 'message',
                    user_uuid: currentUser.user_uuid,
                    user_name: currentUser.user_name || 'Admin',
                    user_avatar: currentUser.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
                    content: `📢 THÔNG BÁO TỪ ADMIN: ${ann}`,
                    is_admin: true,
                    timestamp: Date.now()
                });
                bot?.sendMessage(chatId, '✅ Đã gửi thông báo lên hệ thống!', getMenuKeyboard(currentUser.is_admin));
                userStates.delete(chatId);
                return;
            }
            if (state?.step === 'WAIT_FOR_ADMIN_APPROVE_WD') {
                if (text.toLowerCase() === 'hủy') {
                    userStates.delete(chatId);
                    bot?.sendMessage(chatId, 'Đã hủy thao tác.', getMenuKeyboard(currentUser.is_admin));
                    return;
                }
                const [wdId, action] = text.split(' ');
                if (!wdId || !['duyet', 'tu_choi'].includes(action)) {
                    bot?.sendMessage(chatId, '❌ Cú pháp sai. Gõ: <ID Đơn> <duyet|tu_choi> hoặc Hủy.');
                    return;
                }

                const { data: wRecords } = await supabaseAdmin.from('community_messages').select('*').eq('id', wdId).eq('type', 'withdrawal').eq('status', 'Đang chờ duyệt');
                const wRecord = wRecords?.[0];
                if (!wRecord) {
                    bot?.sendMessage(chatId, '❌ Không tìm thấy đơn rút hoặc đơn đã được xử lý.');
                    return;
                }

                if (action === 'duyet') {
                    await supabaseAdmin.from('community_messages').update({ status: 'Đã thanh toán', admin_note: 'Approved', timestamp: Date.now() }).eq('id', wdId);
                    
                    // Approval history
                    await supabaseAdmin.from('approval_history').insert({
                        type: 'withdrawal',
                        original_id: wdId,
                        user_uuid: wRecord.user_uuid,
                        action: 'approve',
                        timestamp: Date.now(),
                        admin_note: 'Approved (via Bot)'
                    });

                    bot?.sendMessage(chatId, `✅ Đã DUYỆT đơn rút tiền ${wdId}.`);
                } else {
                    await supabaseAdmin.from('community_messages').update({ status: 'Từ chối', admin_note: 'Rejected', timestamp: Date.now() }).eq('id', wdId);
                    
                    // Approval history
                    await supabaseAdmin.from('approval_history').insert({
                        type: 'withdrawal',
                        original_id: wdId,
                        user_uuid: wRecord.user_uuid,
                        action: 'reject',
                        timestamp: Date.now(),
                        admin_note: 'Rejected (via Bot)'
                    });

                    // Refund (the total amount requested, which is not netAmount)
                    // Extract from JSON in content if possible
                    let requestedAmount = wRecord.amount;
                    try {
                        const jsonMatch = wRecord.content?.match(/Chi tiết: (\{.*\})/);
                        if (jsonMatch) {
                            const details = JSON.parse(jsonMatch[1]);
                            if (details.requestedAmount) requestedAmount = details.requestedAmount;
                        } else {
                            // Fallback to regex
                            const match = wRecord.content?.match(/Requested: (\d+)/);
                            if (match) requestedAmount = parseInt(match[1]);
                        }
                    } catch (e) {}

                    const { data: u } = await supabaseAdmin.from('profiles').select('vui_coin_balance').eq('user_uuid', wRecord.user_uuid).single();
                    if (u) {
                        await supabaseAdmin.from('profiles').update({ vui_coin_balance: Number(u.vui_coin_balance) + Number(requestedAmount) }).eq('user_uuid', wRecord.user_uuid);
                    }
                    bot?.sendMessage(chatId, `✅ Đã TỪ CHỐI đơn rút tiền ${wdId} và hoàn trả ${requestedAmount.toLocaleString()} VuiCoin.`);
                }
                userStates.delete(chatId);
                return;
            }

            if (state?.step.startsWith('WAIT_FOR_ADMIN_APPROVE_TASK')) {
                if (text.toLowerCase() === 'hủy') {
                    userStates.delete(chatId);
                    bot?.sendMessage(chatId, 'Đã hủy thao tác.', getMenuKeyboard(currentUser.is_admin));
                    return;
                }
                const [taskId, action] = text.split(' ');
                if (!taskId || !['duyet', 'tu_choi'].includes(action)) {
                    bot?.sendMessage(chatId, '❌ Cú pháp sai. Gõ: <ID Task> <duyet|tu_choi> hoặc Hủy.');
                    return;
                }

                const { data: tRecords } = await supabaseAdmin.from('tasks_history').select('*').eq('id', taskId).eq('status', 'Chờ duyệt');
                const task = tRecords?.[0];
                if (!task) {
                    bot?.sendMessage(chatId, '❌ Không tìm thấy nhiệm vụ hoặc đã được xử lý.');
                    return;
                }

                if (action === 'duyet') {
                    await supabaseAdmin.from('tasks_history').update({ status: 'Hoàn thành', admin_note: 'Approved', timestamp: Date.now() }).eq('id', taskId);
                    const { data: u } = await supabaseAdmin.from('profiles').select('vui_coin_balance').eq('user_uuid', task.user_uuid).single();
                    if (u) {
                        await supabaseAdmin.from('profiles').update({ vui_coin_balance: Number(u.vui_coin_balance) + Number(task.reward) }).eq('user_uuid', task.user_uuid);
                    }
                    bot?.sendMessage(chatId, `✅ Đã DUYỆT nhiệm vụ ${taskId}.`);
                } else {
                    await supabaseAdmin.from('tasks_history').update({ status: 'Từ chối', admin_note: 'Rejected', timestamp: Date.now() }).eq('id', taskId);
                    bot?.sendMessage(chatId, `✅ Đã TỪ CHỐI nhiệm vụ ${taskId}.`);
                }
                userStates.delete(chatId);
                return;
            }

            // -- Generic Menus --
            if (text === '🎯 LÀM NHIỆM VỤ') {
                let message = '📋 <b>DANH SÁCH NHIỆM VỤ HÔM NAY:</b>\n<i>Nhấn "Tạo Link API" để lấy link nhiệm vụ trực tiếp trong ứng dụng.</i>\n\n';
                
                const inlineKeyboard: any[][] = [];

                TASKS.forEach((t, i) => {
                    message += `${i+1}. <b>${t.name}</b>\n💰 Thưởng: ${t.reward} VuiCoin\n🔄 Lượt/Ngày: ${t.maxViews}\n✅ Duyệt: ${t.auto ? 'Tự động' : 'Thủ công'}\n\n`;
                    inlineKeyboard.push([
                        { text: `🔗 Tạo Link API: ${t.name}`, callback_data: `task_${t.id}` }
                    ]);
                });
                message += '👉 <b>Truy cập website để làm thêm nhiệm vụ:</b>\n🌐 https://www.vuitask.online/app/task';
                
                bot?.sendMessage(chatId, message, { 
                    parse_mode: 'HTML', 
                    disable_web_page_preview: true,
                    reply_markup: {
                        inline_keyboard: inlineKeyboard
                    }
                });
            } 
            else if (text === '💰 VÍ & RÚT TIỀN') {
                const msgTxt = `💰 <b>VÍ CỦA BẠN</b>\n━━━━━━━━━━━━━━\n👤 Email: ${currentUser.user_email}\n📛 Tên: ${currentUser.user_name || 'Chưa cập nhật'}\n💎 Số dư: ${currentUser.vui_coin_balance.toLocaleString()} VuiCoin\n🪙 CoinTask: ${(currentUser.coin_task_balance || 0).toLocaleString()} CoinTask\n\n👉 Nhấn nút bên dưới để cập nhật thông tin hoặc rút tiền:`;
                bot?.sendMessage(chatId, msgTxt, { 
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '📝 NHẬP THÔNG TIN', callback_data: 'wallet_info' }],
                            [{ text: '💸 RÚT TIỀN', callback_data: 'wallet_withdraw' }]
                        ]
                    }
                });
            }
            else if (text === '👤 XEM TÀI KHOẢN') {
                const msgTxt = `👤 <b>THÔNG TIN TÀI KHOẢN</b>\n━━━━━━━━━━━━━━\n📧 Email: ${currentUser.user_email}\n📛 Tên: ${currentUser.user_name || 'Không có'}\n💎 VuiCoin: ${currentUser.vui_coin_balance.toLocaleString()}\n🪙 CoinTask: ${(currentUser.coin_task_balance || 0).toLocaleString()}\n🎯 Tổng lượt làm NV: ${currentUser.total_tasks || 0}`;
                bot?.sendMessage(chatId, msgTxt, { parse_mode: 'HTML' });
            }
            else if (text === '🤝 GIỚI THIỆU BẠN BÈ') {
                const shortUuid = currentUser.user_uuid.substring(0, 8);
                const me = await bot?.getMe();
                const botUsername = me?.username || 'vuitaskonlinebotvuotlink_bot';
                const msgTxt = `🚀 <b>GIỚI THIỆU BẠN BÈ</b>\n━━━━━━━━━━━━━━\nBạn sẽ nhận được:\n🎁 <b>THƯỞNG 2% VUICOIN</b>\nCHO MỖI NHIỆM VỤ khi bạn bè của BẠN HOÀN THÀNH (KHÔNG TÍNH CỦA BẠN)\n\n🔗 <b>Link giới thiệu của bạn là:</b>\n<code>https://t.me/${botUsername}?start=${shortUuid}</code>\n\n<i>Lưu ý: Thưởng giới thiệu chỉ áp dụng cho tài khoản đăng ký mới qua link trên. Các tài khoản đã tồn tại sẽ không được tính.</i>`;
                bot?.sendMessage(chatId, msgTxt, { parse_mode: 'HTML' });
            }
            else if (text === '📜 LỊCH SỬ LÀM NV') {
                const { data: userTasks } = await supabaseAdmin.from('tasks_history')
                    .select('task_name, reward, status, timestamp')
                    .eq('user_uuid', currentUser.user_uuid)
                    .order('timestamp', { ascending: false })
                    .limit(10);
                if (userTasks && userTasks.length > 0) {
                    let msgTxt = `<b>📜 LỊCH SỬ LÀM NHIỆM VỤ (10 MỚI NHẤT)</b>\n━━━━━━━━━━━━━━━━━━\n`;
                    userTasks.forEach((t) => {
                        const date = new Date(t.timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
                        msgTxt += `📝 <b>${t.task_name}</b>\n💰 ${t.reward} VuiCoin - Trạng thái: ${t.status}\n🕒 ${date}\n\n`;
                    });
                    bot?.sendMessage(chatId, msgTxt, { parse_mode: 'HTML' });
                } else {
                    bot?.sendMessage(chatId, 'Chưa có dữ liệu nhiệm vụ.');
                }
            }
            else if (text === '📜 LỊCH SỬ RÚT TIỀN') {
                const { data: userWithdraws } = await supabaseAdmin.from('community_messages')
                    .select('content, status, timestamp')
                    .eq('type', 'withdrawal')
                    .eq('user_uuid', currentUser.user_uuid)
                    .order('timestamp', { ascending: false })
                    .limit(10);
                if (userWithdraws && userWithdraws.length > 0) {
                    let msgTxt = `<b>📜 LỊCH SỬ RÚT TIỀN (10 MỚI NHẤT)</b>\n━━━━━━━━━━━━━━━━━━\n`;
                    userWithdraws.forEach((w) => {
                        const date = new Date(w.timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
                        const firstLine = w.content?.split('\n')[0] || 'Yêu cầu rút tiền';
                        msgTxt += `💸 ${firstLine}\nTrạng thái: <b>${w.status}</b>\n🕒 ${date}\n\n`;
                    });
                    bot?.sendMessage(chatId, msgTxt, { parse_mode: 'HTML' });
                } else {
                    bot?.sendMessage(chatId, 'Chưa có yêu cầu rút tiền nào.');
                }
            }
            else if (text === '📜 LỊCH SỬ DUYỆT (ADMIN)') {
                if (!currentUser || !currentUser.is_admin) {
                    bot?.sendMessage(chatId, '❌ Bạn không có quyền truy cập chức năng này.');
                    return;
                }
                const { data: adminApprovals } = await supabaseAdmin.from('community_messages')
                    .select('type, content, status, timestamp, admin_note')
                    .in('type', ['withdrawal', 'task_review'])
                    .not('admin_note', 'is', null)
                    .order('timestamp', { ascending: false })
                    .limit(10);
                if (adminApprovals && adminApprovals.length > 0) {
                    let msgTxt = `<b>👮 LỊCH SỬ DUYỆT (10 MỚI NHẤT)</b>\n━━━━━━━━━━━━━━━━━━\n`;
                    adminApprovals.forEach((w) => {
                        const date = new Date(w.timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
                        const firstLine = w.content?.split('\n')[0] || (w.type === 'withdrawal' ? 'Yêu cầu rút tiền' : 'Duyệt nhiệm vụ VIP');
                        const icon = w.type === 'withdrawal' ? '💸' : '📝';
                        msgTxt += `${icon} ${firstLine}\nTrạng thái: <b>${w.status || 'Đã duyệt'}</b> (${w.admin_note})\n🕒 ${date}\n\n`;
                    });
                    bot?.sendMessage(chatId, msgTxt, { parse_mode: 'HTML' });
                } else {
                    bot?.sendMessage(chatId, 'Chưa có dữ liệu duyệt.');
                }
            }
            else if (text === '🏆 XẾP HẠNG') {
                const { data: topUsers } = await supabaseAdmin.from('profiles')
                    .select('user_name, user_email, vui_coin_balance')
                    .order('vui_coin_balance', { ascending: false })
                    .limit(10);
                    
                if (topUsers && topUsers.length > 0) {
                    let msgTxt = `<b>🏆 BẢNG XẾP HẠNG</b>\n━━━━━━━━━━━━━━━━━━\n`;
                    topUsers.forEach((u, i) => {
                        const name = u.user_name || (u.user_email?.split('@')[0] || 'User');
                        msgTxt += `<b>#${i+1}</b> ${name} - ${u.vui_coin_balance.toLocaleString()} VuiCoin\n`;
                    });
                    bot?.sendMessage(chatId, msgTxt, { parse_mode: 'HTML' });
                } else {
                    bot?.sendMessage(chatId, 'Chưa có dữ liệu xếp hạng.');
                }
            }
            else if (text === '💬 THAM GIA NHÓM CHAT') {
                bot?.sendMessage(chatId, 'Tham gia nhóm chat của chúng tôi tại đây: https://t.me/thongbaovuitask');
            }
            else if (text === '🌐 TRUY CẬP WEBSITE') {
                bot?.sendMessage(chatId, '🌐 Truy cập website chính thức:\n👉 https://www.vuitask.online');
            }
            else if (text === '📢 THÔNG BÁO CỦA ADMIN') {
                if (!currentUser || !currentUser.is_admin) {
                    bot?.sendMessage(chatId, '❌ Bạn không có quyền truy cập chức năng này.');
                    return;
                }
                userStates.set(chatId, { step: 'WAIT_FOR_ADMIN_ANNOUNCEMENT' });
                bot?.sendMessage(chatId, '📢 Vui lòng nhập nội dung thông báo gửi lên cộng đồng:');
            }
            else if (text === '📊 THỐNG KÊ BOT (ADMIN)') {
                if (!currentUser || !currentUser.is_admin) {
                    bot?.sendMessage(chatId, '❌ Bạn không có quyền truy cập chức năng này.');
                    return;
                }
                const { count: totalUsers } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
                const { count: telegramUsers } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).not('telegram_chat_id', 'is', null);
                const { count: pendingWd } = await supabaseAdmin.from('community_messages').select('*', { count: 'exact', head: true }).eq('type', 'withdrawal').eq('status', 'Đang chờ duyệt');
                const { count: pendingTask } = await supabaseAdmin.from('tasks_history').select('*', { count: 'exact', head: true }).eq('status', 'Chờ duyệt');
                
                const msVN = Date.now() + 7 * 3600 * 1000;
                const vnDateStr = new Date(msVN).toISOString().split('T')[0]; 
                const midnightVN = new Date(`${vnDateStr}T00:00:00.000Z`).getTime() - 7 * 3600 * 1000;
                const { count: newUsersToday } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(midnightVN).toISOString());

                const msgTxt = `📊 <b>THỐNG KÊ HỆ THỐNG</b>\n━━━━━━━━━━━━━━\n👥 Tổng thành viên: <b>${(totalUsers || 0).toLocaleString()}</b>\n🤖 Người dùng Telegram: <b>${(telegramUsers || 0).toLocaleString()}</b>\n🆕 Thành viên mới hôm nay: <b>${(newUsersToday || 0).toLocaleString()}</b>\n\n⏳ <b>CHỜ DUYỆT:</b>\n💸 Rút tiền: <b>${(pendingWd || 0)}</b> đơn\n🎯 Nhiệm vụ: <b>${(pendingTask || 0)}</b> đơn\n\n<i>Lưu ý: Thống kê dựa trên dữ liệu thực tế từ cơ sở dữ liệu.</i>`;
                bot?.sendMessage(chatId, msgTxt, { parse_mode: 'HTML' });
            }
            else if (text.startsWith('WD_') || text.startsWith('ORDER_') || text.startsWith('ts_')) {
                // Tra cứu đơn hàng/nhiệm vụ
                const id = text.trim();
                const { data: wd } = await supabaseAdmin.from('community_messages').select('*').eq('id', id).maybeSingle();
                const { data: task } = await supabaseAdmin.from('tasks_history').select('*').eq('id', id).maybeSingle();
                
                if (wd) {
                    const date = new Date(wd.timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
                    bot?.sendMessage(chatId, `🔍 <b>KẾT QUẢ TRA CỨU:</b>\n━━━━━━━━━━━━━━\n🆔 ID: <code>${wd.id}</code>\n👤 User: ${wd.user_name}\n💰 Số tiền: ${wd.amount.toLocaleString()} VuiCoin\n📌 Trạng thái: <b>${wd.status}</b>\n🕒 Thời gian: ${date}\n📝 Nội dung: ${wd.content}`, { parse_mode: 'HTML' });
                } else if (task) {
                    const date = new Date(task.timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
                    bot?.sendMessage(chatId, `🔍 <b>KẾT QUẢ TRA CỨU:</b>\n━━━━━━━━━━━━━━\n🆔 ID: <code>${task.id}</code>\n👤 User UUID: ${task.user_uuid}\n📝 Nhiệm vụ: ${task.task_name}\n💰 Thưởng: ${task.reward} VuiCoin\n📌 Trạng thái: <b>${task.status}</b>\n🕒 Thời gian: ${date}`, { parse_mode: 'HTML' });
                } else {
                    bot?.sendMessage(chatId, '❌ Không tìm thấy thông tin cho mã ID này.');
                }
            }
            else if (text === '⚙️ DUYỆT RÚT (ADMIN)') {
                if (!currentUser || !currentUser.is_admin) {
                    bot?.sendMessage(chatId, '❌ Bạn không có quyền truy cập chức năng này.');
                    return;
                }
                const { data: list } = await supabaseAdmin.from('community_messages').select('*').eq('type', 'withdrawal').eq('status', 'Đang chờ duyệt');
                if (!list || list.length === 0) {
                    bot?.sendMessage(chatId, '✅ Không có đơn rút tiền nào đang chờ duyệt.');
                    return;
                }
                let m = '<b>DANH SÁCH RÚT TIỀN CHỜ DUYỆT:</b>\n\n';
                list.forEach(item => {
                    m += `🆔 ID: <code>${item.id}</code>\n👤 User: ${item.user_name}\n💰 Tiền (net): ${item.amount.toLocaleString()}\n📝 Nội dung: ${item.content}\n\n`;
                });
                m += '👉 Để xử lý, hãy nhắn tin theo cú pháp:\n`ID duyet` hoặc `ID tu_choi`\n(Ví dụ: WD_1234 duyet)\nHoặc gõ `Hủy`';
                userStates.set(chatId, { step: 'WAIT_FOR_ADMIN_APPROVE_WD' });
                bot?.sendMessage(chatId, m, { parse_mode: 'HTML' });
            }
            else if (text === '⚙️ DUYỆT NHIỆM VỤ (ADMIN)') {
                if (!currentUser || !currentUser.is_admin) {
                    bot?.sendMessage(chatId, '❌ Bạn không có quyền truy cập chức năng này.');
                    return;
                }
                const { data: list } = await supabaseAdmin.from('tasks_history').select('*').eq('status', 'Chờ duyệt').limit(10);
                if (!list || list.length === 0) {
                    bot?.sendMessage(chatId, '✅ Không có nhiệm vụ nào đang chờ duyệt.');
                    return;
                }
                let m = '<b>DANH SÁCH NHIỆM VỤ CHỜ DUYỆT (Top 10):</b>\n\n';
                list.forEach(item => {
                    m += `🆔 ID: <code>${item.id}</code>\n👤 User UUID: ${item.user_uuid}\n📝 Task: ${item.task_name}\n🖼️ Ảnh: ${item.proof_image || 'Không có'}\n\n`;
                });
                m += '👉 Để xử lý, hãy nhắn tin the cú pháp:\n`ID duyet` hoặc `ID tu_choi`\n(Ví dụ: ts_123 duyet)\nHoặc gõ `Hủy`';
                userStates.set(chatId, { step: 'WAIT_FOR_ADMIN_APPROVE_TASK' });
                bot?.sendMessage(chatId, m, { parse_mode: 'HTML' });
            }
            else {
                bot?.sendMessage(chatId, 'Vui lòng chọn chức năng từ menu:', getMenuKeyboard(currentUser.is_admin));
            }
        } catch (e) {
            console.error('Bot Error:', e);
            bot?.sendMessage(chatId, 'Đã xảy ra lỗi, vui lòng thử lại sau.');
        }
    });

}

