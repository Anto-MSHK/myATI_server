import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
export const validationController = (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const jsonErrors: { problemField: string; description: string }[] = []
    errors.array().map(el => {
      jsonErrors.push({ problemField: el.param, description: el.msg })
    })
    return res.status(400).json({
      status: 'INVALID_REQUEST',
      messages: jsonErrors,
    })
  }
}
