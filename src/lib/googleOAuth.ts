import path from 'path'
import { google } from 'googleapis'
import { getLogger } from '../logs/logger'

const dir =
  process.env.NODE_ENV === 'production' ? __dirname : path.join(__dirname, '..')

const staticDir = path.join(dir, 'static')
const serviceAccountPath = path.join(staticDir, 'serviceAccount.json')

const logger = getLogger('googleOAuth')

export const getAccessToken = async (scopes: string[]) => {
  try {
    const credentials = require(serviceAccountPath)
    const jwtClient = new google.auth.JWT({
      keyFile: serviceAccountPath,
      credentials,
      scopes
    })
    const token = await jwtClient.authorize()
    return token.access_token
  } catch (error) {
    if (logger)
      logger.error(
        typeof error === 'string'
          ? error
          : JSON.stringify({ ...error!, serviceAccountPath }),
        () => {
          console.log('Log registrado!')
        }
      )
  }
}
