import {
  BT_addSubject,
  BT_addTeacher,
  BT_addCabinet,
  QT_uniformTypes,
  BT_changeCabinet,
  BT_changeTeacher,
  BT_changeSubject,
  QT_Subject,
  QT_Teacher,
} from '@src/routes/eduStructureRouter/eduStructure.types'
import { RequestHandler } from 'express'
import { RT } from '@src/routes/resTypes'
import { validationController } from './validationController'
import EduStructureService from '@src/services/EduStructureService'
import { errorsMSG } from '../exceptions/API/errorsConst'
import { ApiError } from '../exceptions/API/api-error'
import Subject from '@src/models/eduStructure/Subject/Subject.model'
import Cabinet from '@src/models/eduStructure/Cabinet/Cabinet.model'
import Lesson from '@src/models/eduStructure/Lesson/Lesson.model'
import Day from '@src/models/eduStructure/Day/Day.model'
import Group from '@src/models/Group/Group.model'
import { query } from 'express-validator'
import Teacher from '@src/models/eduStructure/Teacher/Teacher.model'

type ofChange = RequestHandler<
  Record<string, any>,
  RT,
  BT_changeSubject | BT_changeTeacher | BT_changeCabinet,
  QT_uniformTypes
>

type getSubjectT =
  | {
      title: string
      types?: string[] | undefined
      cabinets?: (string | undefined)[]
      teachers?: ({ name: string; degree: string } | undefined)[]
      groups?: (string | undefined)[]
    }
  | string[]

type getTeacherT =
  | {
      name: string
      degree: string | undefined
      subjects: (string | undefined)[]
      groups?: (string | undefined)[]
    }
  | { name: string; degree: string | undefined }
class EduStructureController {
  add =
    (model: any): RequestHandler<Record<string, any>, RT, BT_addSubject | BT_addTeacher | BT_addCabinet> =>
    async (req, res, next) => {
      try {
        validationController(req, res)

        const service = new EduStructureService(model, req.body)

        var result = await service.add()
        if (result.isAlreadyExist) throw ApiError.INVALID_DATA(errorsMSG.ALREADY_EXIST)
        return res.json({ status: 'OK', result: result.result })
      } catch (e) {
        next(e)
      }
    }

  getSubject =
    (): RequestHandler<Record<string, any>, RT<getSubjectT | getSubjectT[]>, any, QT_Subject> =>
    async (req, res, next) => {
      try {
        validationController(req, res)
        var cabArr: (string | undefined)[] = []
        var teachArr: ({ name: string; degree: string } | undefined)[] | undefined
        var groupArr: (string | undefined)[] = []
        if (req.query.title) {
          let result: getSubjectT
          const candidate = await Subject.findOne({ title: req.query.title })

          if (!candidate) throw ApiError.INVALID_REQUEST(errorsMSG.INCORRECT)
          cabArr = await Promise.all<any>(
            candidate.cabinets_id?.map(async (el): Promise<string | undefined> => {
              const candidateCabinet = await Cabinet.findById({ _id: el })
              if (candidateCabinet) {
                return candidateCabinet.item
              }
              return undefined
            })
          )
          const teachers = await Teacher.find({ subjects_id: { $elemMatch: { $eq: candidate._id } } })
          if (teachers)
            teachArr = await Promise.all<any>(
              teachers.map(async el => {
                return { name: el.name, degree: el.degree }
              })
            )
          else teachArr = undefined
          const lessons = await Lesson.find({
            $or: [{ 'data.topWeek.subject_id': candidate._id }, { 'data.lowerWeek.subject_id': candidate._id }],
          })
          if (lessons) {
            await Promise.all<any>(
              lessons.map(async (el): Promise<void> => {
                const day = await Day.findById({ _id: el.day_id })
                if (day) {
                  const group = await Group.findById({ _id: day.group_id })
                  if (group && groupArr.indexOf(group.name) === -1) {
                    groupArr.push(group.name)
                  }
                }
              })
            )
          }
          result = {
            title: candidate.title,
            types: candidate.types,
            cabinets: cabArr,
            teachers: teachArr,
            groups: groupArr,
          }
          return res.json({ status: 'OK', result: result })
        } else {
          let result: getSubjectT[] = []
          const candidates = await Subject.find({})
          result = await Promise.all<any>(
            candidates.map(async cand => {
              return cand.title
            })
          )
          return res.json({ status: 'OK', result: result })
        }
      } catch (e) {
        next(e)
      }
    }

  getTeacher =
    (): RequestHandler<Record<string, any>, RT<getTeacherT | getTeacherT[]>, any, QT_Teacher> =>
    async (req, res, next) => {
      try {
        validationController(req, res)
        var subjArr: (string | undefined)[] = []
        var teachArr: ({ name: string; degree: string } | undefined)[] | undefined
        var groupArr: (string | undefined)[] = []
        if (req.query.name) {
          let result: getTeacherT
          const candidate = await Teacher.findOne({ name: req.query.name })
          if (!candidate) throw ApiError.INVALID_REQUEST(errorsMSG.INCORRECT)
          if (candidate.subjects_id) {
            subjArr = await Promise.all<any>(
              candidate.subjects_id.map(async (el): Promise<string | undefined> => {
                const candidateSubject = await Subject.findById({ _id: el })
                if (candidateSubject) {
                  return candidateSubject.title
                }
                return undefined
              })
            )
            const lessons = await Lesson.find({
              $or: [{ 'data.topWeek.teacher_id': candidate._id }, { 'data.lowerWeek.teacher_id': candidate._id }],
            })
            if (lessons) {
              await Promise.all<any>(
                lessons.map(async (el): Promise<void> => {
                  const day = await Day.findById({ _id: el.day_id })
                  if (day) {
                    const group = await Group.findById({ _id: day.group_id })
                    if (group && groupArr.indexOf(group.name) === -1) {
                      groupArr.push(group.name)
                    }
                  }
                })
              )
            }
          }
          result = {
            name: candidate.name,
            degree: candidate.degree,
            subjects: subjArr,
            groups: groupArr,
          }
          return res.json({ status: 'OK', result: result })
        } else {
          let result: getTeacherT[] = []
          const candidates = await Teacher.find({})
          result = await Promise.all<any>(
            candidates.map(async cand => {
              return { name: cand.name, degree: cand.degree }
            })
          )
          return res.json({ status: 'OK', result: result })
        }
      } catch (e) {
        next(e)
      }
    }

  change =
    (model: any): ofChange =>
    async (req, res, next) => {
      try {
        validationController(req, res)

        const service = new EduStructureService(model, req.body, req.query)

        await service.change()
        return res.json({ status: 'OK' })
      } catch (e) {
        next(e)
      }
    }

  delete =
    (model: any): RequestHandler<Record<string, any>, RT, any, QT_uniformTypes> =>
    async (req, res, next) => {
      try {
        validationController(req, res)

        const service = new EduStructureService(model, undefined, req.query)

        await service.delete()
        return res.json({ status: 'OK' })
      } catch (e) {
        next(e)
      }
    }
}

export default new EduStructureController()
