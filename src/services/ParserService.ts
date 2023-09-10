import XLSX from 'xlsx'
import fs from 'fs'
import GroupService from '../services/GroupService'
import Teacher from '../models/eduStructure/Teacher/Teacher.model'
import Cabinet from '../models/eduStructure/Cabinet/Cabinet.model'
import Subject from '../models/eduStructure/Subject/Subject.model'
import { ILesson, byWeek } from '../models/eduStructure/Lesson/Lesson.types'
import LessonService from '../services/LessonService'
import { IDayDocument } from '../models/eduStructure/Day/Day.types'

import { ObjectId } from 'mongodb'
import path from 'path'
import { ApiError } from '../exceptions/API/api-error'
import { errorsMSG } from '../exceptions/API/errorsConst'
import EduStructureService from './EduStructureService'
import { IGroupDocument } from '../models/Group/Group.types'
import Day from '../models/eduStructure/Day/Day.model'
import Lesson from '../models/eduStructure/Lesson/Lesson.model'
import { times, timesMonday } from './../routes/scheduleRouter/schedule.types'
import DayService from './DayService'

type stydyWeek = {
  days: (stydyDay | undefined)[]
}

type stydyDay = {
  lessons: (ILesson | undefined)[]
}

type cell = {
  v: string
  w: string
  t: string
}

type merge = {
  s: { r: {}; c: {} }
  e: { r: {}; c: {} }
}

type dayCells = {
  i_cell_row_last: number
  i_cell_row_first: number
}

const alphabet: string[] = []
const numberOfLetters = 500

for (let i = 0; i < numberOfLetters; i++) {
  if (i < 26) {
    alphabet.push(String.fromCharCode(65 + i))
  } else {
    const firstLetter = String.fromCharCode(65 + Math.floor((i - 26) / 26))
    const secondLetter = String.fromCharCode(65 + ((i - 26) % 26))
    alphabet.push(firstLetter + secondLetter)
  }
}

const pattern = /^[А-Я]+$/
const patternEng = /^[A-Z]+$/i
const patternNum = /^[0-9]+$/

type list = {
  '!merges': any
  [key: string]: cell
}

const checkingMerged = (str: string, num1: number, num2: number, workSheet: list) => {
  const merges: merge[] = workSheet['!merges']
  let isMergeCell = false
  merges.map(el => {
    if (
      el.s.c === alphabet.indexOf(str) &&
      el.e.c === alphabet.indexOf(str) &&
      el.s.r === num1 - 1 &&
      el.e.r === num2 - 1
    ) {
      isMergeCell = true
    }
  })
  return isMergeCell
}

function checkingGroupCellIsCorrect<N extends number, T extends string>(
  currentColumn: T,
  currentRow: N,
  direction: N,
  condition: N,
  workSheet: list
): T {
  try {
    const currentValue: string | undefined = workSheet[currentColumn + currentRow]
      ? workSheet[currentColumn + currentRow].w
      : undefined

    const nextCell: number = alphabet.indexOf(currentColumn) + direction

    const incorrectData = currentValue && currentValue.length < 10

    const merged = checkingMerged(currentColumn, currentRow, currentRow + 1, workSheet)

    if (!merged) return checkingGroupCellIsCorrect(currentColumn, currentRow + 1, direction, condition, workSheet)

    const emptyData =
      !currentValue &&
      workSheet[alphabet[nextCell] + currentRow] &&
      workSheet[alphabet[nextCell] + currentRow].w.length > 6

    const isNotMD = currentValue && currentValue !== 'ВОЕННАЯ КАФЕДРА'

    if (currentValue && currentValue.includes('I')) return alphabet[alphabet.indexOf(currentColumn) + 1] as T
    if (condition === 0) {
      if (incorrectData || emptyData) {
        return checkingGroupCellIsCorrect(alphabet[nextCell] as T, currentRow, direction, condition, workSheet)
      }
      return currentColumn
    }
    if (condition === 1) {
      if (incorrectData && merged && isNotMD) {
        return currentColumn
      }
      return checkingGroupCellIsCorrect(alphabet[nextCell] as T, currentRow, direction, condition, workSheet)
    }
    return '' as T
  } catch (e) {
    return '' as T
  }
}

