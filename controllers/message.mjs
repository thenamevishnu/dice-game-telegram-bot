import { settings } from "../config/bot.mjs";
import { api } from "../config/tg.mjs";
import { createPaymentLink, createPayout } from "../lib/oxapay.mjs";
import { admin_wait_for, key_map, keys, storage, userMention, wait_for_answer } from "../lib/telegram.mjs";
import { UserModel } from "../models/user.model.mjs";

api.on("message", async (msg) => {
    if (key_map.includes(msg?.text)) return;

    if (!storage[msg.from.id]) {
        storage[msg.from.id] = {}
    }
    const wait_for = wait_for_answer[msg.from.id]

    if (wait_for == "roll_dice_amount") {
        try {
            if (!msg?.text) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid amount.</b>", { parse_mode: "HTML" });
            }
            const amount = parseFloat(msg.text);
            if (isNaN(amount) || amount <= 0) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid amount.</b>", { parse_mode: "HTML" });
            }
            const user = await UserModel.findOne({ _id: msg.from.id });
            if (user.balance.available < amount) {
                wait_for_answer[msg.from.id] = "";
                return await api.sendMessage(msg.from.id, "⚠️ <b>You don't have enough balance.</b>", {
                    parse_mode: "HTML",
                    reply_markup: {
                        keyboard: keys.home_keys(msg.from.id),
                        resize_keyboard: true
                    }
                 });
            }
            wait_for_answer[msg.from.id] = "roll_dice_result_prediction";
            storage[msg.from.id]["amount"] = amount
            return await api.sendMessage(msg.from.id, `<b>🎲 Predict the outcome of the dice roll (1-6).</b>`, { parse_mode: "HTML" });
        } catch (error) {
            return await api.sendMessage(msg.from.id, "⚠️ <b>An error occurred. Please try again.</b>", { parse_mode: "HTML" });
        }
    }

    if (wait_for == "roll_dice_result_prediction") {
        try {
            if (!msg?.text) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid prediction.</b>", { parse_mode: "HTML" });
            }
            const prediction = parseInt(msg.text);
            const amount = storage[msg.from.id]["amount"]
            if (isNaN(prediction) || prediction < 1 || prediction > 6) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid prediction.</b>", { parse_mode: "HTML" });
            }
            wait_for_answer[msg.from.id] = ""
            const user = await UserModel.findOne({ _id: msg.from.id });
            await api.sendMessage(msg.from.id, `🎲 Rolling dice for <b>${userMention(msg.from)}</b> with amount <code>${amount}</code>...`, { parse_mode: "HTML" });
            const response = await api.sendDice(msg.from.id, {
                emoji: "🎲",
                disable_notification: true,
            });
            const dice_value = response.dice.value;
            await api.sendMessage(msg.from.id, `🎲 Dice rolled with value <b>${dice_value}</b>.`, { parse_mode: "HTML" });
            if (dice_value == prediction) {
                await api.sendMessage(msg.from.id, `✅ You guessed correctly! You won <b>${amount * settings.winning} USDT</b>.`, { parse_mode: "HTML" });
                user.balance.gain += amount * settings.winning;
                user.balance.winnings += amount * settings.winning;
            } else {
                await api.sendMessage(msg.from.id, `❌ You guessed incorrectly. You lost <b>${amount} USDT</b>.`, { parse_mode: "HTML" });
                user.balance.loss += amount;
            }
            user.balance.available -= amount;
            await user.save();
            return await api.sendMessage(msg.from.id, `💰 Your current balance is <b>${user.balance.available.toFixed(2)} USDT</b>.`, {
                parse_mode: "HTML",
                reply_markup: {
                    keyboard: keys.home_keys(msg.from.id),
                    resize_keyboard: true
                }
            });
        } catch (error) {
            console.log(error)
            return await api.sendMessage(msg.from.id, "⚠️ <b>An error occurred. Please try again.</b>", { parse_mode: "HTML" });
        }
    }

    if (wait_for == "set_wallet_address") {
        try {
            if (!msg?.text) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid USDT (TRC20) wallet address.</b>", { parse_mode: "HTML" });
            }
            const wallet_address = msg.text;
            const user = await UserModel.findOne({ _id: msg.from.id });
            if(wallet_address == user.wallet) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Wallet address cannot be the same as the current one.</b>", { parse_mode: "HTML" });
            }
            if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(wallet_address)) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid USDT (TRC20) wallet address.</b>", { parse_mode: "HTML" });
            }
            const existing_user = await UserModel.findOne({ wallet: wallet_address });
            if(existing_user) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>This wallet address is already registered.</b>", { parse_mode: "HTML" });
            }
            user.wallet = wallet_address;
            await user.save();
            wait_for_answer[msg.from.id] = ""
            const update_id = storage[msg.from.id]["from_message_id"]
            api.editMessageText(`<b>⚙️ Settings</b>\n\n<b>👛 Your wallet address: ${user.wallet || "🚫 Not set"}</b>`, {
                message_id: update_id,
                chat_id: msg.from.id,
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [[{
                        text: "📝 Update Wallet",
                        callback_data: "set_wallet_address"
                    }]]
                }
            })
            return await api.sendMessage(msg.from.id, `<b>👛 Wallet address updated to: ${wallet_address}</b>`, {
                parse_mode: "HTML", 
                reply_markup: {
                    keyboard: keys.home_keys(msg.from.id),
                    resize_keyboard: true
                }
             });
        } catch (error) {
            return await api.sendMessage(msg.from.id, "⚠️ <b>An error occurred. Please try again.</b>", { parse_mode: "HTML" });
        }
    }

    if (wait_for == "deposit_amount") {
        try {
            if (!msg?.text) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid amount.</b>", { parse_mode: "HTML" });
            }
            const amount = parseInt(msg.text);
            if (isNaN(amount) || amount <= 0) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid amount.</b>", { parse_mode: "HTML" });
            }
            wait_for_answer[msg.from.id] = ""
            const payment_link = await createPaymentLink(amount, msg.from.id);
            if (payment_link.error) {
                return await api.sendMessage(msg.from.id, `⚠️ <b>${payment_link.error}</b>`, { parse_mode: "HTML" });
            }
            return await api.sendMessage(msg.from.id, `💰 <b>Deposit Amount: ${amount} USDT</b>\n\nPlease click the button below to proceed with the deposit.`, {
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [[{
                        text: "💸 Click to Add Funds",
                        web_app: {
                            url: payment_link.payment_url
                        }
                    }]]
                }
            });
        } catch (error) {
            return await api.sendMessage(msg.from.id, "⚠️ <b>An error occurred. Please try again.</b>", { parse_mode: "HTML" });
        }
    }

    if(wait_for == "withdraw_amount") {
        try {
            if (!msg?.text) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid amount.</b>", { parse_mode: "HTML" });
            }
            const amount = parseFloat(msg.text);
            const user = await UserModel.findOne({ _id: msg.from.id });
            if(!user) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>User not found.</b>", { parse_mode: "HTML" });
            }
            if (isNaN(amount) || amount < settings.min_withdraw || amount > user.balance.winnings) {
                return await api.sendMessage(msg.from.id, `⚠️ <b>Please enter a valid amount. Minimum: ${settings.min_withdraw.toFixed(2)} USDT & Maximum: ${user.balance.winnings.toFixed(2)} USDT</b>`, { parse_mode: "HTML" });
            }
            wait_for_answer[msg.from.id] = ""
            const res = await createPayout(amount, user.wallet, msg.from.id);
            if (res.error) {
                return await api.sendMessage(msg.from.id, `⚠️ <b>${res.error}</b>`, { parse_mode: "HTML" });
            }
            user.balance.winnings -= parseFloat(amount).toFixed(2);
            await user.save();
            return await api.sendMessage(
                msg.from.id,
                `<b>✅ Withdrawal Request Submitted</b>\n\n` +
                `<b>💰 Amount:</b> <code>${amount.toFixed(2)} USDT</code>\n` +
                `<b>📬 Wallet:</b> <code>${user.wallet}</code>\n` +
                `<i>Your request is being processed and will be completed shortly.</i>`,
                { parse_mode: "HTML" }
            );
        } catch (error) {
            return await api.sendMessage(msg.from.id, "⚠️ <b>An error occurred. Please try again.</b>", { parse_mode: "HTML" });
        }
    }


    // Admin Side

    if (admin_wait_for[msg.from.id] == "user_info") {
        try {
            if (!msg?.text) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid user ID.</b>", { parse_mode: "HTML" });
            }
            const user_id = msg.text;
            if(isNaN(user_id)) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid user ID.</b>", { parse_mode: "HTML" });
            }
            const user = await UserModel.findOne({ _id: user_id });
            if (!user) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>User not found.</b>", { parse_mode: "HTML" });
            }
            admin_wait_for[msg.from.id] = ""
            return await api.sendMessage(
                msg.from.id,
                `<b>ℹ️ User Info</b>\n\n` +

                `<b>👤 Personal</b>\n` +
                `<b>🆔 ID:</b> <code>${user._id}</code>\n` +
                `<b>👤 Name:</b> ${user.first_name}${user.last_name ? " " + user.last_name : ""}\n` +
                `<b>📱 Username:</b> ${user.username ? "@" + user.username : "—"}\n` +
                `<b>👛 Wallet:</b> <code>${user.wallet || "Not set"}</code>\n\n` +

                `<b>💰 Balance</b>\n` +
                `<b>💵 Available:</b> <code>${user.balance.available.toFixed(2)} USDT</code>\n` +
                `<b>💳 Deposit:</b> <code>${user.balance.deposit.toFixed(2)} USDT</code>\n` +
                `<b>💸 Payout:</b> <code>${user.balance.payout.toFixed(2)} USDT</code>\n` +
                `<b>🎁 Referral:</b> <code>${user.balance.referral.toFixed(2)} USDT</code>\n` +
                `<b>📈 Gain:</b> <code>${user.balance.gain.toFixed(2)} USDT</code>\n` +
                `<b>📉 Loss:</b> <code>${user.balance.loss.toFixed(2)} USDT</code>\n` +
                `<b>🏆 Winnings:</b> <code>${user.balance.winnings.toFixed(2)} USDT</code>\n\n` +

                `<b>👥 Referral</b>\n` +
                `<b>👥 Invites:</b> <code>${user.invites}</code>\n` +
                `<b>🎁 Inviter:</b> <code>${user.inviter || "—"}</code>\n\n` +

                `<b>📅 Joined:</b> ${user.createdAt.toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                }).toUpperCase()}`,
                {
                    parse_mode: "HTML",
                    reply_markup: {
                        keyboard: keys.admin_key,
                        resize_keyboard: true,
                    },
                    reply_to_message_id: msg.message_id
                }
            );
        } catch (error) {
            return await api.sendMessage(msg.from.id, "⚠️ <b>An error occurred. Please try again.</b>", { parse_mode: "HTML" });
        }
    }

    if(admin_wait_for[msg.from.id] == "update_balance_user_id") {
        try {
            if(!msg?.text) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid user ID.</b>", { parse_mode: "HTML" });
            }
            const user_id = msg.text;
            if(isNaN(user_id)) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid user ID.</b>", { parse_mode: "HTML" });
            }
            const user = await UserModel.findOne({ _id: user_id });
            if (!user) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>User not found.</b>", { parse_mode: "HTML" });
            }
            admin_wait_for[msg.from.id] = ""
            return await api.sendMessage(
                msg.from.id,
                `<b>🔄 Update Balance</b>`,
                {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [[{
                            text: "Update Available Balance",
                            callback_data: `/update_balance A ${user_id}`
                        }], [{
                            text: "Update Payout Balance",
                            callback_data: `/update_balance P ${user_id}`
                        }], [{
                            text: "Update Deposit Balance",
                            callback_data: `/update_balance D ${user_id}`
                        }], [{
                            text: "Update Referral Balance",
                            callback_data: `/update_balance R ${user_id}`
                        }], [{
                            text: "Update Gain Balance",
                            callback_data: `/update_balance G ${user_id}`
                        }], [{
                            text: "Update Loss Balance",
                            callback_data: `/update_balance L ${user_id}`
                        }], [{
                            text: "Update Winnings Balance",
                            callback_data: `/update_balance W ${user_id}`
                        }]],
                    }
                }
            );
        } catch (error) {
            return await api.sendMessage(msg.from.id, "⚠️ <b>An error occurred. Please try again.</b>", { parse_mode: "HTML" });
        }
    } 

    if(admin_wait_for[msg.from.id] == "update_balance") {
        try {
            const {key: type, user_id} = storage[msg.from.id];
            if(!user_id) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid user ID.</b>", { parse_mode: "HTML" });
            }
            if(isNaN(user_id)) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid user ID.</b>", { parse_mode: "HTML" });
            }
            if(!type) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid type.</b>", { parse_mode: "HTML" });
            }
            const user = await UserModel.findOne({ _id: user_id });
            if (!user) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>User not found.</b>", { parse_mode: "HTML" });
            }
            const amount = parseFloat(msg.text);
            if (isNaN(amount) || amount <= 0) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid amount.</b>", { parse_mode: "HTML" });
            }
            user.balance[type] += amount;
            await user.save();
            admin_wait_for[msg.from.id] = ""
            return await api.sendMessage(msg.from.id, `✅ <b>Balance updated successfully.\n\nType: ${type}\nUser ID: ${user_id}\n${type.charAt(0).toUpperCase() + type.slice(1)}: ${amount.toFixed(2)} USDT</b>`, { parse_mode: "HTML" });
        } catch (error) {
            return await api.sendMessage(msg.from.id, "⚠️ <b>An error occurred. Please try again.</b>", { parse_mode: "HTML" });
        }
    }

     if(admin_wait_for[msg.from.id] == "ban_user_id") {
        try {
            if(!msg?.text) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid user ID.</b>", { parse_mode: "HTML" });
            }
            const user_id = msg.text;
            if(isNaN(user_id)) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid user ID.</b>", { parse_mode: "HTML" });
            }
            const user = await UserModel.findOne({ _id: user_id });
            if (!user) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>User not found.</b>", { parse_mode: "HTML" });
            }
            if(user.is_banned) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>User is already banned.</b>", { parse_mode: "HTML" });
            }
            user.is_banned = true;
            await user.save();
            admin_wait_for[msg.from.id] = ""
            api.sendMessage(user_id, "⚠️ <b>You have been banned from using this bot. Contact the admin for more information.</b>", { parse_mode: "HTML" });
            return await api.sendMessage(msg.from.id, `✅ <b>User ${user_id} has been banned successfully.</b>`, { parse_mode: "HTML" });
        } catch (error) {
            return await api.sendMessage(msg.from.id, "⚠️ <b>An error occurred. Please try again.</b>", { parse_mode: "HTML" });
        }
    }

     if(admin_wait_for[msg.from.id] == "unban_user_id") {
        try {
            if(!msg?.text) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid user ID.</b>", { parse_mode: "HTML" });
            }
            const user_id = msg.text;
            if(isNaN(user_id)) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>Please enter a valid user ID.</b>", { parse_mode: "HTML" });
            }
            const user = await UserModel.findOne({ _id: user_id });
            if (!user) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>User not found.</b>", { parse_mode: "HTML" });
            }
            if(!user.is_banned) {
                return await api.sendMessage(msg.from.id, "⚠️ <b>User is not banned.</b>", { parse_mode: "HTML" });
            }
            user.is_banned = false;
            await user.save();
            admin_wait_for[msg.from.id] = ""
            api.sendMessage(user_id, "✅ <b>You have been unbanned from using this bot.</b>", { parse_mode: "HTML" });
            return await api.sendMessage(msg.from.id, `✅ <b>User ${user_id} has been unbanned successfully.</b>`, { parse_mode: "HTML" });
        } catch (error) {
            return await api.sendMessage(msg.from.id, "⚠️ <b>An error occurred. Please try again.</b>", { parse_mode: "HTML" });
        }
    }

    if(admin_wait_for[msg.from.id] == "broadcast_message") {
        try {
            const broadcast_id = msg.message_id
            storage[msg.from.id]["broadcast_id"] = broadcast_id
            await api.copyMessage(msg.from.id, msg.from.id, broadcast_id);
            admin_wait_for[msg.from.id] = ""
            return await api.sendMessage(msg.from.id, `✅ <b>Are you sure to send this broadcast.</b>`, {
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [[{
                        text: "❌ No",
                        callback_data: "cancel_broadcast"
                    }, {
                        text: "✅ Yes",
                        callback_data: "confirm_broadcast"
                    }]],
                    resize_keyboard: true
                }
             });
        } catch (error) {
            return await api.sendMessage(msg.from.id, "⚠️ <b>An error occurred. Please try again.</b>", { parse_mode: "HTML" });
        }
    }

})