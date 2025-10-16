import express from "express"
import "./controllers/text.mjs";
import "./controllers/message.mjs";
import "./controllers/callback.mjs";
import "./controllers/admin.mjs";
import paymentRouter from "./controllers/payments.mjs";
import cronJob from "node-cron"

import { db } from "./config/db.mjs";
import server from "./controllers/server.mjs";

await db.config()
const app = express()
app.use(express.json())
app.use("/payment", paymentRouter)
app.use("/api", server)

cronJob.schedule("* * * * *", async () => {
    fetch(process.env.SERVER_BASE_URL + "/api").then(res => {
        return res.json()
    }).then(json => {
        console.log(json)
    }).catch(err => {
        return console.log(err)
    })
})

app.listen(process.env.PORT || 8080, () => {
    console.log(`Server started on port ${process.env.PORT || 8080}`)
})
