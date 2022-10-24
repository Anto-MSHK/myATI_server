import { RequestHandler } from 'express'
import { validationController } from './validationController'
import User from '@src/models/User/User.model'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import config from 'config'
import { BT_login } from '../routes/authRouter/auth.types'
import { IUserDocument } from '../models/User/User.types'
import { RT } from '@src/routes/resTypes'
import { errorsMSG } from '../exceptions/API/errorsConst'
import { BT_addRights } from '../routes/authRouter/auth.types'
import Role from '@src/models/Role'
import UserTokenService from '@src/services/UserTokenService'
import { ApiError } from '../exceptions/API/api-error'

interface TokenData {
  token: string
  expiresIn: string
}
export interface DataStoredInToken {
  id: string
  role: string
}

const generateAccessToken = (user: IUserDocument): TokenData => {
  const expiresIn = '24h'
  const secret = config.get<jwt.Secret>('secret')
  const payload: DataStoredInToken = {
    id: user._id,
    role: user.role,
  }
  return {
    expiresIn,
    token: jwt.sign(payload, secret, { expiresIn }),
  }
}

class AuthController {
  addRights: RequestHandler<Record<string, any>, RT, BT_addRights, any> = async (req, res, next) => {
    try {
      validationController(req, res)

      const { login, password, role, group_id } = req.body
      const candidate = await User.findOne({ login, role })

      if (candidate) {
        throw ApiError.INVALID_DATA(errorsMSG.ALREADY_EXIST)
      }

      const hashPassword = bcrypt.hashSync(password, 7)

      const userRole = await Role.findOne({ value: role })

      if (!userRole) {
        throw ApiError.INVALID_REQUEST(errorsMSG.NOT_EXIST)
      }

      const user = new User({
        login,
        password: hashPassword,
        role: userRole.value,
        group_id,
      })

      await user.save()

      const tokens = UserTokenService.generateTokens({ id: user._id, role: user.role })
      await UserTokenService.saveToken(user._id, tokens.refreshToken)
      res.cookie('refreshToken', tokens.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })

      return res.json({ status: 'OK', result: { ...tokens, user: { id: user._id, role: user.role } } })
    } catch (e) {
      next(e)
    }
  }

  login: RequestHandler<Record<string, any>, RT, BT_login, any> = async (req, res, next) => {
    try {
      validationController(req, res)

      const { login, password } = req.body
      const user = await User.findOne({ login })
      if (!user) {
        throw ApiError.INVALID_DATA(errorsMSG.INCORRECT, undefined, 'login')
      }
      const validPassword = bcrypt.compareSync(password, user.password)
      if (!validPassword) {
        throw ApiError.INVALID_DATA(errorsMSG.INCORRECT, undefined, 'password')
      }
      const tokens = UserTokenService.generateTokens({ id: user._id, role: user.role })
      await UserTokenService.saveToken(user._id, tokens.refreshToken)
      res.cookie('refreshToken', tokens.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })

      return res.json({ status: 'OK', result: { ...tokens, user: { id: user._id, role: user.role } } })
    } catch (e) {
      next(e)
    }
  }

  getAllUsers: RequestHandler<Record<string, any>, RT, BT_login, any> = async (req, res, next) => {
    try {
      const users = await User.find()
      return res.json({ result: users, status: 'OK' })
    } catch (e) {
      next(e)
    }
  }
}

export default new AuthController()
