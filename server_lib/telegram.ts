

export function maskIdentity(str: string | null | undefined) {
    if (!str) return '***';
    const len = str.length;
    const revealLen = Math.max(1, Math.floor(len / 4));
    return str.substring(0, revealLen) + '*'.repeat(len - revealLen);
}

export type NotificationType = 'task_completed' | 'task_approved' | 'withdrawal_created' | 'withdrawal_approved' | 'user_registered';

export async function sendTelegramNotification(message: string, type?: NotificationType) {
    const allowedTypes = ['task_completed', 'task_approved', 'withdrawal_created', 'withdrawal_approved', 'user_registered'];
    if (type && !allowedTypes.includes(type)) {
        return;
    }
    const token = process.env.TELEGRAM_BOT_TOKEN || '8679875744:AAE9Cf1ZcZBCRWpKvIGQVG7jBYn6o8XqbNU';
    const chatId = process.env.TELEGRAM_CHAT_ID || '-1003937828577';

    if (!token || !chatId) {
        console.warn("[Telegram] Missing token or chatId. Notification skipped.");
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Telegram] Error sending message:", errorText);
        }
    } catch (e) {
        console.error("[Telegram] Exception:", e);
    }
}
