import { model } from 'mongoose'
import DaySchema from './Day.schema'
import { IDayDocument } from './Day.types'

export default model<IDayDocument>('Day', DaySchema)
