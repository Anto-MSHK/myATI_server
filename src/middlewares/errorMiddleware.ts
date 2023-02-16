import { ErrorRequestHandler } from 'express'
import { ApiError } from '../exceptions/API/api-error'
import { RT } from '../routes/resTypes'

export const errorMiddleware: ErrorRequestHandler<Record<string, any>, RT> = (err, req, res, next) => {
  console.log(err)

  if (err instanceof ApiError) {
    if (err.problemField) {
      return res.status(err.status).json({
        status: err.status_description,
        messages: [{ problemField: err.problemField, description: err.message_api }],
      })
    }
    return res
      .status(err.status)
      .json({ status: err.status_description, messages: [{ error: err.message, description: err.message_api }] })
  } else {
    return res.status(500).json({ status: 'UNKNOWN_ERROR' })
  }
}
