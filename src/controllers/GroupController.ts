import { RequestHandler } from 'express'
import { validationController } from './validationController'
import GroupService from '../services/GroupService'
import {
  BT_addGroup,
  BT_changeGroup,
  BT_deleteGroup,
  QT_changeGroup,
  QT_deleteGroup,
  QT_getGroup,
} from '../routes/groupRouter/group.types'
import { RT } from '../routes/resTypes'

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
      const { name, faculty, course } = req.query
      const groups = await GroupService.getGroups(name, faculty, course)
      return res.json({ status: 'OK', result: groups })
    } catch (e) {
      console.log(e)
      next(e)
    }
  }
}

export default new GroupController()
