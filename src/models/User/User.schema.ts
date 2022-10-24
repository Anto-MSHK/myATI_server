import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'

const UserSchema = new Schema({
  login: { type: String, required: true },
  password: { type: String, required: true, unique: true },
  role: { type: String, required: true, ref: 'Role' },
  group_id: { type: ObjectId, ref: 'Group' },
})

export default UserSchema
