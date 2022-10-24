import { Document } from 'mongoose'
export interface IUser {
  login: string
  password: string
  role: 'Admin' | 'Elder' | 'Redactor'
  group_id?: string
}

export interface IUserDocument extends IUser, Document {}
