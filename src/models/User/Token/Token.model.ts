import { model } from 'mongoose'
import { ITokenDocument } from './Token.types'
import TokenSchema from './Token.schema'

export default model<ITokenDocument>('Token', TokenSchema)
