import mongoose, { model } from 'mongoose'
import DaySchema from './Day.schema'
import { IDayDocument } from './Day.types'

mongoose.Promise = global.Promise

export default mongoose.models.Day || model<IDayDocument>('Day', DaySchema)
