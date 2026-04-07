const { google } = require('googleapis');
const { callExternalApi } = require('../middlewares/externalApiClient');

const GmailService = {
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

    encodeMessage: (to, subject, message) => {
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const emailLines = [
            `To: ${to}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${utf8Subject}`,
            '',
            `<div style="font-family: Arial, sans-serif; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4CAF50;">Compospet</h2>
                <p style="font-size: 16px; color: #333;">${message}</p>
                <hr style="border: 0; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #888;">Este es un mensaje automático de activación.</p>
            </div>`
        ];

        return Buffer.from(emailLines.join('\r\n').trim())
            .toString('base64')
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },

    sendStaticEmail: async (to, subject, message) => {
        try {
            const auth = GmailService.getAuthClient();
            const gmail = google.gmail({ version: 'v1', auth });
            const raw = GmailService.encodeMessage(to, subject, message);

            await callExternalApi(
                () => gmail.users.messages.send({ userId: 'me', requestBody: { raw } }),
                'gmail-static-send'
            );

            console.log(`[GMAIL-API] Correo enviado a ${to}`);
        } catch (error) {
            console.error("Error enviando correo con API de Gmail:", error);
            throw error;
        }
    }
};

module.exports = GmailService;