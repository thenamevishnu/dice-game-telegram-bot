import { model, Schema } from "mongoose";

const schema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
    },
    username: {
        type: String,
    },
    balance: {
        available: {
            type: Number,
            default: 0
        },
        payout: {
            type: Number,
            default: 0
        },
        deposit: {
            type: Number,
            default: 0
        },
        referral: {
            type: Number,
            default: 0
        },
        gain: {
            type: Number,
            default: 0
        },
        loss: {
            type: Number,
            default: 0
        },
        winnings: {
            type: Number,
            default: 0
        }
    },
    is_banned: {
        type: Boolean,
        default: false
    },
    invites: {
        type: Number,
        default: 0
    },
    inviter: {
        type: Number,
        default: 0
    },
    wallet: {
        type: String
    }
}, {
    timestamps: true
})

export const UserModel = model("users", schema)