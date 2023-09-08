import TeacherInfo from '../models/eduStructure/TeacherInfo/TeacherInfo.model'
import { ITeacherInfo } from '../models/eduStructure/TeacherInfo/TeacherInfo.types'

interface AdditionalTeacherInfoI {
  photo_url: string | undefined
  fullName: string | undefined
  cathedra: string | undefined
  allInfo: string | undefined
  additional: string | undefined
}
export const getAdditionalTeacherInfo = async (name: string): Promise<AdditionalTeacherInfoI> => {
  const teacherInfo: ITeacherInfo | null = await TeacherInfo.findOne({
    name: { $regex: name.split(' ')[0], $options: 'i' },
  })

  if (teacherInfo?.photo_url && !teacherInfo?.photo_url.includes('http'))
    teacherInfo.photo_url = `${process.env.BASE_URL}${teacherInfo?.photo_url}`

  return {
    photo_url: teacherInfo?.photo_url,
    fullName: teacherInfo?.name,
    cathedra: teacherInfo?.cathedra,
    additional: teacherInfo?.degree,
    allInfo: teacherInfo?.allInfo,
  }
}
