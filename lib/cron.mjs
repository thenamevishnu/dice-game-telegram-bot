import cron from "node-cron"
import { UserModel } from "../models/user.model.mjs"
import { api } from "../config/tg.mjs"

export const sendBroadcast = async (id, message_id, on_completed) => {
    const users = await UserModel.find({}, { _id: 1 })
    const task = cron.schedule("* * * * *", async () => {
        const user_list = users.splice(0, 10)
        if(user_list.length == 0) {
            on_completed()
            return task.stop() 
        }
        for (const user of user_list) {
            await api.copyMessage(user._id, id, message_id);
        }
    })
}