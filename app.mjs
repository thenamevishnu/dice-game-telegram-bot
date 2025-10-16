import express from "express"
import "./controllers/text.mjs";
import "./controllers/message.mjs";
import "./controllers/callback.mjs";
import "./controllers/admin.mjs";
import paymentRouter from "./controllers/payments.mjs";

import { db } from "./config/db.mjs";

await db.config()
const app = express()
app.use(express.json())
app.use("/payment", paymentRouter)

app.listen(process.env.PORT || 8080, () => {
    console.log(`Server started on port ${process.env.PORT || 8080}`)
})
