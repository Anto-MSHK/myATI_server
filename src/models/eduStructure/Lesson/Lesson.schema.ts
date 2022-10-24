import { Schema } from 'mongoose'
import * as mongoose from 'mongoose'

const ObjectId = mongoose.Schema.Types.ObjectId

const topWeek = new Schema({
  subject_id: { type: ObjectId, ref: 'Subject', required: true },
  type: { type: String },
  teacher_id: { type: ObjectId, ref: 'Teacher', required: true },
  cabinet_id: { type: ObjectId, ref: 'Cabinet' },
})
const lowerWeek = new Schema({
  subject_id: { type: ObjectId, ref: 'Subject' },
  type: { type: String },
  teacher_id: { type: ObjectId, ref: 'Teacher' },
  cabinet_id: { type: ObjectId, ref: 'Cabinet' },
})
const time = {
  from: { type: String },
  to: { type: String },
}

const LessonSchema = new Schema({
  count: { type: Number, required: true },
  time: time,
  day_id: { type: ObjectId, ref: 'Message', required: true },
  data: {
    topWeek: topWeek,
    lowerWeek: lowerWeek,
  },
})

export default LessonSchema
