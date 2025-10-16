import { settings } from "../config/bot.mjs";
import { api } from "../config/tg.mjs";
import { keys, userMention, wait_for_answer } from "../lib/telegram.mjs";
import { UserModel } from "../models/user.model.mjs";

api.onText(/^\/start(?:\s+(.+))?$|^🔙 Back$/, async (msg, match) => {
    try {
        if (msg.chat.type != "private") return;
        wait_for_answer[msg.from.id] = "";
        let inviter = match?.[1] ? match[1].split(/\s+/)[0] : null;
        const user = await UserModel.findOne({ _id: msg.from.id });
        if (!user) {
            if (!inviter) {
                inviter = settings.admin.id;
            }
            if (inviter === msg.from.id) {
                await api.sendMessage(msg.from.id, "<b>😅 You can't invite yourself!</b>", { parse_mode: "HTML" });
                inviter = settings.admin.id;
            }
            const inviterInfo = await UserModel.findOne({ _id: inviter });
            if (!inviterInfo) {
                return await api.sendMessage(msg.from.id, "<b>⚠️ Invalid inviter</b>", { parse_mode: "HTML" });
            }
            const newUser = await UserModel.create({
                _id: msg.from.id,
                inviter: inviter,
                first_name: msg.from.first_name,
                last_name: msg.from.last_name,
                username: msg.from.username,
            });
            if (!newUser) {
                return await api.sendMessage(msg.from.id, "<b>⚠️ Something went wrong!</b>", { parse_mode: "HTML" });
            }
            const total = await UserModel.estimatedDocumentCount();
            inviterInfo.invites += 1;
            await inviterInfo.save();
            api.sendMessage(inviterInfo._id, `<b>🎉 ${userMention(msg.from)} joined using your referral link.</b>`, { parse_mode: "HTML" });
            api.sendMessage(
                settings.admin.id,
                `🪂 <b>${userMention(msg.from)}</b> has joined the game!\n<b>ID:</b> <code>${msg.from.id}</code>\n<b>Inviter:</b> ${userMention({ ...inviterInfo._doc, id: inviterInfo._id })}\nCurrently <i>${total}</i> users 🎉`,
                { parse_mode: "HTML" }
            );
        }
        await api.sendMessage(msg.from.id, "<b>🎲 Welcome to the game!</b>", {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: keys.home_keys(msg.from.id),
                resize_keyboard: true
            }
        });
    } catch (error) {
        return await api.sendMessage(msg.from.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
});

api.onText(/^\/balance$|^💰 Balance$/, async (msg) => {
    try {
        if (msg.chat.type != "private") return;
        const user = await UserModel.findOne({ _id: msg.from.id });
        await api.sendMessage(
            msg.from.id,
            `<b>👤 ${userMention(msg.from)}</b>\n\n<b>💵 Available: ${user.balance.available.toFixed(2)} USDT</b>\n\n<b>💸 Payout: ${user.balance.payout.toFixed(2)} USDT</b>\n<b>💳 Deposit: ${user.balance.deposit.toFixed(2)} USDT</b>\n\n<b>🎁 Referral: ${user.balance.referral.toFixed(2)} USDT</b>\n\n<b>📈 Gain: ${user.balance.gain.toFixed(2)} USDT</b>\n<b>📉 Loss: ${user.balance.loss.toFixed(2)} USDT</b>\n\n<b>🏆 Winnings: ${user.balance.winnings?.toFixed(2) || "0.00"} USDT</b>\n\n<i>You can only withdraw the winnings amount.</i>`,
            { parse_mode: "HTML" }
        );
    } catch (error) {
        return await api.sendMessage(msg.from.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
});

api.onText(/^\/invite$|^📨 Invite$/, async (msg) => {
    try {
        if (msg.chat.type != "private") return;
        const user = await UserModel.findOne({ _id: msg.from.id });
        const referralLink = `https://t.me/${settings.bot.username}?start=${msg.from.id}`;
        await api.sendMessage(
            msg.from.id,
            `<b>👤 ${userMention(msg.from)}\n\n🔗 Your referral link: ${referralLink}\n\n📊 Total referrals: ${user.invites}\n💰 You will get ${settings.ref_income}% from user deposits.</b>`,
            { parse_mode: "HTML" }
        );
    } catch (error) {
        return await api.sendMessage(msg.from.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
});

api.onText(/^\/roll_dice$|^🎲 Roll Dice$/, async (msg) => {
    try {
        if (msg.chat.type != "private") return;
        wait_for_answer[msg.from.id] = "roll_dice_amount";
        return await api.sendMessage(msg.from.id, "<b>💸 Enter the amount to roll:</b>", {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: keys.back_key,
                resize_keyboard: true
            }
        });
    } catch (error) {
        return await api.sendMessage(msg.from.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
});

api.onText(/^\/top_list$|^🏆 Top List$/, async (msg) => {
    const obj = {
        parse_mode: "HTML"
    }
    if (msg.chat.type != "private") obj.reply_to_message_id = msg.message_id
    try {
        const topUsers = await UserModel.find({})
            .sort({ "balance.gain": -1 })
            .limit(10)
            .select("_id first_name last_name username balance.gain")
            .lean();

        if (!topUsers.length) {
            return await api.sendMessage(
                msg.chat.id,
                "<b>🏆 No data for leaderboard yet.</b>", obj);
        }

        let text = "<b>🏆 Top 10 Players by Gain:</b>\n\n";
        topUsers.forEach((user, idx) => {
            const mention = user.username
                ? `@${user.username}`
                : `<a href="tg://user?id=${user._id}">${user.first_name}${user.last_name ? " " + user.last_name : ""}</a>`;
            text += `${idx + 1}. ${mention} ${user._id == msg.from.id ? "<b>(You)</b>" : ""} — <b>${parseFloat(user.balance?.gain || 0).toFixed(2)} USDT</b>\n`;
        });

        return await api.sendMessage(msg.chat.id, text, obj);
    } catch (error) {
        return await api.sendMessage(msg.chat.id, "⚠️ <b>Error: Please try again.</b>", obj)
    }
});

api.onText(/^\/settings$|^⚙️ Settings$/, async (msg) => {
    try {
        if (msg.chat.type != "private") return;
        const user = await UserModel.findOne({ _id: msg.from.id });
        await api.sendMessage(
            msg.from.id,
            `<b>⚙️ Settings</b>\n\n<b>👛 Your wallet address: ${user.wallet || "🚫 Not set"}</b>`,
            {
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [[{
                        text: "📝 Update Wallet",
                        callback_data: "set_wallet_address"
                }]]
            }
        });
    } catch (error) {
        return await api.sendMessage(msg.from.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
})

api.onText(/^\/deposit$|^💵 Add Funds$/, async (msg) => {
    try {
        if (msg.chat.type != "private") return;
        wait_for_answer[msg.from.id] = "deposit_amount";
        return await api.sendMessage(msg.from.id, "<b>💸 Enter the amount to add funds in USD:</b>", {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: keys.back_key,
                resize_keyboard: true
            }
        });
    } catch (error) {
        return await api.sendMessage(msg.from.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
});

api.onText(/\/id$/, async (msg) => {
    try {
        return await api.sendMessage(msg.chat.id, `<b>🆔 Your ID: <code>${msg.from.id}</code></b>`, {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        });
    } catch (error) {
        return await api.sendMessage(msg.chat.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
});

api.onText(/\/withdraw$|^💸 Withdraw$/, async (msg) => {
    try {
        if (msg.chat.type != "private") return;
        const user = await UserModel.findOne({ _id: msg.from.id });
        if(user.is_banned) {
            return await api.sendMessage(msg.from.id, "⚠️ <b>You are banned. So you can't withdraw. Please contact the admin for more information.</b>", {
                parse_mode: "HTML"
            });
        }
        if(!user.wallet) {
            return await api.sendMessage(msg.from.id, "⚠️ <b>Please set your wallet address first.</b>", {
                parse_mode: "HTML"
            });
        }
        if(user.balance.winnings < settings.min_withdraw) {
            return await api.sendMessage(msg.from.id, `⚠️ <b>You need at least ${settings.min_withdraw} USDT to withdraw.</b>`, {
                parse_mode: "HTML"
            });
        }
        wait_for_answer[msg.from.id] = "withdraw_amount";
        return await api.sendMessage(msg.from.id, "<b>💸 Enter the amount to withdraw:</b>", {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: keys.back_key,
                resize_keyboard: true
            }
        });
    } catch (error) {
        return await api.sendMessage(msg.from.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
});

api.onText(/^\/statistics$|^📊 Statistics$/, async (msg) => {
    try {
        if (msg.chat.type != "private") return;
        const response = await UserModel.aggregate([
            {
                $group: {
                    _id: null,
                    total_users: { $count:{} },
                    total_winnings: { $sum: "$balance.winnings" },
                    total_losses: { $sum: "$balance.losses" },
                    total_gain: { $sum: "$balance.gain" },
                    total_referral: { $sum: "$balance.referral" },
                    total_payout: { $sum: "$balance.payout" },
                    total_deposit: { $sum: "$balance.deposit" }
                }
            }
        ]);
        const text = `<b>📊 Statistics</b>\n\n<b>👥 Total Users:</b> <code>${response[0].total_users}</code>\n\n<b>💰 Total Deposit:</b> <code>${parseFloat(response[0].total_deposit).toFixed(2)} USDT</code>\n<b>💰 Total Winnings:</b> <code>${parseFloat(response[0].total_winnings).toFixed(2)} USDT</code>\n\n<b>🔻 Total Losses:</b> <code>${parseFloat(response[0].total_losses).toFixed(2)} USDT</code>\n<b>📈 Total Gain:</b> <code>${parseFloat(response[0].total_gain).toFixed(2)} USDT</code>\n\n<b>🔗 Total Referral:</b> <code>${parseFloat(response[0].total_referral).toFixed(2)} USDT</code>\n\n<b>💵 Total Payout:</b> <code>${parseFloat(response[0].total_payout).toFixed(2)} USDT</code>\n\n<b>⌚ D&T:</b> <code>${new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).toUpperCase()}</code>`;
        return await api.sendMessage(msg.from.id, text, { parse_mode: "HTML" });
    } catch (error) {
        return await api.sendMessage(msg.from.id, "⚠️ <b>Error: Please try again.</b>", {
            parse_mode: "HTML"
        })
    }
});

