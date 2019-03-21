import { Dumper } from "./dumper"

export * from "./db"
export * from "./dumper"
export const run =
    async (account, mongoUrl, retryTimeSpan = 10000) =>
        (new Dumper(account, mongoUrl || "mongodb://localhost/actions", retryTimeSpan)).run()
