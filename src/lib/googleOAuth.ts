import { google } from 'googleapis'

export const getAccessToken = async (scopes: string[]) => {
  const credentials = require(__dirname + '/serviceAccount.json')
  const jwtClient = new google.auth.JWT({
    keyFile: __dirname + '/serviceAccount.json',
    credentials,
    scopes
  })
  const token = await jwtClient.authorize()
  return token.access_token
}
