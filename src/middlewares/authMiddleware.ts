import { NextFunction, Request, RequestHandler } from 'express'
import { RT } from '../routes/resTypes'
import jwt from 'jsonwebtoken'

type CustomRequest = Request & { user?: any }

const authMiddleware: RequestHandler<Record<string, any>, RT> = (req: CustomRequest, res, next: NextFunction) => {
  if (req.method === 'OPTIONS') next()
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(400).json({
        status: 'INVALID_DATA',
        messages: [{ description: 'Операция недоступна пользователям, без специальных прав!' }],
      })
    }
    const decodedData = jwt.verify(token, process.env.SECRET_PASSWORD as jwt.Secret)
    req.user = decodedData
    next()
  } catch (e) {
    console.log(e)
    return res.status(400).json({
      status: 'INVALID_DATA',
      messages: [{ description: 'Операция недоступна пользователям, без специальных прав!' }],
    })
  }
}
export default authMiddleware
