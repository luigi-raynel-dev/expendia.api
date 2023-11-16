export function emailTemplate(
  title: string,
  username: string,
  body: string,
  helloLabel?: string,
  graciouslyHTML?: string | null
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Expendia - ${title}</title>
    </head>
    <body style="font-family: Verdana">
      <h2>Expendia - ${title}</h2>
      <h3>${helloLabel || `Olá`} ${username},</h3>
      ${body}
      ${
        graciouslyHTML !== null
          ? graciouslyHTML || `<p>Atenciosamente, Expendia</p>`
          : ''
      }
      <p style="color: #888">Este é um e-mail automático. Por favor não responda-o.</p>
    </body>
    </html>
  `
}
