import { Schema } from 'mongoose'
import * as mongoose from 'mongoose'

const ObjectId = mongoose.Schema.Types.ObjectId

const SubjectSchema = new Schema({
  title: { type: String, required: true, unique: true },
  types: [{ type: String }],
  cabinets_id: [{ type: ObjectId, ref: 'Cabinet' }],
})

export default SubjectSchema
