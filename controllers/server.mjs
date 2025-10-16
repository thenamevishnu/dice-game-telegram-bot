import { Router } from "express";

const server = Router();

server.get("/", (_req, res) => {
    return res.status(200).send({ message: "Server is running" })
})

export default server
