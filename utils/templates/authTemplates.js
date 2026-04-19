const { colors, fonts } = require('./emailStyles');

/**
 * Genera el cuerpo de contenido HTML para correos de autenticación (OTP).
 * Diseñado para ser insertado dentro de un Layout base.
 * * @function getOtpContent
 * @param {string|number} code - El código de verificación generado para el usuario.
 * @returns {string} Fragmento de tabla HTML con el diseño de bienvenida y OTP.
 */
const getOtpContent = (code, options) => `
<table align="center" cellpadding="0" cellspacing="0" width="600" class="keep-white" bgcolor="#ffffff" style="background-color: #ffffff !important;">
    <tbody>
        <tr>
            <td align="left" style="padding: 20px;">
                <div align="center" style="padding: 10px 0;">
                    <img src="https://eakcefn.stripocdn.email/content/guids/CABINET_d9f63a3757dcbaafa8ba8592591015a163c8cf2ff9506c848983b71e2cb2de34/images/image_U2L.png" alt="Welcome" width="560" style="display: block; border: 0;">
                </div>

                <h1 style="font-size: 36px; font-family: ${fonts.main}; color: ${colors.primary} !important; text-align: center; margin: 20px 0;">
                    ${options.title}
                </h1>
                
                <p style="font-family: ${fonts.main}; color: ${colors.primary} !important; line-height: 1.5;">
                    ${options.message}
                </p>

                <div style="background-color: #ffffff;  padding: 20px; text-align: center; margin: 20px 0;">
                    <h6 style="font-size: 20px; font-family: ${fonts.main}; color: ${colors.secondary} !important; margin: 0; text-transform: uppercase;">
                        Código de Verificación
                    </h6>
                    <h1 style="color: ${colors.primary} !important; font-family: ${fonts.main}; font-size: 48px; margin: 10px 0; letter-spacing: 5px;">
                        <strong>${code}</strong>
                    </h1>
                </div>

                <div style="border-top: 1px solid #cccccc; padding-top: 20px; margin-top: 20px;">
                    <h5 style="font-family: ${fonts.main}; color: ${colors.primary} !important; font-size: 18px; margin-bottom: 10px;">
                        <strong>¿Qué debes hacer ahora?</strong>
                    </h5>
                    <ul style="font-family: ${fonts.main}; color: ${colors.primary} !important; padding-left: 20px;">
                        <li style="margin-bottom: 10px;">Copia este código.</li>
                        <li>Regresa a Compospet e ingrésalo para activar tu cuenta.</li>
                    </ul>
                </div>
            </td>
        </tr>
    </tbody>
</table>
`;

module.exports = { getOtpContent };