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
  getScheduleByTeacher: RequestHandler<Record<string, any>, RT<any>, any, any> = async (req, res, next) => {
    validationController(req, res)

    const { name } = req.query

    var teacher = await Teacher.findOne({ name })

    if (!teacher) throw ApiError.INVALID_DATA(errorsMSG.NOT_EXIST)
    const lessons = await Lesson.find({
      $or: [{ 'data.topWeek.teacher_id': teacher._id }, { 'data.lowerWeek.teacher_id': teacher._id }],
    }).populate('day_id')

    const days = Array.from({ length: 6 }, (_, index) => ({
      dayOfWeek: `${index}`,
      lessons: [],
    })) as any

    for (const lesson of lessons) {
      const dayOfWeek = lesson.day_id.dayOfWeek
      const dayIndex = days.findIndex((day: any) => day.dayOfWeek === dayOfWeek)

      // Get all groups related to this lesson
      const groups = await Group.find({ _id: { $in: lesson.day_id.group_id } })

      const lessonT = {
        id: lesson._id,
        count: lesson.count,
        time: lesson.time,
        data: {
          topWeek:
            lesson?.data?.topWeek?.teacher_id && lesson.data.topWeek.teacher_id.equals(teacher._id)
              ? {
                  subject: {
                    title: (await Subject.findById(lesson.data.topWeek.subject_id._id)).title,
                    type: lesson.data.topWeek.type,
                  },
                  cabinet: (await Cabinet.findById(lesson.data.topWeek.cabinet_id))?.item || 'нет данных',
                  groups: groups.map(group => group.name),
                }
              : lesson?.data?.topWeek?.teacher_id && !lesson.data.topWeek.teacher_id.equals(teacher._id)
              ? 'none'
              : null,
          lowerWeek:
            lesson?.data?.lowerWeek?.teacher_id && lesson.data.lowerWeek.teacher_id.equals(teacher._id)
              ? {
                  subject: {
                    title: (await Subject.findById(lesson.data.lowerWeek.subject_id)).title,
                    type: lesson.data.lowerWeek.type,
                  },
                  cabinet: (await Cabinet.findById(lesson.data.lowerWeek.cabinet_id))?.item || 'нет данных',
                  groups: groups.map(group => group.name),
                }
              : lesson?.data?.lowerWeek?.teacher_id && !lesson.data.lowerWeek.teacher_id.equals(teacher._id)
              ? 'none'
              : null,
        },
      }

      if (dayIndex === -1) {
        days.push({
          dayOfWeek: dayOfWeek,
          lessons: [lessonT],
        })
      } else {
        const lessonIndex = days[dayIndex].lessons.findIndex((l: any) => l.count === lessonT.count)
        if (lessonIndex === -1) {
          days[dayIndex].lessons.push(lessonT)
        } else {
          if (
            (lessonT as any).data.topWeek &&
            (days[dayIndex] as any)?.lessons[lessonIndex]?.data?.topWeek &&
            (days[dayIndex] as any)?.lessons[lessonIndex]?.data?.topWeek !== 'none' &&
            (lessonT as any).data.topWeek !== 'none'
          )
            (days[dayIndex] as any).lessons[lessonIndex].data.topWeek.groups = [
              ...(days[dayIndex] as any).lessons[lessonIndex].data.topWeek.groups,
              ...(lessonT as any).data.topWeek.groups,
            ]
          if (lessonT.data.lowerWeek) {
            if (!days[dayIndex].lessons[lessonIndex].data.lowerWeek) {
              days[dayIndex].lessons[lessonIndex].data.lowerWeek = lessonT.data.lowerWeek
            } else {
              if (
                (lessonT as any).data.lowerWeek &&
                (days[dayIndex] as any)?.lessons[lessonIndex]?.data?.lowerWeek &&
                (days[dayIndex] as any)?.lessons[lessonIndex]?.data?.lowerWeek !== 'none' &&
                (lessonT as any).data.lowerWeek !== 'none'
              )
                (days[dayIndex] as any).lessons[lessonIndex].data.lowerWeek.groups = [
                  ...(days[dayIndex] as any).lessons[lessonIndex].data.lowerWeek.groups,
                  ...(lessonT as any).data.lowerWeek.groups,
                ]
            }
          }
        }
      }
    }

    return res.json({ status: 'OK', result: days })
  }
}

export default new ScheduleController()
