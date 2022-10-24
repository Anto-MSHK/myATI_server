import { model } from 'mongoose'
import { ILessonDocument } from './Lesson.types'
import LessonSchema from './Lesson.schema'

export default model<ILessonDocument>('Lesson', LessonSchema)
