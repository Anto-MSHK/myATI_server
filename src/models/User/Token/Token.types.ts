import { Document } from 'mongoose'
export interface IToken {
  user_id: string
  refreshToken: string
}

export interface ITokenDocument extends IToken, Document {}
