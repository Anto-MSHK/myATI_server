export type BT_login = {
  login: string
  password: string
}
export type BT_addRights = {
  login: string
  password: string
  role: 'Redactor' | 'Elder'
  group_id?: string
}
