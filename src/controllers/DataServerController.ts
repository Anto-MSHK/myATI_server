import { RequestHandler } from 'express'
import { RT } from '@src/routes/resTypes'
import Manager from '../index'

class DataServerController {
  getData: RequestHandler<Record<string, any>, RT, any, any> = async (req, res, next) => {
    try {
      // validationController(req, res)
      let state = await Manager.checkStateFile()

      return res.json({ status: 'OK', result: { ...state } })
    } catch (e) {
      next(e)
    }
  }
}

export default new DataServerController()
