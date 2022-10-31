import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import Token from '@src/models/User/Token/Token.model'
class UserTokenService {
  generateTokens = (payload: any) => {
    const accessToken = jwt.sign(payload, process.env.SECRET_PASSWORD as string, { expiresIn: '24h' })
    const refreshToken = jwt.sign(payload, process.env.SECRET_REFRESH as string, { expiresIn: '30d' })
    return {
      accessToken,
      refreshToken,
    }
  }
  saveToken = async (user_id: ObjectId, refreshToken: any) => {
    const tokenData = await Token.findOne({ user_id })
    if (tokenData) {
      tokenData.refreshToken = refreshToken
      return tokenData.save()
    }
    const token = await Token.create({ user_id, refreshToken })
    return token
  }
}
export default new UserTokenService()
