import { NextFunction, Request, RequestHandler, Response } from 'express'
import jwt from 'jsonwebtoken'
import { DataStoredInToken } from '@src/controllers/AuthController'
import { RT } from '@src/routes/resTypes'

const roleMiddleware =
  (rightsLevel: number): RequestHandler<Record<string, any>, RT> =>
  (req, res, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      if (!token) {
        return res.status(400).json({
          status: 'INVALID_DATA',
          messages: [{ description: 'Операция недоступна пользователям, без специальных прав!' }],
        })
      }
      const user = jwt.verify(token, process.env.SECRET_PASSWORD as jwt.Secret) as DataStoredInToken

      switch (rightsLevel) {
        case 1:
          if (user.role === 'Admin' || user.role === 'Redactor' || user.role === 'Elder') {
            next()
          } else {
            res.status(400).json({
              status: 'INVALID_DATA',
              messages: [{ description: 'Операция требует больших прав доступа!' }],
            })
          }
          break
        case 2:
          if (user.role === 'Admin') {
            next()
          } else {
            res.status(400).json({
              status: 'INVALID_DATA',
              messages: [{ description: 'Операция требует больших прав доступа!' }],
            })
          }
          break
        default:
          res.status(500).json({ status: 'UNKNOWN_ERROR' })
          break
      }
    } catch (e) {
      console.log(e)
      return res.status(400).json({
        status: 'INVALID_DATA',
        messages: [{ description: 'Операция недоступна пользователям, без специальных прав!' }],
      })
    }
  }
export default roleMiddleware
