import { model, Schema } from "mongoose";

const schema = new Schema({
    track_id: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        required: true,
        default: "Paying"
    },
    type: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    sent_value: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    order_id: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Number,
        required: true
    },
    txs: [{
        status: {
            type: String,
            required: true
        },
        tx_hash: {
            type: String,
            required: true
        },
        sent_amount: {
            type: Number,
            required: true
        },
        received_amount: {
            type: Number,
            required: true
        },
        value: {
            type: Number,
            required: true
        },
        sent_value: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            required: true
        },
        network: {
            type: String,
            required: true
        },
        sender_address: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        rate: {
            type: Number,
            required: true
        },
        confirmations: {
            type: Number,
            required: true
        },
        auto_convert_amount: {
            type: Number,
            default: 0
        },
        auto_convert_currency: {
            type: String,
            default: "USDT"
        },
        date: {
            type: Number,
            required: true
        }
    }]
}, {
    timestamps: true
})

export const PaymentModel = model("payments", schema)