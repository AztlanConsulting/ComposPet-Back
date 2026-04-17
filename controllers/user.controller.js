const User = require('../models/user.model');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// Ejemplo de controlador para obtener todos los niveles desde la base de datos. 
const getAllUsers2 = async (req, res) => {
    try {
        const users = await User.getAllUsers2();
        res.status(200).json(users);
    } catch (error) {
        console.error("Error al obtener niveles:", error);
        res.status(500).json({ msg: "Error del servidor, inténtalo más tarde." });
    }
};


const { callExternalApi } = require('../middlewares/externalApiClient');

// Controlador para obtener todos los usuarios
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

    const userInfo = await callExternalApi(
        () => oauth2.userinfo.get(),
        'google-userinfo'
    );

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
 * Envía un correo electrónico utilizando la API de Gmail del usuario.
 * Requiere validación previa del middleware de sesión.
 * * @param {Object} req - Objeto de petición.
 * @param {Object} req.headers - Debe contener 'x-google-token' con el Access Token de Google.
 * @param {Object} req.body - Datos del correo (to, subject, message).
 * @param {Object} res - Objeto de respuesta.
 * @returns {Promise<void>} Respuesta exitosa con status 200.
 */
const sendEmail = async (req, res) => {
    const googleToken = req.headers['x-google-token'];
    const { to, subject, message } = req.body;

    if (!googleToken) {
        return res.status(401).json({ msg: "Falta el token de Google en los headers" });
    }

    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: googleToken });
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

        await callExternalApi(
        () => gmail.users.messages.send({ userId: 'me', requestBody: { raw: encodedEmail } }),
        'gmail-send'
        );

        res.status(200).json({ msg: "¡Correo enviado exitosamente!" });

    } catch (error) {
        console.error("Error en Gmail Controller:", error);
        res.status(500).json({ msg: "Error al enviar el correo", error: error.message });
    }
};

const sendSheets = async (request, response) => {
    const googleToken = req.headers['x-google-token'];
    const { numero, texto } = req.body;

    // Validación de token de Google
    if (!googleToken) {
        return response.status(401).json({ msg: "No hay token de acceso" });
    }

    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: googleToken });
        const sheets = google.sheets({version: 'v4', auth});

        // Seleccionamos el archivo y el rango de datos
        const spreadsheetId = '1sx5JCvSrVpJGdA6eKwjBoZyiNMFO2KtfuWmoMD0GZ8A';
        const range = 'Prueba!A1';
            
        const values = [[numero, texto]];

        // Mandamos la información
        await callExternalApi(
        () => sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Prueba!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        }),
        'sheets-append'
        );

        // Recuperamos la información y la mandamos de respuesta
        const data = await callExternalApi(
        () => sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Prueba!A1:B10',
        }),
        'sheets-get'
        );

        dataClean = data.data.values;
        console.log(dataClean)
        response.status(200).json({ data: dataClean });

    } catch (error) {
        console.error("Error en Sheets Controller:", error);
        response.status(500).json({ 
            msg: "Error al ingresar el valor", 
            error: error.message 
        });
    }
    
};

module.exports = {
    getAllUsers,
    googleLogin, 
    sendEmail, 
    sendSheets,
    getAllUsers2
};

