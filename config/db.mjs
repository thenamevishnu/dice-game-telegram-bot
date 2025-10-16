import { connect } from "mongoose"

export const db = {
    config: async () => {
        try {
            const { connection: { db: { databaseName } } } = await connect(process.env.MONGO_URL, {
                dbName: process.env.MONGO_DB,
                autoIndex: false
            })
            console.log(`Connected to database ${databaseName}`)
        } catch (error) {
            console.log(`Error connecting to database: ${error}`)
        }
    }
}