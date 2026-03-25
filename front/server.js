const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.post("/api/support", async (req, res) => {
    const { username, type, message } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ error: "Пустое сообщение" });
    }

    if (!BOT_TOKEN || !CHAT_ID) {
        return res.status(500).json({
            error: "Не заданы BOT_TOKEN и CHAT_ID в переменных окружения"
        });
    }

    const text = `📩 Новое обращение в поддержку

Пользователь: ${username || "Неизвестно"}
Тип: ${type || "Не указан"}

Сообщение:
${message}`;

    try {
        const telegramResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text
                })
            }
        );

        const data = await telegramResponse.json();

        if (!telegramResponse.ok) {
            return res.status(500).json({
                error: "Ошибка Telegram API",
                details: data
            });
        }

        res.json({ ok: true, telegram: data });
    } catch (error) {
        res.status(500).json({
            error: "Ошибка соединения с Telegram",
            details: error.message
        });
    }
});

app.listen(3000, () => {
    console.log("Support server started: http://localhost:3000");
});