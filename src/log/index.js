import { blue, yellow, red, green, cyan, magenta, gray } from "chalk"

export const logError = (...args) => { console.log(red(...args)) }

export const logVerbose = (...args) => { console.log(verbose(...args)) }

export const logWarn = (...args) => { console.log(yellow(...args)) }

export const logInfo = (...args) => { console.log(blue(...args)) }

export const important = cyan.bold

export const tags = yellow

export const verbose = gray

export const system = green
