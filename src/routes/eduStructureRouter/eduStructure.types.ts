export type BT_addSubject = {
  title: string
  types?: string[]
  cabinets_id?: string[]
}

export type BT_addTeacher = {
  name: string
  degree?: string
  subjects_id?: string[]
}

export type BT_addCabinet = {
  item: number
}

export type BT_changeSubject = Omit<BT_addSubject, 'title'> & {
  title?: string
}

export type BT_changeTeacher = Omit<BT_addTeacher, 'name'> & {
  name?: string
}

export type BT_changeCabinet = Omit<BT_addCabinet, 'item'> & {
  item?: string
}

export type BT_uniformTypes =
  | BT_addSubject
  | BT_addTeacher
  | BT_addCabinet
  | BT_changeSubject
  | BT_changeTeacher
  | BT_changeCabinet

export type QT_Subject = {
  title: string
}

export type QT_Teacher = {
  name: string
}

export type QT_Cabinet = {
  item: string
}

export type QT_uniformTypes = QT_Subject | QT_Teacher | QT_Cabinet
