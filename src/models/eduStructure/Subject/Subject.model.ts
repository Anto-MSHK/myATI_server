import mongoose, { model } from 'mongoose'
import SubjectSchema from './Subject.schema'
import { ISubjectDocument } from './Subject.types'

mongoose.Promise = global.Promise

export default mongoose.models.Subject || model<ISubjectDocument>('Subject', SubjectSchema)
