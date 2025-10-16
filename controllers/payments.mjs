import { Router } from "express";
import crypto from "crypto"
import { PaymentModel } from "../models/payment.model.mjs";
import { api } from "../config/tg.mjs";
import { PayoutModel } from "../models/payout.model.mjs";
import { UserModel } from "../models/user.model.mjs";
import { settings } from "../config/bot.mjs";

const router = Router();

router.post("/callback", async (request, response) => {
    const { body: postData } = request
    const apiSecret = (postData.type === "invoice" || postData.type === "payment") ? process.env.OXAPAY_MERCHANT : process.env.OXAPAY_PAYOUT
    const hmacHeader = request.headers["hmac"]
    const calculatedHmac = crypto.createHmac("sha256", apiSecret).update(JSON.stringify(postData)).digest("hex")
    if(calculatedHmac != hmacHeader) {
        return response.status(400).json({
            message: "Invalid HMAC"
        })
    }
    const payer_id = postData.description
    if (postData.type == "invoice" || postData.type == "payment") {
        const payment = await PaymentModel.findOne({ track_id: postData.track_id });
        if (!payment) {
            await PaymentModel.create(postData);
            await api.sendMessage(payer_id, `<b>🧾 Your invoice created</b>\n\n<b>Order ID:</b> <code>${postData.order_id}</code>\n<b>Amount:</b> <code>${postData.amount.toFixed(2)} ${postData.currency}</code>\n<b>Value:</b> <code>${postData.value.toFixed(2)} ${postData.currency}</code>\n<b>Date:</b> <code>${new Date(postData.date * 1000).toLocaleString()}</code>`)
        } else if (payment && payment.status == "Paying" && postData.status == "Paid") {
            payment.status = "Paid"
            payment.txs = postData.txs
            await payment.save()
            await api.sendMessage(payer_id, `<b>✅ Your invoice paid</b>\n\n<b>Order ID:</b> <code>${postData.order_id}</code>\n<b>Amount:</b> <code>${postData.amount.toFixed(2)} ${postData.currency}</code>\n<b>Value:</b> <code>${postData.value.toFixed(2)} ${postData.currency}</code>\n<b>Date:</b> <code>${new Date(postData.date * 1000).toLocaleString()}</code>`)
            const user = await UserModel.findOne({ _id: payer_id });
            if (user) {
                user.balance.available += (parseFloat(postData.amount)).toFixed(2)
                user.balance.deposit += (parseFloat(postData.amount)).toFixed(2)
                await user.save()
                const inviter = await UserModel.findOne({ _id: user.inviter });
                if (inviter) {
                    inviter.balance.referral += (parseFloat(postData.amount) * (settings.ref_income / 100)).toFixed(2)
                    inviter.balance.available += (parseFloat(postData.amount) * (settings.ref_income / 100)).toFixed(2)
                    inviter.balance.gain += (parseFloat(postData.amount) * (settings.ref_income / 100)).toFixed(2)
                    await inviter.save()
                    api.sendMessage(inviter._id, `<b>🎉 You earned <code>${(parseFloat(postData.amount) * (settings.ref_income / 100)).toFixed(2)} ${postData.currency}</code> from referral</b>`, { parse_mode: "HTML" });
                }
            }
        }
    } else if (postData.type == "payout") {
        const payout = await PayoutModel.findOne({ track_id: postData.track_id });
        if (!payout) {
            await PayoutModel.create(postData);
            await api.sendMessage(payer_id, `<b>🧾 Your payout created</b>\n\n<b>Amount:</b> <code>${postData.amount.toFixed(2)} ${postData.currency}</code>\n<b>Value:</b> <code>${postData.value.toFixed(2)} ${postData.currency}</code>\n<b>Date:</b> <code>${new Date(postData.date * 1000).toLocaleString()}</code>\n📝 To: <code>${postData.address}</code>\n<b>🆔 Hash:</b> <code>${postData.tx_hash || "Generating hash..."}</code>`)
        } else if (payout && payout.status == "Confirming" && postData.status == "Confirmed") {
            payout.status = "Confirmed"
            payout.tx_hash = postData.tx_hash
            await payout.save()
            await api.sendMessage(payer_id, `<b>✅ Your payout confirmed</b>\n\n<b>Amount:</b> <code>${postData.amount.toFixed(2)} ${postData.currency}</code>\n<b>Value:</b> <code>${postData.value.toFixed(2)} ${postData.currency}</code>\n<b>Date:</b> <code>${new Date(postData.date * 1000).toLocaleString()}</code>\n📝 To: <code>${postData.address}</code>\n<b>🆔 Hash:</b> <code>${postData.tx_hash || "Generating hash..."}</code>`)
            const user = await UserModel.findOne({ _id: payer_id });
            if (user) {
                user.balance.payout += (parseFloat(postData.amount)).toFixed(2)
                await user.save()
            }
        } else if (payout && payout.status == "Confirming" && postData.status == "Failed") {
            payout.tx_hash = postData.tx_hash
            payout.status = "Failed"
            await payout.save()
            const user = await UserModel.findOne({ _id: payer_id });
            if (user) {
                user.balance.winnings += (parseFloat(postData.amount)).toFixed(2)
                await user.save()
            }
            await api.sendMessage(payer_id, `<b>❌ Your payout failed</b>\n\n<b>Amount:</b> <code>${postData.amount.toFixed(2)} ${postData.currency}</code>\n<b>Value:</b> <code>${postData.value.toFixed(2)} ${postData.currency}</code>\n<b>Date:</b> <code>${new Date(postData.date * 1000).toLocaleString()}</code>\n📝 To: <code>${postData.address}</code>\n<b>🆔 Hash:</b> <code>${postData.tx_hash || "Failed"}</code>`)
        }
    }
    return response.status(200).send({
        message: "OK"
    })
})

export default router
