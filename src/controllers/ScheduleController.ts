import { validationController } from './validationController'
import { RequestHandler } from 'express'
import { RT } from '../routes/resTypes'
import { QT_getScheduleByGroup, QT_getScheduleByTeacher } from '../routes/scheduleRouter/schedule.types'
import Group from '../models/Group/Group.model'
import { IDayDocument } from '../models/eduStructure/Day/Day.types'
import Day from '../models/eduStructure/Day/Day.model'
import { errorsMSG } from '../exceptions/API/errorsConst'
import Lesson from '../models/eduStructure/Lesson/Lesson.model'
import { ILessonDocument } from '../models/eduStructure/Lesson/Lesson.types'
import Subject from '../models/eduStructure/Subject/Subject.model'
import Teacher from '../models/eduStructure/Teacher/Teacher.model'
import Cabinet from '../models/eduStructure/Cabinet/Cabinet.model'
import {
  subject,
  teacher,
  lessonDataG,
  lessonDataT,
  lessonG,
  lessonT,
  dayG,
  dayT,
} from '../routes/scheduleRouter/schedule.types'
import EduStructureService from '../services/EduStructureService'
import { ApiError } from '../exceptions/API/api-error'
import { ObjectId } from 'mongodb'
import { ObjectID } from 'bson'

type resultG = dayG[]
type resultT = dayT[]

var SubjectService = new EduStructureService(Subject)
var TeacherService = new EduStructureService(Teacher)
var CabinetService = new EduStructureService(Cabinet)

