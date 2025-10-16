import { settings } from "../config/bot.mjs";
import { api } from "../config/tg.mjs";
import { admin_wait_for, keys, userMention } from "../lib/telegram.mjs";

api.onText(/^\/admin$|^👨‍💻 Admin Panel$|^🔙 Admin$/, async msg => {
    try {
        if (msg.chat.type != "private") return;
        const id = msg.from.id
        if (id != settings.admin.id) return
        admin_wait_for[id] = ""
        return await api.sendMessage(id, "Admin Panel", {
            reply_markup: {
                keyboard: keys.admin_key,
                resize_keyboard: true
            }
        })
    } catch (error) {
        return await api.sendMessage(msg.from.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
})

api.onText(/^\/user_info$|^ℹ️ User Info$/, async (msg) => {
    try {
        if (msg.chat.type != "private") return;
        if (msg.from.id != settings.admin.id) return;
        admin_wait_for[msg.from.id] = "user_info";
        return await api.sendMessage(msg.from.id, "<b> 👤 Enter the user ID:</b>", {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: keys.admin_back_key,
                resize_keyboard: true
            }
        })
    } catch (error) {
        return await api.sendMessage(msg.from.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
})
   
api.onText(/^\/update_balance$|^🔄 Update Balance$/, async (msg) => {
    try {
        if (msg.chat.type != "private") return;
        if (msg.from.id != settings.admin.id) return;
        admin_wait_for[msg.from.id] = "update_balance_user_id";
        return await api.sendMessage(msg.from.id, "<b>🔄 Enter the user ID to update balance:</b>", {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: keys.admin_back_key,
                resize_keyboard: true
            }
        })
    } catch (error) {
        return await api.sendMessage(msg.from.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
})

api.onText(/^\/ban$|^🔴 Ban$/, async (msg) => {
    try {
        if (msg.chat.type != "private") return;
        if (msg.from.id != settings.admin.id) return;
        admin_wait_for[msg.from.id] = "ban_user_id";
        return await api.sendMessage(msg.from.id, "<b>🔴 Enter the user ID to ban:</b>", {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: keys.admin_back_key,
                resize_keyboard: true
            }
        })
    } catch (error) {
        return await api.sendMessage(msg.from.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
})

api.onText(/^\/unban$|^🟢 Unban$/, async (msg) => {
    try {
        if (msg.chat.type != "private") return;
        if (msg.from.id != settings.admin.id) return;
        admin_wait_for[msg.from.id] = "unban_user_id";
        return await api.sendMessage(msg.from.id, "<b>🟢 Enter the user ID to unban:</b>", {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: keys.admin_back_key,
                resize_keyboard: true
            }
        })
    } catch (error) {
        return await api.sendMessage(msg.from.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
})

api.onText(/^\/broadcast$|^💬 Broadcast$/, async (msg) => {
    try {
        if (msg.chat.type != "private") return;
        if (msg.from.id != settings.admin.id) return;
        admin_wait_for[msg.from.id] = "broadcast_message";
        return await api.sendMessage(msg.from.id, "<b>💬 Create or forward message to broadcast:</b>", {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: keys.admin_back_key,
                resize_keyboard: true
            }
        })
    } catch (error) {
        return await api.sendMessage(msg.from.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
})