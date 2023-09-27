export function emailTemplate(title: string, username: string, body: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Expendia - ${title}</title>
    </head>
    <body style="font-family: Verdana">
      <h2>Expendia - ${title}</h2>
      <h3>Olá, ${username}</p>
      ${body}
      <p>Atenciosamente, Expendia</p>
      <p style="color: #888">Este é um e-mail automático. Por favor não responda-o.</p>
    </body>
    </html>
  `
}
