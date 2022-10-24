import { model } from 'mongoose'
import { IUserDocument } from './User.types'
import UserSchema from './User.schema'

export default model<IUserDocument>('User', UserSchema)
