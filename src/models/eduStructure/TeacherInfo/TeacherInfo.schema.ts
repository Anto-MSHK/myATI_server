import { Schema } from 'mongoose'
import * as mongoose from 'mongoose'
var uniqueValidator = require('mongoose-unique-validator')

const ObjectId = mongoose.Schema.Types.ObjectId

const TeacherInfoSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: { unique: true, dropDups: true },
    unique: true,
    uniqueCaseInsensitive: true,
  },
  cathedra: { type: String, required: true },
  photo_url: { type: String },
  degree: { type: String },
  allInfo: [{ type: String }],
})
export default TeacherInfoSchema
