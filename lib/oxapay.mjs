import axios from "axios";

const oxapay = axios.create({
    baseURL: process.env.OXAPAY_BASE_URL
})

export const createPaymentLink = async (amount, user_id) => {

    const headers = {
        'merchant_api_key': process.env.OXAPAY_MERCHANT,
        'Content-Type': 'application/json'
    };

    const data = {
        amount,
        currency: "USDT",
        lifetime: 120,
        fee_paid_by_payer: 0,
        under_paid_coverage: 0,
        to_currency: "USDT",
        order_id: `${crypto.randomUUID()}`,
        description: `${user_id}`,
        callback_url: `${process.env.SERVER_BASE_URL}/payment/callback`
    };

    try {
        const { data: res } = await oxapay.post(process.env.OXAPAY_INVOICE_ENDPOINT, data, { headers });
        if (res.status === 200) return { payment_url: res.data.payment_url };
        return { error: res.data.message };
    } catch (error) {
        return { error: error.message };
    }
}

export const createPayout = async (amount, address, user_id) => {
    const headers = {
        "Content-Type": "application/json",
        "payout_api_key": process.env.OXAPAY_PAYOUT
    };

    const data = {
        amount,
        currency: "USDT",
        network: "TRC20",
        address,
        description: `${user_id}`,
        callback_url: `${process.env.SERVER_BASE_URL}/payment/callback`
    };

    try {
        const { data: res } = await oxapay.post(process.env.OXAPAY_PAYOUT_ENDPOINT, data, { headers });
        if (res.status === 200) return { status: res.status };
        return { error: res.message };
    } catch (error) {
        return { error: error.response?.data.message || error.message };
    }
}