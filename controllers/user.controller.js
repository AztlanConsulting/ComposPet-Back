const User = require('../models/user.model');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');

const getAllUsers = (req, res) => {
    const users = User.getAllUsers();
    res.status(200).json(users);
};

/**
 * Autentica al usuario con Google y genera un JWT propio para la plataforma.
 */
const googleLogin = async (req, res) => {
  const { token } = req.body; 

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });

    const oauth2 = google.oauth2({ version: 'v2', auth });
    const userInfo = await oauth2.userinfo.get();
    const { email, name, picture } = userInfo.data;

    // Independizamos la sesión de Compospet del ciclo de vida del token de Google
    const userToken = jwt.sign(
      { email, name },
      process.env.JWT_SECRET || 'TU_PALABRA_SECRETA', 
      { expiresIn: '24h' }
    );

    res.status(200).json({ 
      msg: "Login correcto", 
      token: userToken, 
      user: { name, email, picture } 
    });

  } catch (error) {
    console.error("Error en Google Login:", error);
    res.status(400).json({ msg: "Token inválido o expirado" });
  }
};

/**
 * Envía un correo electrónico formateado en HTML usando la API de Gmail.
 * Requiere un Access Token de Google con permisos de Gmail.
 */
const sendEmail = async (req, res) => {
    const { token, to, subject, message } = req.body;

    if (!token) return res.status(401).json({ msg: "No hay token de acceso" });

    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: token });
        const gmail = google.gmail({ version: 'v1', auth });

        // Codificación RFC 2047 y Base64 URL Safe para compatibilidad con la API de Gmail
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        
        const emailLines = [
            `To: ${to}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${utf8Subject}`,
            '',
            `<div style="font-family: Arial, sans-serif; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4CAF50;">Notificación de Compospet</h2>
                <p style="font-size: 16px; color: #333;">${message}</p>
                <br />
                <hr style="border: 0; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #888;">Este correo fue generado desde tu Panel de Control.</p>
            </div>`,
        ];

        const encodedEmail = Buffer.from(emailLines.join('\r\n').trim())
            .toString('base64')
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedEmail },
        });

        res.status(200).json({ msg: "¡Correo enviado exitosamente!" });

    } catch (error) {
        console.error("Error en Gmail Controller:", error);
        res.status(500).json({ msg: "Error al enviar el correo", error: error.message });
    }
};

module.exports = { getAllUsers, googleLogin, sendEmail };