class ScheduleController {
  getScheduleByGroup: RequestHandler<Record<string, any>, RT<resultG>, any, QT_getScheduleByGroup> = async (
    req,
    res,
    next
  ) => {
    try {
      validationController(req, res)

      const { name } = req.query

      var group = await Group.findOne({ name })

      if (!group) throw ApiError.INVALID_DATA(errorsMSG.NOT_EXIST)

      var days: IDayDocument[] = await Day.find({ group_id: group._id })
      var result: resultG = []
      await Promise.all(
        days.map(async day => {
          let lessonsDB: ILessonDocument[] = await Lesson.find({ day_id: day._id })
          var lessons: (lessonG | undefined)[] = await Promise.all(
            lessonsDB.map(async lesson => {
              //* >=|=> top week <=|=<

              if (!lesson.data?.topWeek)
                return {
                  id: lesson.id,
                  count: +lesson.count + 1 + '',
                  time: lesson.time,
                  data: {},
                  special: lesson.special,
                } as lessonG

              let dataTop: lessonDataG = undefined
              let dataLower: lessonDataG = undefined
              //? ==< subject >==
              let subject: subject = { title: '' }
              subject.title = await SubjectService.getById(lesson.data.topWeek.subject_id).then(result => {
                return result as string
              })
              subject.type = lesson.data.topWeek.type

              if (subject.title !== 'нет данных') {
                //? ==< teachers >==
                let teacher: teacher = { name: '', degree: '' }
                await TeacherService.getById(lesson.data.topWeek.teacher_id).then(result => {
                  teacher = result as teacher
                })

                //? ==< cabinet >==
                let cabinet: string = ''
                cabinet = await CabinetService.getById(lesson.data.topWeek.cabinet_id).then(result => {
                  return result as string
                })

                //? ==< data >==
                dataTop = {
                  subject,
                  teacher,
                  cabinet,
                }
              } else dataTop = undefined

              var isLowerWeek = await Lesson.find({ _id: lesson._id, 'data.lowerWeek': { $exists: true } })
              if (!lesson.data.lowerWeek || isLowerWeek.length === 0) {
                return {
                  id: lesson.id,
                  count: +lesson.count + 1 + '',
                  time: lesson.time,
                  data: { topWeek: dataTop },
                } as lessonG
              }
              //* >=|=> lower week <=|=<

              //? ==< subject >==
              let subjectLower: subject = { title: '' }
              subjectLower.title = await SubjectService.getById(lesson.data.lowerWeek.subject_id).then(result => {
                return result as string
              })
              subjectLower.type = lesson.data.lowerWeek.type

              //? ==< teachers >==
              let teacherLower: teacher = { name: '', degree: '' }
              await TeacherService.getById(lesson.data.lowerWeek.teacher_id).then(result => {
                teacherLower = result as teacher
              })

              //? ==< cabinet >==
              let cabinetLower: string = ''
              cabinetLower = await CabinetService.getById(lesson.data.lowerWeek.cabinet_id).then(result => {
                return result as string
              })
              //? ==< data >==
              if (subjectLower.title !== 'нет данных')
                dataLower = {
                  subject: subjectLower,
                  teacher: teacherLower,
                  cabinet: cabinetLower,
                }
              else dataLower = 'none'

              return {
                id: lesson.id,
                count: +lesson.count + 1 + '',
                time: lesson.time,
                data: { topWeek: dataTop, lowerWeek: dataLower },
              } as lessonG
            })
          )
          lessons.sort((a, b) => {
            var aS = 0,
              bS = 0
            a && (aS = +a?.count)
            b && (bS = +b?.count)
            return aS - bS
          })
          result.push({
            dayOfWeek: day.dayOfWeek,
            isWeekend: day.isWeekend,
            lessons: lessons,
          })
        })
      )

      return res.json({ status: 'OK', result })
    } catch (e) {
      next(e)
    }
  }
  getScheduleByTeacher: RequestHandler<Record<string, any>, any, any, QT_getScheduleByTeacher> = async (
    req,
    res,
    next
  ) => {
    try {
      validationController(req, res)

      const { name } = req.query

      const teacher = await Teacher.findOne({ name: name })

      if (!teacher) {
        throw new Error(`Teacher ${name} not found`)
      }

      const lessons = await Lesson.find({
        $or: [{ 'data.topWeek.teacher_id': teacher._id }, { 'data.lowerWeek.teacher_id': teacher._id }],
      }).populate({
        path: 'data.topWeek.subject_id data.lowerWeek.subject_id data.topWeek.cabinet_id data.lowerWeek.cabinet_id',
        select: 'title item',
      })

      const schedule = {}

      for (const lesson of lessons) {
        const day = await Day.findById(lesson.day_id)
        const groupName = await Group.findById(day.group_id, 'name')

        if (!(schedule as any)[day.dayOfWeek]) {
          ;(schedule as any)[day.dayOfWeek] = []
        }

        const topWeekLesson =
          lesson?.data?.topWeek?.teacher_id && lesson.data.topWeek.teacher_id.equals(teacher._id)
            ? {
                subject: lesson.data.topWeek.subject_id,
                cabinet: lesson.data.topWeek.cabinet_id,
                groups: [groupName],
              }
            : null

        const lowerWeekLesson =
          lesson?.data?.lowerWeek?.teacher_id && lesson.data.lowerWeek.teacher_id.equals(teacher._id)
            ? {
                subject: lesson.data.lowerWeek.subject_id,
                cabinet: lesson.data.lowerWeek.cabinet_id,
                groups: [groupName],
              }
            : null

        const existingLessonIndex = (schedule as any)[day.dayOfWeek].findIndex(
          (item: any) => item.count === lesson.count
        )

        if (existingLessonIndex !== -1) {
          if (topWeekLesson) {
            if (!(schedule as any)[day.dayOfWeek][existingLessonIndex].data.topWeek) {
              ;(schedule as any)[day.dayOfWeek][existingLessonIndex].data.topWeek = topWeekLesson
            } else {
              ;(schedule as any)[day.dayOfWeek][existingLessonIndex].data.topWeek.groups.push(...topWeekLesson.groups)
            }
          }
          if (lowerWeekLesson) {
            if (!(schedule as any)[day.dayOfWeek][existingLessonIndex].data.lowerWeek) {
              ;(schedule as any)[day.dayOfWeek][existingLessonIndex].data.lowerWeek = lowerWeekLesson
            } else {
              ;(schedule as any)[day.dayOfWeek][existingLessonIndex].data.lowerWeek.groups.push(
                ...lowerWeekLesson.groups
              )
            }
          }
        } else {
          ;(schedule as any)[day.dayOfWeek].push({
            id: lesson._id,
            count: lesson.count,
            time: lesson.time,
            data: {
              topWeek: topWeekLesson,
              lowerWeek: lowerWeekLesson,
            },
          })
        }
      }

      return res.json({ status: 'OK', result: schedule })
    } catch (error) {
      console.error(error)
    }
  }
}

export default new ScheduleController()
