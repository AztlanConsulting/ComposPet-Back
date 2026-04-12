const { colors, fonts } = require('./emailStyles');

/**
 * Genera el contenido de bienvenida con el código y las instrucciones.
 */
const getOtpContent = (code) => `
<table bgcolor="${colors.white}" align="center" cellpadding="0" cellspacing="0" width="600" class="es-content-body">
    <tbody>
        <tr>
            <td align="left" style="padding: 20px;">
                <div align="center" style="padding: 10px 0;">
                    <a target="_blank">
                        <img src="https://eakcefn.stripocdn.email/content/guids/CABINET_d9f63a3757dcbaafa8ba8592591015a163c8cf2ff9506c848983b71e2cb2de34/images/image_U2L.png" alt="" width="560" title="" class="adapt-img" style="display: block">
                    </a>
                </div>

                <h1 style="font-size: 36px; font-family: ${fonts.main}; color: ${colors.primary}; text-align: center;">
                    ¡Bienvenido!
                </h1>
                
                <p style="font-family: ${fonts.main}; color: ${colors.primary};">
                    Gracias por registrarte en <strong>Compospet</strong>. Para activar tu cuenta, por favor ingresa el siguiente código de verificación:
                </p>

                <div style="border: 2px solid ${colors.bg}; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
                    <h6 style="font-size: 28px; font-family: ${fonts.main}; color: ${colors.secondary}; margin: 0;">
                        <strong>Código de Verificación</strong>
                    </h6>
                    <h1 style="color: ${colors.primary}; font-family: ${fonts.main}; font-size: 48px; margin: 10px 0;">
                        <strong>${code}</strong>
                    </h1>
                </div>

                <div style="border-top: 1px solid #cccccc; padding-top: 20px;">
                    <h5 style="font-family: ${fonts.main}; color: ${colors.primary}; font-size: 18px; margin-bottom: 10px;">
                        <strong>¿Qué debes hacer ahora?</strong>
                    </h5>
                    <ul style="font-family: ${fonts.main}; color: ${colors.primary}; padding-left: 20px;">
                        <li style="margin-bottom: 10px;">Copia este código.</li>
                        <li>Regresa a la página de Compospet e ingrésalo en el apartado de verificación para activar tu cuenta.</li>
                    </ul>
                </div>
            </td>
        </tr>
    </tbody>
</table>
`;

module.exports = { getOtpContent };