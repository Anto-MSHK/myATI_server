import mongoose, { model } from 'mongoose'
import { ITokenDocument } from './Token.types'
import TokenSchema from './Token.schema'

mongoose.Promise = global.Promise

export default mongoose.models.Token || model<ITokenDocument>('Token', TokenSchema)
