export interface FakeUser {
    id: string;
    user_uuid: string;
    user_name: string;
    user_email: string;
    avatar_url: string;
    vui_coin_balance: number;
    today_balance: number;
    weekly_balance: number;
    monthly_balance: number;
    today_turns: number;
    weekly_turns: number;
    monthly_turns: number;
    total_tasks: number;
    created_at: string;
    last_reset_day: number;
}

export const fakeUsers: FakeUser[] = [];
export let fakeMessages: any[] = [];

const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const middleNamesM = ['Văn', 'Đức', 'Hữu', 'Quang', 'Công', 'Minh', 'Thành', 'Hải', 'Bảo'];
const middleNamesF = ['Thị', 'Ngọc', 'Xuân', 'Thu', 'Hồng', 'Mai', 'Lan', 'Kim', 'Diệu'];
const firstNamesM = ['Anh', 'Tùng', 'Dũng', 'Tuấn', 'Minh', 'Hoàng', 'Sơn', 'Kiên', 'Hùng', 'Cường', 'Thắng', 'Tài', 'Phát', 'Đạt'];
const firstNamesF = ['Linh', 'Trang', 'Ngọc', 'Lan', 'Hương', 'Thủy', 'Phương', 'Hoa', 'Thảo', 'Nhung', 'Quỳnh', 'Oanh', 'Yến'];

