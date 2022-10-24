export type BT_addGroup = {
  name: string
  faculty: 'FVO' | 'SPO'
  elder_id?: string
}

export type BT_changeGroup = {
  name?: string
  faculty?: 'FVO' | 'SPO'
  elder_id?: string
}
export type QT_changeGroup = {
  name: string
}

export type BT_deleteGroup = {
  name: string
}
export type QT_deleteGroup = {
  name: string
}

export type QT_getGroup = {
  name: string
}
