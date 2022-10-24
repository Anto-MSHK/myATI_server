export const filePath = (path: string) => (req: any, res: any, next: any) => {
  req.filePath = path
  next()
}
