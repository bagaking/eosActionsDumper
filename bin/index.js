#!/usr/bin/env node

const { batch } = require("..")

const debug = require("debug")
debug.enable("error:*")

const Yargs = require("yargs")
const packageObj = require("../package.json")

const argv = Yargs
    .usage("Usage: eos-action-dumper <accounts> [Options]")
    .example("eos-action-dumper tonartstoken ctserver2111 --watch 2000")
    .option("watch", {
        alias: "w",
        default: -1,
        describe: "The watcher's retry time span. If the span is less than 0, only execute once."
    })
    .option("url", {
        alias: "u",
        default: "mongodb://localhost/actions",
        describe: "mongo connection string."
    })
    .help("h")
    .alias("h", "help")
    .alias("v", "version")
    .version(packageObj.version)
    .argv

const accounts = (typeof argv["_"] === "string") ? [ argv["_"] ] : argv["_"]

if (accounts.length <= 0) {
    Yargs.showHelp()
    process.exit(0)
}

batch(accounts.filter(s => s), argv.url, argv.watch)
