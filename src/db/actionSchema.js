import { Schema } from "mongoose"

export const ActionSchema = new Schema({
    _id: Number,
    act_name: String,
    act: Map,
    receipt: Object,
    block_num: Number,
    block_time: Date,
    global_action_seq: Number,
    trx_id: String
})

ActionSchema.index({ trx_id: 1 })

export function actsToActions (acts) {
    return acts.map(v => {
        let blockTime = v.action_trace.block_time
        blockTime = blockTime.endsWith("Z") ? blockTime : blockTime + "Z"
        return {
            _id: v.account_action_seq,
            act_name: v.action_trace.act.name,
            act: v.action_trace.act,
            receipt: v.action_trace.receipt,
            block_num: v.action_trace.block_num,
            block_time: new Date(blockTime),
            global_action_seq: v.global_action_seq,
            trx_id: v.action_trace.trx_id
        }
    })
}