function seededRandom(seed: number) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function randomInt(seed: number, min: number, max: number) {
    return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

function getRandomName(seed: number) {
    const isMale = seededRandom(seed) > 0.5;
    const ln = lastNames[randomInt(seed + 1, 0, lastNames.length - 1)];
    const mnList = isMale ? middleNamesM : middleNamesF;
    const fnList = isMale ? firstNamesM : firstNamesF;
    const mn = mnList[randomInt(seed + 2, 0, mnList.length - 1)];
    const fn = fnList[randomInt(seed + 3, 0, fnList.length - 1)];
    return `${ln} ${mn} ${fn}`;
}

export function initFakeData() {
    if (fakeUsers.length > 0) return;

    const baseDate = new Date();
    const currentDay = baseDate.getDate();
    const currentMonth = baseDate.getMonth();

    for (let i = 0; i < 500; i++) {
        const seed = i + 10000;
        const name = getRandomName(seed);
        const nameParts = name.split(' ');
        const email = `${nameParts[nameParts.length - 1].toLowerCase()}${nameParts[0].toLowerCase()}${randomInt(seed + 4, 1, 9999)}@gmail.com`;
        const uuid = `fake_${i}_${randomInt(seed, 100000, 999999)}`;
        
        // Realistic stats
        const total_tasks = randomInt(seed + 7, 500, 35000);
        
        // Average reward varies between task types (300-500)
        const avgReward = randomInt(seed + 8, 300, 500);
        
        // Initial balance: some have withdrawn, some haven't.
        const totalEarnedEver = total_tasks * avgReward;
        const vui_coin_balance = totalEarnedEver % 150000 + randomInt(seed + 9, 0, 80000);

        // Today's turns: 0 to 100 with a more varied distribution
        const hour = baseDate.getHours();
        const pastMinutesToday = hour * 60 + baseDate.getMinutes();
        // Some users are "power users" (done more tasks), some are "casual"
        const userIntensity = seededRandom(seed + 101); // 0.0 to 1.0
        const maxExpectedTurnsNow = Math.floor((pastMinutesToday / 1440) * 100 * userIntensity);
        const today_turns = randomInt(seed + 5, 0, Math.max(5, maxExpectedTurnsNow));
        const today_balance = today_turns * avgReward + randomInt(seed + 12, -1000, 1000);

        // Weekly/Monthly (Reflecting new limits: 200/week, 900/month)
        // Weekly max 200 * 500 = 100,000 approx
        const weekly_turns = Math.min(200, today_turns + randomInt(seed + 13, 0, 150));
        const weekly_balance = weekly_turns * avgReward + randomInt(seed + 14, -2000, 2000);
        
        const monthly_turns = Math.min(900, weekly_turns + randomInt(seed + 15, 0, 700));
        const monthly_balance = monthly_turns * avgReward + randomInt(seed + 16, -5000, 5000);

        fakeUsers.push({
            id: uuid,
            user_uuid: uuid,
            user_name: name,
            user_email: email,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uuid}`,
            vui_coin_balance: Math.max(0, vui_coin_balance),
            today_balance: Math.max(0, today_balance),
            weekly_balance: Math.max(0, weekly_balance),
            monthly_balance: Math.max(0, monthly_balance),
            today_turns,
            weekly_turns,
            monthly_turns,
            total_tasks,
            created_at: new Date(Date.now() - randomInt(seed + 11, 30, 240) * 86400000).toISOString(),
            last_reset_day: currentDay,
        });
    }

    // Run tick every 8 seconds for more activity
    setInterval(tickFakeUsers, 8000);
}

function tickFakeUsers() {
    const now = new Date();
    const day = now.getDate();
    // randomly pick 20 - 40 users to do 1-2 tasks each
    const n = Math.floor(Math.random() * 20) + 20;
    
    for (let i = 0; i < n; i++) {
        const u = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
        
        if (u.last_reset_day !== day) {
            u.last_reset_day = day;
            u.today_balance = 0;
            u.today_turns = 0;
            if (day === 1) {
                u.monthly_balance = 0;
            }
        }
        
        if (u.today_turns < 100) {
            // Reward varies significantly (200 to 500)
            const reward = Math.floor(Math.random() * 300) + 200; 
            u.today_turns++;
            
            // Increment weekly/monthly but respect the new limits
            if (u.weekly_turns === undefined) u.weekly_turns = u.today_turns;
            if (u.monthly_turns === undefined) u.monthly_turns = u.today_turns;

            if (u.weekly_turns < 200) {
                u.weekly_turns++;
                u.weekly_balance += reward;
            }
            if (u.monthly_turns < 900) {
                u.monthly_turns++;
                u.monthly_balance += reward;
            }
            
            u.today_balance += reward;
            u.vui_coin_balance += reward;
            u.total_tasks++;
            
            // Check withdrawal >= 100,000
            if (u.vui_coin_balance >= 100000) {
                // Higher chance to withdraw if much higher than 100k
                const withdrawalChance = u.vui_coin_balance > 200000 ? 0.3 : 0.05;
                if (Math.random() < withdrawalChance) {
                    const amount = Math.floor(u.vui_coin_balance / 10000) * 10000;
                    u.vui_coin_balance -= amount;
                    
                    const method = Math.random() < 0.4 ? 'BANK' : (Math.random() < 0.7 ? 'MOMO' : 'THE_CAO');
                    const msgId = `WD_FAKE_${Date.now()}_${Math.random().toString(36).substring(2,6)}`;
                    
                    const fee = amount * 0.05;
                    const netAmount = amount - fee;
                    
                    let maskedName = u.user_name;
                    const parts = maskedName.split(' ');
                    if (parts.length >= 2) {
                        maskedName = parts[0] + ' *** ' + parts[parts.length - 1];
                    }
                    
                    fakeMessages.push({
                        id: msgId,
                        type: 'withdrawal',
                        user_uuid: u.user_uuid,
                        user_name: maskedName,
                        user_avatar: u.avatar_url,
                        amount: netAmount,
                        content: `Yêu cầu rút tiền qua ${method === 'THE_CAO' ? 'THẺ CÀO' : method}. Chi tiết: {"accountNumber":"***","holderName":"***","requestedAmount":${amount}}`,
                        status: 'Đã thanh toán',
                        timestamp: Date.now()
                    });
                    
                    if (fakeMessages.length > 50) {
                        fakeMessages.shift();
                    }
                }
            }
        }
    }
}
