import { Dumper } from "./dumper"
import { important, logError, logInfo } from "./log"

export * from "./db"
export * from "./dumper"
export const run =
    async (account, mongoUrl, retryTimeSpan = 10000) =>
        (new Dumper(account, mongoUrl || "mongodb://localhost/actions", retryTimeSpan)).run()

export const batch = async (accounts, mongoUrl, retryTimeSpan = 10000) => {
    logInfo("dump batch:", important(...accounts))
    if (accounts.length <= 0) {
    } else if (accounts.length === 1) {
        await run(accounts[0], mongoUrl, retryTimeSpan)
    } else {
        let count = 0
        while (true) {
            console.log("Sync Round ", count++)
            for (const i in accounts) {
                try {
                    await run(accounts[i], mongoUrl, -1)
                } catch (ex) {
                    logError("dump actions for account", accounts[i], "failed\n", ex.message)
                }
            }
            if (retryTimeSpan < 0) {
                break
            }
        }
    }
}
