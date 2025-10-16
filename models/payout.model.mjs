import { model, Schema } from "mongoose";

const payoutSchema = new Schema({
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
    currency: {
        type: String,
        required: true
    },
    network: {
        type: String,
        required: true
    },
    tx_hash: {
        type: String,
        required: true
    },
    address: {
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
    }
}, {
    timestamps: true
});

export const PayoutModel = model("payouts", payoutSchema);
