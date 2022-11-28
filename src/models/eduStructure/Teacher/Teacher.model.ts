import mongoose, { model } from 'mongoose'
import TeacherSchema from './Teacher.schema'
import { ITeacherDocument } from './Teacher.types'

mongoose.Promise = global.Promise

export default mongoose.models.Teacher || model<ITeacherDocument>('Teacher', TeacherSchema)
