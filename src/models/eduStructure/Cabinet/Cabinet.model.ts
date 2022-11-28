import mongoose, { model } from 'mongoose'
import { ICabinetDocument } from './Cabinet.types'
import CabinetSchema from './Cabinet.schema'

mongoose.Promise = global.Promise

export default mongoose.models.Cabinet || model<ICabinetDocument>('Cabinet', CabinetSchema)
