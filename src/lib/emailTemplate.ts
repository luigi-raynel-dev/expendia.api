export function emailTemplate(
  title: string,
  username: string,
  body: string,
  helloLabel?: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Expendia - ${title}</title>
    </head>
    <body style="font-family: Verdana">
    <div style="margin: 0 auto; width: 100%; max-width: 800px; border: 1px solid #ddd">
      <div style="background: #A34FD8; width: 100%; max-width: 800px; text-align: center; margin: 0 auto; padding: 8px; color: white">
        <img width="200px" src="https://expendia.netlify.app/static/media/ExpendiaLogo.bf7c0010270a7a3a8267.png" />
        <h1 style="font-size: 25px">${title}</h1>
      </div>
      <div style="padding: 8px">
        <h3>${helloLabel || `Olá`} ${username},</h3>
        ${body}
      </div>
      </div>
      <p style="color: #071673; text-align: center">Este é um e-mail automático. Por favor não responda-o.</p>
    </body>
    </html>
  `
}
