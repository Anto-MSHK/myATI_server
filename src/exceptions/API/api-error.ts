type status_description = 'OK' | 'INVALID_REQUEST' | 'INVALID_DATA' | 'UNKNOWN_ERROR'

export class ApiError extends Error {
  status: number
  status_description: status_description
  message_api: string
  problemField: string | undefined

  constructor(
    status: number,
    status_description: status_description,
    message_error: string | undefined,
    message_api: string,
    problemField?: string
  ) {
    super(message_error)
    this.status = status
    this.status_description = status_description
    this.message_api = message_api
    this.problemField = problemField
  }

  static INVALID_REQUEST(message: string, errors?: string, problemField?: string) {
    return new ApiError(400, 'INVALID_REQUEST', errors, message, problemField)
  }
  static INVALID_DATA(message: string, errors?: string, problemField?: string) {
    return new ApiError(400, 'INVALID_DATA', errors, message, problemField)
  }
}
