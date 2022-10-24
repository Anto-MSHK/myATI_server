import { model } from 'mongoose'
import SubjectSchema from './Subject.schema'
import { ISubjectDocument } from './Subject.types'

export default model<ISubjectDocument>('Subject', SubjectSchema)
