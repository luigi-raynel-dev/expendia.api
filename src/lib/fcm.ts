import { google } from 'googleapis'

// Função para gerar token de acesso OAuth 2.0
async function getAccessToken() {
  const scopes = ['https://www.googleapis.com/auth/firebase.messaging']
  const credentials = require(__dirname + '/serviceAccount.json')
  const jwtClient = new google.auth.JWT({
    keyFile: __dirname + '/serviceAccount.json',
    credentials,
    scopes
  })
  const token = await jwtClient.authorize()
  return token.access_token
}

// Função para enviar mensagem FCM
export async function sendFcmMessage() {
  const url =
    'https://fcm.googleapis.com/v1/projects/621290427270/messages:send'
  const accessToken = await getAccessToken()
  console.log(accessToken)
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: {
        data: {
          expense_id: 'clsnvo9h1000113f8tlpa1yt8'
        },
        notification: {
          title: 'Título da Notificação',
          body: 'Mensagem da Notificação'
        }
      }
    })
  }

  try {
    const response = await fetch(url, options)
    console.log(await response.text())
    // const data = await response.json()
    // console.log('Mensagem enviada com sucesso:', data)
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
  }
}
