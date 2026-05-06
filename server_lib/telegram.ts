
export async function sendTelegramNotification(message: string) {
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
