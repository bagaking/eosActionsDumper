import Mongoose from "mongoose"
import { ActionSchema } from "./actionSchema"
import { logError, logInfo, logVerbose, system } from "../log"

const options = {
    useNewUrlParser: true,
    poolSize: 10, // 连接池中维护的连接数
    auto_reconnect: true,
    reconnectTries: Number.MAX_VALUE,
    keepAlive: 120
}

export class DB {
    constructor (conn = "mongodb://localhost/actions", account = "tonartstoken", cbConnected = null) {
        // this.db = mongoose.createConnection(conn, options)
        this.db = Mongoose.connect(conn, options)

        this.collectionName = account + "_v0_acts"
        this.actions = this.model(this.collectionName, ActionSchema)

        Mongoose.connection.removeAllListeners()

        Mongoose.connection.on("connected", () => {
            logInfo(system("Mongoose connection connected"), conn, ":", this.collectionName)
            if (cbConnected) cbConnected(this)
        })

        Mongoose.connection.on("disconnected", () => {
            logVerbose("Mongoose connection disconnected", conn, this.collectionName)
        })

        Mongoose.connection.on("error", () => {
            logError("[Error] Mongoose connection error", conn, this.collectionName)
        })
    }

    close () {
        Mongoose.connection.close()
    }

    model (tableName, schema) {
        this[tableName] = Mongoose.model(tableName, schema)
        return this[tableName]
    }
}
