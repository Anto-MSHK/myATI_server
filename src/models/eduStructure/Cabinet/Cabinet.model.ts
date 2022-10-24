import { model } from 'mongoose'
import { ICabinetDocument } from './Cabinet.types'
import CabinetSchema from './Cabinet.schema'

export default model<ICabinetDocument>('Cabinet', CabinetSchema)
