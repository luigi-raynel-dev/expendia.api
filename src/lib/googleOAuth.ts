import path from 'path'
import { google } from 'googleapis'

const staticDir = path.join(__dirname, '..', 'static')
const serviceAccountPath = path.join(staticDir, 'serviceAccount.json')

export const getAccessToken = async (scopes: string[]) => {
  const credentials = require(serviceAccountPath)
  const jwtClient = new google.auth.JWT({
    keyFile: serviceAccountPath,
    credentials,
    scopes
  })
  const token = await jwtClient.authorize()
  return token.access_token
}
