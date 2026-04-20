const { google } = require('googleapis');
const { callExternalApi } = require('../middlewares/externalApiClient');
const { getBaseLayout } = require('../utils/templates/baseLayout'); 
const { getOtpContent } = require('../utils/templates/authTemplates');

/**
 * GmailService proporciona métodos para autenticar, formatear y enviar correos 
 * electrónicos utilizando los servicios de Google Cloud.
 * @namespace GmailService
 */
const GmailService = {
    /**
     * Configura y retorna el cliente de autenticación OAuth2 utilizando variables de entorno.
     * @returns {google.auth.OAuth2} Cliente OAuth2 configurado con credenciales y refresh token.
     */
    getAuthClient: () => {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        return oauth2Client;
    },

    /**
     * Codifica el contenido del correo electrónico en formato base64 compatible con la API de Gmail (RFC 4648).
     * @param {string} to - Dirección de correo electrónico del destinatario.
     * @param {string} subject - Asunto del correo (soporta caracteres UTF-8).
     * @param {string} message - Cuerpo del mensaje o contenido dinámico.
     * @returns {string} Mensaje codificado en Base64 URL-Safe.
     */
    encodeMessage: (to, subject, content) => {
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const htmlFinal = getBaseLayout(content);
        const emailLines = [
            `To: ${to}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${utf8Subject}`,
            '',
            htmlFinal
        ];

        return Buffer.from(emailLines.join('\r\n').trim())
            .toString('base64')
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },

    /**
     * Ejecuta el envío de un correo electrónico estático a través de la API de Gmail.
     * Utiliza un middleware externo para el manejo de reintentos o monitoreo de la API.
     * @async
     * @param {string} to - Correo del destinatario.
     * @param {string} subject - Asunto del correo.
     * @param {string} message - Contenido del mensaje.
     * @throws {Error} Si ocurre un fallo en la autenticación o en la comunicación con Google.
     */
    sendStaticEmail: async (to, subject, message, options) => {
        try {
            const auth = GmailService.getAuthClient();
            const gmail = google.gmail({ version: 'v1', auth });
            const otpContent = getOtpContent(message, options);
            const raw = GmailService.encodeMessage(to, subject, otpContent);

            await callExternalApi(
                () => gmail.users.messages.send({ userId: 'me', requestBody: { raw } }),
                'gmail-send'
            );

        } catch (error) {
            console.error("Error enviando correo con API de Gmail:", error);
            throw error;
        }
    }
};

module.exports = GmailService;