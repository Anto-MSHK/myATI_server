import { Schema, model } from 'mongoose'

const Role = new Schema({
  value: { type: String, unique: true, default: 'none' },
})

export default model('Role', Role)