const replace = (str: string): string => {
  var result = str.replace(/\s/g, '').replace(/['"`]+/g, '')
  return result
}

const correctStr = (str: string): string => {
  return str
    .replace(/\s{0,}(['"`])/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,!"':])/g, '$1')
    .replace(/['"`]+/g, '')
    .trim()
}
class ParserService {
  public start = async () => {
    try {
      let workSheet: list
      const directories = [
        path.resolve(`${process.env.FOLDER_PATH}/schedule/vpo`),
        path.resolve(`${process.env.FOLDER_PATH}/schedule/spo`),
      ]
      return await new Promise<void>(async resolve => {
        directories.map(async (directory, index) => {
          fs.readdir(directory, async (err, files) => {
            if (err) throw err

            for (const file of files) {
              let fileOfData
              try {
                fileOfData = XLSX.readFile(`${directory}/${file}`, {
                  raw: true,
                })
              } catch (error) {
                continue
              }
              if (fileOfData) {
                workSheet = fileOfData.Sheets[fileOfData.SheetNames[0]] as list
                delete workSheet['!margins']
                delete workSheet['!ref']
                delete workSheet['!rows']
                const faculty: 'FVO' | 'SPO' = index === 0 ? 'FVO' : 'SPO'
                await this.defineGroups(faculty, workSheet)
              }
            }
            if (index === 1) resolve()
          })
        })
      })
    } catch (e) {
      return undefined
    }
  }

  private defineGroups = async (faculty: 'FVO' | 'SPO', workSheet: list) => {
    try {
      for (const curKey in workSheet) {
        if (workSheet[curKey] && workSheet[curKey].w) {
          let letter = 0
          let num = 0
          if (workSheet[curKey].w.length < 15) {
            for (let i = 0; i <= workSheet[curKey].w.length; i++) {
              if (pattern.test(workSheet[curKey].w[i])) {
                letter++
              } else if (patternNum.test(workSheet[curKey].w[i])) num++
            }
          }

          if (letter !== 0 && num !== 0 && letter <= 5 && num <= 5) {
            var referCell_number = ''
            var referCell_letter = ''

            for (let i = 0; i <= curKey.length; i++) {
              if (patternEng.test(curKey[i])) {
                referCell_letter += curKey[i]
              } else if (patternNum.test(curKey[i])) {
                referCell_number += curKey[i]
              }
              if (curKey.length - i === 1) break
            }

            const correctColumn = checkingGroupCellIsCorrect(referCell_letter, +referCell_number + 1, 1, 0, workSheet)
            referCell_letter = correctColumn || referCell_letter
            const groupName = replace(workSheet[curKey].w)
            await GroupService.addGroup(groupName, faculty).then(async res => {
              if (res) {
                await this.defineSchedule(referCell_letter, referCell_number, res, workSheet)
              }
            })
          }
        }
      }
    } catch (e) {}
  }

  defineSchedule = async (
    referCell_letter: string,
    referCell_number: string,
    daysProps: IDayDocument[],
    workSheet: list
  ) => {
    try {
      var stydyWeek: stydyWeek = {
        days: [],
      }

      const i_letter = alphabet.indexOf(referCell_letter)

      const cellsOfDays: dayCells[] = [{ i_cell_row_first: 0, i_cell_row_last: 0 }]
      let i_day = 0
      let i_cell_row = +referCell_number + 1
      let i_cell_row_last = +referCell_number + 20

      for (let i_cell_column = i_letter - 1; i_cell_column >= 0; i_cell_column--) {
        while (i_cell_row_last > i_cell_row) {
          for (let i_cell_row_first = i_cell_row; i_cell_row_first <= i_cell_row + 5; i_cell_row_first++) {
            const isMerged = checkingMerged(alphabet[i_cell_column], i_cell_row_first, i_cell_row_last, workSheet)
            const isCellLong = i_cell_row_last - i_cell_row_first > 6
            const isCellExists = workSheet[alphabet[i_cell_column] + i_cell_row_first] !== undefined
            const isSpecial = checkingMerged(referCell_letter, i_cell_row_first, i_cell_row_last, workSheet)

            if (isMerged && isCellLong && isCellExists && !isSpecial) {
              cellsOfDays[i_day] = { i_cell_row_first, i_cell_row_last }
              i_day++
              i_cell_row = i_cell_row_last + 1
              i_cell_row_last += 20
              break
            } else if (isMerged && isCellLong && isCellExists && isSpecial) {
              cellsOfDays[i_day] = { i_cell_row_first, i_cell_row_last: i_cell_row_first }
              i_day++
              i_cell_row = i_cell_row_last + 1
              i_cell_row_last += 20
              break
            }
          }
          i_cell_row_last--
        }
        i_cell_row_last = +referCell_number + 20
      }
      let column_lesson: string = alphabet[alphabet.indexOf(referCell_letter) - 1]

      // column_lesson = checkingGroupCellIsCorrect(column_lesson, cellsOfDays[0].i_cell_row_first, -1, 1, workSheet)

      stydyWeek.days = await Promise.all(
        cellsOfDays.map(async (day: dayCells, iCurrentWeekDay) => {
          let day_id = ''
          if (daysProps[iCurrentWeekDay]) day_id = daysProps[iCurrentWeekDay]._id
          if (day_id !== '') return await this.defineDay(day, referCell_letter, column_lesson, day_id, workSheet)
        })
      )

      return stydyWeek
    } catch (e) {
      return undefined
    }
  }

  defineDay = async (
    rangeCells: dayCells,
    referCell_letter: string,
    column_lesson: string,
    day_id: string,
    workSheet: list
  ) => {
    try {
      const stydyDay: stydyDay = {
        lessons: [],
      }

      const cellsOfLesson: dayCells[] = [{ i_cell_row_first: 0, i_cell_row_last: 0 }]
      let i_lesson = 0

      if (rangeCells.i_cell_row_first === rangeCells.i_cell_row_last) {
        await DayService.deleteLessons(new ObjectId(day_id))
        await LessonService.addLesson(
          0,
          day_id,
          undefined,
          undefined,
          workSheet[referCell_letter + rangeCells.i_cell_row_first].w
        )
        return undefined
      }
      for (let i_cell = rangeCells.i_cell_row_first; i_cell <= rangeCells.i_cell_row_last; i_cell++) {
        for (let i_cell_last = i_cell + 1; i_cell_last <= i_cell + 5; i_cell_last++) {
          if (column_lesson && checkingMerged(column_lesson, i_cell, i_cell_last, workSheet)) {
            cellsOfLesson[i_lesson] = {
              i_cell_row_first: i_cell,
              i_cell_row_last: i_cell_last,
            }
            i_lesson++
            break
          }
        }
      }

      stydyDay.lessons = await Promise.all(
        cellsOfLesson.map(async (lesson: dayCells, iCurrentLesson) => {
          return await this.defineLesson(lesson, referCell_letter, iCurrentLesson, day_id, workSheet)
        })
      )

      return stydyDay
    } catch (e) {
      return undefined
    }
  }

  defineLesson = async (
    referLesson: dayCells,
    referCell_letter: string,
    curLesson: number,
    day_id: string,
    workSheet: list
  ) => {
    try {
      let lesson: ILesson | undefined
      // referLesson += 1;
      const column_cabinet = alphabet[alphabet.indexOf(referCell_letter) + 1]

      const firstCell: string | undefined = workSheet[referCell_letter + referLesson.i_cell_row_first]
        ? workSheet[referCell_letter + referLesson.i_cell_row_first].w
        : undefined
      const secondCell: string | undefined = workSheet[referCell_letter + referLesson.i_cell_row_last]
        ? workSheet[referCell_letter + referLesson.i_cell_row_last].w
        : undefined

      const cabinet_firstCell: string | undefined = workSheet[column_cabinet + referLesson.i_cell_row_first]
        ? workSheet[column_cabinet + referLesson.i_cell_row_first].w
        : undefined
      const cabinet_secondCell: string | undefined = workSheet[column_cabinet + referLesson.i_cell_row_last]
        ? workSheet[column_cabinet + referLesson.i_cell_row_last].w
        : undefined

      if (!firstCell && !secondCell) {
        return undefined
      }
      const propsLesson = {
        mainCell: firstCell,
        cellInfo: secondCell,
        cabinet_fCell: cabinet_firstCell,
        cabinet_sCell: cabinet_secondCell,
      }
      if (
        checkingMerged(column_cabinet, referLesson.i_cell_row_first, referLesson.i_cell_row_last, workSheet) &&
        firstCell &&
        secondCell
      ) {
        var data
        if (getLessonData(firstCell).length > 0) {
          data = await lessonByWeek(propsLesson)
        } else {
          data = await lessonConstant(propsLesson)
        }
      } else if (firstCell && getLessonData(firstCell).length === 0) {
        data = await lessonConstant(propsLesson)
      } else {
        data = await lessonByWeek(propsLesson)
      }
      const day = await Day.findById(day_id)
      const curTime = day.dayOfWeek === '0' || day.dayOfWeek === 0 ? timesMonday[curLesson] : times[curLesson]
      lesson = {
        count: `${curLesson}`,
        time: curTime,
        day_id,
        data,
      }
      return await LessonService.addLesson(curLesson, day_id, data, curTime).then(() => lesson)
    } catch (e) {
      return undefined
    }
  }
}

type propsLessonType = {
  mainCell: string | undefined
  cellInfo: string | undefined
  cabinet_fCell: string | undefined
  cabinet_sCell: string | undefined
}

const getLessonData = (str: string): [title: string, nameTeacher: string, degree: string, typeLesson: string] | [] => {
  try {
    const surname = /^[А-Я][а-я]{1,20}(?:\s+)+[А-Я]+(?:\s*)+\.+(?:\s*)+[А-Я]$/

    let title = ''
    let nameTeacher = ''
    let degree = ''
    let typeLesson = ''

    let i_degree = 0
    let i_type_lesson = 0

    let stop = false

    for (let i_char_start = 0; i_char_start <= str.length; i_char_start++) {
      for (let i_char_end = str.length; i_char_end >= 1; i_char_end--) {
        let currentPhrase = ''

        for (let i = i_char_start; i < i_char_end; i++) {
          currentPhrase += str[i]
        }
        if (surname.test(currentPhrase)) {
          nameTeacher = currentPhrase
          if (nameTeacher[nameTeacher.length - 1] !== '.') nameTeacher += '.'
          i_degree = i_char_start
          i_type_lesson = i_char_end
          stop = true
        }
      }

      if (stop === true) break
    }

    if (stop === false) {
      return []
    }

    let i_first_t = str.indexOf('.')
    if (i_first_t != -1) {
      if (i_first_t > i_degree) i_first_t = i_degree - 1
      else
        for (let j = i_first_t; j >= 0; j--) {
          if (str[j] === ' ') {
            i_first_t = j
            break
          }
        }
      for (let i = 0; i <= i_first_t; i++) {
        title += str[i]
      }
      for (let i = title.length; i >= 0; i--) {
        if (title[i] !== ' ' && title[i] !== undefined) {
          title = title.slice(0, i + 1)

          break
        }
      }
    }

    for (let i = i_first_t; i <= i_degree - 1; i++) {
      degree += str[i]
    }

    for (let i = i_type_lesson + 1; i <= str.length; i++) {
      str[i] && (typeLesson += str[i])
    }

    if (!degree || degree === 'undefined') degree = ''

    return [correctStr(title), correctStr(nameTeacher), degree.trim(), typeLesson.trim()]
  } catch (e) {
    console.log(e)
    return []
  }
}

const lessonConstant = async (
  props: propsLessonType
): Promise<{
  topWeek: byWeek
}> => {
  var data: byWeek = { subject_id: new ObjectId(), teacher_id: new ObjectId(), cabinet_id: new ObjectId() }

  try {
    const [_, name, degree, type] = props.cellInfo ? getLessonData(props.cellInfo) : []
    let title = props.mainCell
    if (title)
      for (let i = title.length; i >= 0; i--) {
        if (title[i] !== ' ' && title[i] !== undefined) {
          title = title.slice(0, i + 1)

          break
        }
      }

    const cabinet = props.cabinet_fCell ? props.cabinet_fCell : props.cabinet_sCell

    var data = await addDataFromLesson(correctStr(title as string), type, name, degree, cabinet)

    return {
      topWeek: {
        type,
        ...data,
      },
    }
  } catch (e) {
    return {
      topWeek: data,
    }
  }
}

const lessonByWeek = async (
  props: propsLessonType
): Promise<{
  topWeek: byWeek
  lowerWeek: byWeek
}> => {
  var topWeek: byWeek = { subject_id: new ObjectId(), teacher_id: new ObjectId(), cabinet_id: new ObjectId() }
  var lowerWeek: byWeek = { subject_id: new ObjectId(), teacher_id: new ObjectId(), cabinet_id: new ObjectId() }
  try {
    // ? ---->-->-> topWeek <-<--<----
    const [titleTop, nameTop, degreeTop, typeTop] = props.mainCell ? getLessonData(props.mainCell) : []
    const cabinetTop = props.cabinet_fCell ? props.cabinet_fCell : props.cabinet_sCell

    var topWeek = await addDataFromLesson(titleTop, typeTop, nameTop, degreeTop, cabinetTop)

    // ? ---->-->-> lowerWeek <-<--<----
    const [titleLower, nameLower, degreeLower, typeLower] = props.cellInfo ? getLessonData(props.cellInfo) : []

    const cabinetLower = props.cabinet_fCell ? props.cabinet_fCell : props.cabinet_sCell

    var lowerWeek = await addDataFromLesson(titleLower, typeLower, nameLower, degreeLower, cabinetLower)

    return { topWeek: { type: typeTop, ...topWeek }, lowerWeek: { type: typeLower, ...lowerWeek } }
  } catch (e) {
    return { topWeek, lowerWeek }
  }
}

const addDataFromLesson = async (
  title: string | undefined,
  type: string | undefined,
  name: string | undefined,
  degree: string | undefined,
  cabinet: string | undefined
) => {
  const data: byWeek = { subject_id: new ObjectId(), teacher_id: new ObjectId(), cabinet_id: new ObjectId() }

  const subjectC = new EduStructureService(Subject as any, { title })

  await Subject.create({ title })
    .then(res => {
      if (res) data.subject_id = res.id
    })
    .catch(async () => {
      let s = await Subject.findOne({ title })
      if (s) data.subject_id = s.id
    })
  if (degree && degree[0] === '.') degree = `к${degree}`
  const teacherC = new EduStructureService(Teacher as any, { name, degree })

  //  await teacherC.add().then(async res => {
  //    if (res.result) data.teacher_id = res.result
  //  })
  await Teacher.create({ name, degree })
    .then(res => {
      if (res) data.teacher_id = res.id
    })
    .catch(async () => {
      let t = await Teacher.findOne({ name })
      if (t) data.teacher_id = t.id
    })

  await subjectC.addSubjectToTeacher(name)
  if (cabinet) {
    const cabinetC = new EduStructureService(Cabinet as any, { item: cabinet })

    await Cabinet.create({ item: cabinet })
      .then(res => {
        if (res) data.cabinet_id = res.id
      })
      .catch(async () => {
        let c = await Cabinet.findOne({ item: cabinet })
        if (c) data.cabinet_id = c.id
      })
    await cabinetC.addCabinetToSubject(title)
  }

  if (type) {
    await subjectC.addTypeLessonToSubject(type)
  }
  return data
}

export const deleteGhostGroups = async () => {
  const groups = (await GroupService.getGroups()) as IGroupDocument[]
  await Promise.all<void>(
    groups.map(async gr => {
      const days = await Day.find({ group_id: new ObjectId(gr.id) })
      var countVoidDays = 0
      await Promise.all<void>(
        days.map(async d => {
          const lessons = await Lesson.find({ day_id: d._id })
          if (lessons.length === 0) countVoidDays++
        })
      )
      if (countVoidDays > 4) {
        await GroupService.deleteGroup(gr.name)
      }
    })
  )
}

export default new ParserService()
