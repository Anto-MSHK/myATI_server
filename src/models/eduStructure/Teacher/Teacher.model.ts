import { model } from 'mongoose'
import TeacherSchema from './Teacher.schema'
import { ITeacherDocument } from './Teacher.types'

export default model<ITeacherDocument>('Teacher', TeacherSchema)
