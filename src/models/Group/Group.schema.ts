import { Schema } from 'mongoose'
import * as mongoose from 'mongoose'

const ObjectId = mongoose.Schema.Types.ObjectId

const GroupSchema = new Schema({
  name: { type: String, required: true, index: true, unique: true, sparse: true },
  faculty: { type: String, required: true },
  messages_id: [{ type: ObjectId, ref: 'Message' }],
})

export default GroupSchema
