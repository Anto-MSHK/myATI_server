import mongoose, { model } from 'mongoose'
import TeacherInfoSchema from './TeacherInfo.schema'
import { ITeacherInfoDocument } from './TeacherInfo.types'

mongoose.Promise = global.Promise

export default mongoose.models.TeacherInfo || model<ITeacherInfoDocument>('TeacherInfo', TeacherInfoSchema)
