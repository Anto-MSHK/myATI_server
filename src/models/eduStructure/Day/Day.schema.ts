import { Schema } from 'mongoose'
import * as mongoose from 'mongoose'

const ObjectId = mongoose.Schema.Types.ObjectId

const DaySchema = new Schema({
  dayOfWeek: { type: String, required: true },
  isWeekend: { type: Boolean, required: true, default: false },
  group_id: { type: ObjectId, required: true },
})

export default DaySchema
