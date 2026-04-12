/**
 * Genera el layout base en HTML para los correos electrónicos.
 * @function getBaseLayout
 * @param {string} content - El contenido HTML dinámico que se inyectará en el cuerpo del correo.
 * @returns {string} El documento HTML completo listo para ser enviado por Gmail API.
 */
const getBaseLayout = (content) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <style>
        .es-wrapper { background-color: #fafafa; padding: 20px 0; }
        img { outline: none; text-decoration: none; border: none; }
    </style>
</head>
<body style="margin:0; padding:0; background-color: #fafafa;">
    <div style="background-color: #fafafa;">
        <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper">
            <tbody>
                <tr>
                    <td valign="top" align="center">
                        <table align="center" width="600" bgcolor="#ffffff" style="width: 600px; border-bottom: 1px solid #eee;">
                            <tr>
                                <td align="center" class="esd-block-image es-p10t es-p10b" style="font-size: 0px">
                                <a target="_blank">
                                    <img src="https://eakcefn.stripocdn.email/content/guids/CABINET_d9f63a3757dcbaafa8ba8592591015a163c8cf2ff9506c848983b71e2cb2de34/images/image.png" alt="" width="560" title="" class="adapt-img">
                                </a>
                                </td>
                            </tr>
                        </table>

                        ${content}

                        <table align="center" width="600" style="width: 600px; padding: 20px;">
                            <tr>
                                <td align="center" style="font-family: Arial, sans-serif; font-size: 12px; color: #888;">
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