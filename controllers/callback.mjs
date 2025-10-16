import { api } from "../config/tg.mjs";
import { sendBroadcast } from "../lib/cron.mjs";
import { admin_wait_for, keys, storage, wait_for_answer } from "../lib/telegram.mjs";
import { UserModel } from "../models/user.model.mjs";

api.on("callback_query", async callback => {
    const action = callback.data
    const from = callback.from
    if (!storage[from.id]) {
        storage[from.id] = {}
    }

    if (action === "set_wallet_address") {
        try {
            storage[from.id]["from_message_id"] = callback.message.message_id
            wait_for_answer[from.id] = "set_wallet_address"
            await api.sendMessage(from.id, "💼 <b>Enter your USDT (TRC20) wallet address.</b>", {
                parse_mode: "HTML",
                reply_markup: {
                    keyboard: keys.back_key,
                    resize_keyboard: true
                }
            })
        } catch (error) {
            return await api.sendMessage(from.id, "⚠️ <b>Error: Please try again.</b>", {
                parse_mode: "HTML"
            })
        }
    }

    // Admin Side

    if (action.startsWith("/update_balance")) {
        try {
            const [_, type, userId] = action.split(" ")
            const user = await UserModel.findOne({ _id: userId })
            if (!user) {
                return await api.answerCallbackQuery(callback.id, {
                    text: "⚠️ <b>Error: User not found.</b>",
                    show_alert: true,
                    parse_mode: "HTML"
                })
            }
            const balKey = ["available", "payout", "deposit", "referral", "gain", "loss", "winnings"]
            const key = balKey.find(key => key.toLowerCase().startsWith(type.toLowerCase()))
            storage[from.id] = {
                key,
                user_id: userId
            }
            admin_wait_for[from.id] = "update_balance"
            return await api.sendMessage(from.id, `<b>🔄 Enter the amount to update ${key.charAt(0).toUpperCase() + key.slice(1)} balance:</b>`, {
                parse_mode: "HTML",
                reply_markup: {
                    keyboard: keys.admin_back_key,
                    resize_keyboard: true
                }
            })
        } catch (error) {
            return await api.sendMessage(from.id, "⚠️ <b>Error: Please try again.</b>", {
                parse_mode: "HTML"
            })
        }
    }

    if (action == "cancel_broadcast") {
        try {
            return await api.editMessageText(`<b>❌ Broadcast cancelled.</b>`, {
                parse_mode: "HTML",
                chat_id: from.id,
                message_id: callback.message.message_id
            })
        } catch (error) {
            return await api.sendMessage(from.id, "⚠️ <b>Error: Please try again.</b>", {
                parse_mode: "HTML"
            })
        }
    }

    if (action == "confirm_broadcast") {
        try {
            await api.editMessageText(`<b>✅ Broadcast confirmed.</b>`, {
                parse_mode: "HTML",
                chat_id: from.id,
                message_id: callback.message.message_id
            })
            const broadcast_id = storage[from.id]["broadcast_id"]
            await api.sendMessage(from.id, "✅ <b>Broadcast started successfully.</b>", {
                parse_mode: "HTML"
            })
            sendBroadcast(from.id, broadcast_id, async () => {
                await api.sendMessage(from.id, "✅ <b>Broadcast completed successfully.</b>", {
                    parse_mode: "HTML"
                })
            })
        } catch (error) {
            return await api.sendMessage(from.id, "⚠️ <b>Error: Please try again.</b>", {
                parse_mode: "HTML"
            })
        }
    }
})