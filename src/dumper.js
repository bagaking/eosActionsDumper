import { ReadingPlayer } from "eosplayer"
import { actsToActions, DB } from "./db"
import { forMs } from "kht"
import { important, logError, logInfo, logVerbose, tags } from "./log"

const CONCURRENT_COUNT = 5
const QUERY_ONCE = 100
const MERGE_MAX = 1000
const QUEUE_LENGTH_MAX = 20

function pushActions (queue, actions) {
    const actionStr = actions.length > 0 ? `${actions[0]._id} -> ${actions[actions.length - 1]._id} (${actions.length})` : "empty"
    logVerbose(" -", tags(actionStr), "actions found, queue length:", queue.length > 10 ? tags(queue.length) : queue.length)
    if (queue.length > 0 && (queue[queue.length - 1].length + actions.length) <= MERGE_MAX) {
        queue[queue.length - 1] = [...queue[queue.length - 1], ...actions]
    } else {
        queue.push(actions)
    }
}

export class Dumper {
    constructor (account, mongoUrl = "mongodb://localhost/actions", retryTimeSpan = 10000) {
        this.queue = []
        this.account = account
        this.mongoUrl = mongoUrl
        this.retryTimeSpan = retryTimeSpan
        this.openState = false
    }

    async init () {
        this.player = new ReadingPlayer({
            urls: [
                "https://eos.greymass.com",
                "https://proxy.eosnode.tools"
            ]
        })
        this.mongo = await new Promise((resolve) => {
            const db = new DB(this.mongoUrl, this.account, resolve)
        })
        this.actionCount = await this.player.chain.getActionCount(this.account)
        console.log("initialed", this.account)
        return this
    }

    async close () {
        await Promise.resolve(this.mongo.close())
        await forMs(3000)
    }

    async nextPos () {
        const lastEntry = await this.mongo.actions.find().sort({ _id: -1 }).limit(1)
        const max = lastEntry.length > 0 ? lastEntry[0]._id : -1
        return max + 1
    }

    async mongoWorker () {
        while (true) {
            if (this.queue.length <= 0) {
                if (!this.openState) {
                    break
                }
                await forMs(5000)
                continue
            }
            let actions = this.queue.shift()
            if (!actions || actions.length <= 0) {
                console.log("popToMongo: empty acts")
                await forMs(2000)
                continue
            } else {
                await forMs(500)
            }
            const tStart = Date.now()
            const pos = await this.nextPos()
            if (actions[0]._id !== pos) {
                logError(`[Error] id not match - should be ${pos}, got ${actions[0]._id}`)
                let subActions = []
                for (let i = 1; i < actions.length; i++) {
                    if (actions[i]._id === pos) {
                        subActions = actions.slice(i)
                        break
                    }
                }
                actions = subActions
                logError(actions.length <= 0
                    ? "   throw away"
                    : `   try use subArray at ${pos} : from ${actions[0]._id} to ${actions[actions.length - 1]._id}`)
            }
            for (let i = 1; i < actions.length; i++) {
                if (actions[i]._id !== actions[i - 1]._id + 1) {
                    logError(`[Error] id not match - should be ${pos}, got ${actions[0]._id}`)
                    break
                }
            }
            if (actions.length <= 0) {
                continue
            }
            // console.log("insertMany - ", actions)
            await this.mongo.actions.insertMany(actions)
            const percent = Math.floor(actions[actions.length - 1]._id * 100 / this.actionCount) + "%"
            logVerbose(
                " -- insert entries into", important(this.account), tags(`(${Date.now() - tStart}ms)`),
                "from:", tags(actions[0]._id),
                "to:", tags(actions[actions.length - 1]._id),
                "length:", tags(actions.length),
                "insert count:", tags(actions.length), "progress:", tags(percent),
                "at:", new Date()
            )
        }
    }

    async sync () {
        this.openState = true
        const tEnter = Date.now()
        while (true) {
            if (this.queue.length > QUEUE_LENGTH_MAX) { // heap protection
                await forMs(1000)
                continue
            }
            const pos = await this.nextPos()

            const percent = Math.floor(pos * 100 / this.actionCount) + "%"
            logVerbose(
                important(this.account),
                "START ===> ", tags("(", percent, ":", pos, "/", this.actionCount, ")"))
            await this.player.chain.getAllActionsBatch(
                this.account,
                (acts) => {
                    const actions = actsToActions(acts)
                    pushActions(this.queue, actions)
                },
                pos,
                QUERY_ONCE,
                CONCURRENT_COUNT
            )
            if (this.retryTimeSpan < 0) {
                break
            }
            await forMs(this.retryTimeSpan)
            logInfo("-- End")
        }
        this.openState = false
        logInfo(`${this.account} code exit ${Date.now() - tEnter}`)
    }

    async run () {
        await this.init()
        this.sync()
        await this.mongoWorker()
        await this.close()
    }
}
