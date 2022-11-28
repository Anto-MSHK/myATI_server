import mongoose, { model } from 'mongoose'
import { IGroupDocument } from './Group.types'
import GroupSchema from './Group.schema'

mongoose.Promise = global.Promise

export default mongoose.models.Group || model<IGroupDocument>('Group', GroupSchema)
