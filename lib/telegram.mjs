import { settings } from "../config/bot.mjs"

export const wait_for_answer = {}
export const storage = {}
export const admin_wait_for = {}

export const userMention = (user) => {
    return user.username ? `@${user.username}` : `<a href="tg://user?id=${user.id}">${user.first_name} ${user.last_name || ''}</a>`
}

export const keys = {
    home_keys: (id) => {
        const keys = [
            ["💰 Balance", "📨 Invite"],
            ["⚙️ Settings", "🎲 Roll Dice", "🏆 Leaderboard"],
            ["💵 Add Funds", "💸 Withdraw"]
        ]
        if (id == settings.admin.id) keys.push(["👨‍💻 Admin Panel"])
        return keys
    },
    back_key: [
        ["🔙 Back"]
    ],
    admin_back_key: [
        ["🔙 Admin"]
    ],
    admin_key: [
        ["ℹ️ User Info", "🔄 Update Balance"],
        ["🔴 Ban", "💬 Broadcast", "🟢 Unban"],
        ["🔙 Back"]
    ]
}

const keyObj = {
    homeKey: keys.home_keys(settings.admin.id),
    backKey: keys.back_key,
    adminKey: keys.admin_key,
    adminBackKey: keys.admin_back_key,
}

export const key_map = Object.values(keyObj).flat().flat()


