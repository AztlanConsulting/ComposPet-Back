const User = require('../models/user.model');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');

const getAllUsers = (req, res) => {
    const users = User.getAllUsers();
    res.json(users);
};

const googleLogin = async (req, res) => {
  const { token } = req.body; // Este es el Access Token que viene de useGoogleLogin

  try {
    // 1. Usamos el token para pedirle a Google la info del usuario directamente
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });

    const oauth2 = google.oauth2({ version: 'v2', auth });
    const userInfo = await oauth2.userinfo.get();

    // Extraemos los datos que nos interesan
    const { email, name, picture } = userInfo.data;

    console.log("Usuario autenticado vía Access Token:", email);

    // 2. Creamos TU propio JWT para la sesión de Compospet
    const userToken = jwt.sign(
      { email, name },
      process.env.JWT_SECRET || 'TU_PALABRA_SECRETA', 
      { expiresIn: '24h' }
    );

    // 3. Respondemos al Front
    res.status(200).json({ 
      msg: "Login correcto", 
      token: userToken, 
      user: { name, email, picture } 
    });

  } catch (error) {
    console.error("Error en Google Login con Access Token:", error);
    res.status(400).json({ msg: "Token inválido o expirado" });
  }
};

const sendEmail = async (req, res) => {
    const { token, to, subject, message } = req.body;

    if (!token) {
        return res.status(401).json({ msg: "No hay token de acceso" });
    }

    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: token });
        const gmail = google.gmail({ version: 'v1', auth });

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

        const email = emailLines.join('\r\n').trim();

        const encodedEmail = Buffer.from(email)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // 4. Enviar
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedEmail,
            },
        });

        res.status(200).json({ msg: "¡Correo enviado exitosamente!" });

    } catch (error) {
        console.error("Error en Gmail Controller:", error);
        res.status(500).json({ 
            msg: "Error al enviar el correo", 
            error: error.message 
        });
    }
};

module.exports = {
    getAllUsers,
    googleLogin, 
    sendEmail, 
};