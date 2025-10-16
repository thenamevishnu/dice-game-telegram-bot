import TelegramBot from "node-telegram-bot-api";

export const api = new TelegramBot(process.env.BOT_TOKEN, {
    polling: true
})