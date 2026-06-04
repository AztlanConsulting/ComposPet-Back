/**
 * Genera el layout base en HTML para los correos electrónicos.
 * @function getBaseLayout
 * @param {string} content - El contenido HTML dinámico que se inyectará en el cuerpo del correo.
 * @returns {string} El documento HTML completo listo para ser enviado por Gmail API.
 */
const getBaseLayout = (content) => `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <style>
        :root {
          color-scheme: light;
          supported-color-schemes: light;
        }

        /* Forzar fondo blanco en Gmail y otros */
        @media (prefers-color-scheme: dark) {
            .es-wrapper { background-color: #fafafa !important; }
            .keep-white { background-color: #ffffff !important; color: #03504d !important; }
            h1, h5, h6, p, li, span { color: #03504d !important; }
        }

        /* Fix para Outlook App */
        [data-ogsc] .es-wrapper { background-color: #fafafa !important; }
        [data-ogsc] .keep-white { background-color: #ffffff !important; color: #03504d !important; }
    </style>
</head>
<body style="margin:0; padding:0; background-color: #fafafa;">
    <div style="background-color: #fafafa; background-image: linear-gradient(#fafafa, #fafafa);">
        <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper" style="background-color: #fafafa;">
            <tbody>
                <tr>
                    <td valign="top" align="center">
                        <table align="center" width="600" class="keep-white" bgcolor="#ffffff" style="width: 600px; background-color: #ffffff; border-bottom: 1px solid #eee;">
                            <tr>
                                <td align="center" style="padding: 10px 0;">
                                    <img src="https://eakcefn.stripocdn.email/content/guids/CABINET_d9f63a3757dcbaafa8ba8592591015a163c8cf2ff9506c848983b71e2cb2de34/images/image.png" alt="Logo" width="560" style="display: block; border: 0;">
                                </td>
                            </tr>
                        </table>

                        ${content}

                        <table align="center" width="600" style="width: 600px; padding: 20px;">
                            <tr>
                                <td align="center" style="font-family: Arial, sans-serif; font-size: 12px; color: #888888;">
                                    Este es un mensaje automático de Compospet.
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
`.trim();

module.exports = { getBaseLayout };