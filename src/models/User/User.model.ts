import mongoose, { model } from 'mongoose'
import { IUserDocument } from './User.types'
import UserSchema from './User.schema'

mongoose.Promise = global.Promise

export default mongoose.models.User || model<IUserDocument>('User', UserSchema)
