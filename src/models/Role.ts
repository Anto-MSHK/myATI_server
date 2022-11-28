import mongoose, { model, Schema } from 'mongoose'

const Role = new Schema({
  value: { type: String, unique: true, default: 'none' },
})

mongoose.Promise = global.Promise

export default mongoose.models.Role || model('Role', Role)
