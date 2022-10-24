import { Schema } from 'mongoose'
import * as mongoose from 'mongoose'
var uniqueValidator = require('mongoose-unique-validator')

const ObjectId = mongoose.Schema.Types.ObjectId

const TeacherSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: { unique: true, dropDups: true },
    unique: true,
    uniqueCaseInsensitive: true,
  },
  degree: { type: String },
  subjects_id: [{ type: ObjectId, ref: 'Subject' }],
})
export default TeacherSchema
