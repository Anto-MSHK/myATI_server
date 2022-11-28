import mongoose, { model } from 'mongoose'
import { ILessonDocument } from './Lesson.types'
import LessonSchema from './Lesson.schema'

mongoose.Promise = global.Promise

export default mongoose.models.Lesson || model<ILessonDocument>('Lesson', LessonSchema)
