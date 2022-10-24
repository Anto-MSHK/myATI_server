import { model } from 'mongoose'
import { IGroupDocument } from './Group.types'
import GroupSchema from './Group.schema'

export default model<IGroupDocument>('Group', GroupSchema)
