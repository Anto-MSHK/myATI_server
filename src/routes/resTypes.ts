export type RT<resultType = any> = {
  result?: resultType
  status: 'OK' | 'INVALID_REQUEST' | 'INVALID_DATA' | 'UNKNOWN_ERROR'
  messages?: { problemField?: string; error?: string; description: string }[]
}
