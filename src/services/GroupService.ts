import Group from '@src/models/Group/Group.model'
import Day from '@src/models/eduStructure/Day/Day.model'
import User from '@src/models/User/User.model'
import { BT_changeGroup } from '@src/routes/groupRouter/group.types'
import { IDayDocument } from '@src/models/eduStructure/Day/Day.types'
import { errorsMSG } from '../exceptions/API/errorsConst'
import { ApiError } from '../exceptions/API/api-error'
import LessonService from './LessonService'

const appointsElder = async (elder_id: string | undefined, group_id: string | undefined) => {
  try {
    if (elder_id) {
      const user = await User.findOne({ _id: elder_id })
      const checkedUser = await User.findOne({ group_id: group_id })
      if (!user || user.role !== 'Elder') throw ApiError.INVALID_DATA(errorsMSG.NOT_EXIST)

      if (checkedUser) throw ApiError.INVALID_DATA(errorsMSG.NOT_EXIST)

      await user.update({ group_id: group_id })
      return true
    }
  } catch (e) {
    throw Error()
  }
}

class GroupService {
  addGroup = async (name: string | undefined, faculty: 'FVO' | 'SPO', elder_id?: string) => {
    try {
      if (name === undefined) {
        throw ApiError.INVALID_DATA(errorsMSG.NOT_EXIST)
      }

      const candidate = await Group.findOne({ name })

      if (candidate) {
        throw ApiError.INVALID_DATA(errorsMSG.ALREADY_EXIST)
      }

      const group = new Group({
        name,
        faculty,
      })

      let elderStatus = false
      await appointsElder(elder_id, group._id)
        .then(result => {
          if (result) elderStatus = true
        })
        .catch(() => {
          elderStatus = false
        })

      if (!elderStatus && elder_id) throw ApiError.INVALID_DATA(errorsMSG.NOT_ELDER)

      await group.save()

      let days: IDayDocument[] = []
      for (let i_day = 0; i_day <= 5; i_day++) {
        days[i_day] = await new Day({
          dayOfWeek: '' + i_day,
          group_id: group._id,
        }).save()
      }
      return days
    } catch (e: any) {
      return []
    }
  }

  changeGroup = async (name: string, params: BT_changeGroup) => {
    const group = await Group.findOne({ name })
    if (!group) {
      throw ApiError.INVALID_DATA(errorsMSG.NOT_EXIST)
    }
    // проверка старосты
    await appointsElder(params.elder_id, group._id)
    //!
    await group.updateOne(params)
  }

  deleteGroup = async (name: string) => {
    const group = await Group.findOne({ name })

    if (!group) {
      throw ApiError.INVALID_DATA(errorsMSG.NOT_EXIST)
    }

    const user = await User.findOne({ group_id: group?._id })

    await user?.updateOne({ $unset: { group_id: 1 } })

    const days = await Day.find({ group_id: group._id })

    if (days)
      await Promise.all(
        days.map(async day => {
          await LessonService.deleteLessons(day._id)
        })
      )

    await group.delete()
  }

  getGroups = async (name?: string) => {
    if (name) {
      const group = await Group.findOne({ name }, '-_id -__v')
      if (!group) {
        throw ApiError.INVALID_DATA(errorsMSG.NOT_EXIST)
      }
      return group
    } else {
      const groups = await Group.find({}, ' -__v -messages_id')
      return groups
    }
  }
}

export default new GroupService()
