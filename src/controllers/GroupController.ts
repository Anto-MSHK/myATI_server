import { RequestHandler } from 'express'
import { validationController } from './validationController'
import GroupService from '@src/services/GroupService'
import {
  BT_addGroup,
  BT_changeGroup,
  BT_deleteGroup,
  QT_changeGroup,
  QT_deleteGroup,
  QT_getGroup,
} from '@src/routes/groupRouter/group.types'
import { RT } from '@src/routes/resTypes'

class GroupController {
  addGroup: RequestHandler<Record<string, any>, RT, BT_addGroup, any> = async (req, res, next) => {
    try {
      validationController(req, res)
      const { name, faculty, elder_id } = req.body
      const days = await GroupService.addGroup(name, faculty, elder_id)
      return res.json({ status: 'OK', result: days })
    } catch (e) {
      next(e)
    }
  }

  changeGroup: RequestHandler<Record<string, any>, RT, BT_changeGroup, QT_changeGroup> = async (req, res, next) => {
    try {
      validationController(req, res)

      const { name } = req.query
      await GroupService.changeGroup(name, req.body)
      return res.json({ status: 'OK' })
    } catch (e) {
      next(e)
    }
  }

  deleteGroup: RequestHandler<Record<string, any>, RT, BT_deleteGroup, QT_deleteGroup> = async (req, res, next) => {
    try {
      validationController(req, res)

      const { name } = req.query
      await GroupService.deleteGroup(name)
      return res.json({ status: 'OK' })
    } catch (e) {
      next(e)
    }
  }

  getGroups: RequestHandler<Record<string, any>, RT, any, QT_getGroup> = async (req, res, next) => {
    try {
      const groups = await GroupService.getGroups(req.query.name)
      return res.json({ status: 'OK', result: groups })
    } catch (e) {
      console.log(e)
      next(e)
    }
  }
}

export default new GroupController()
