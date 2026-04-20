const AuthModel = require('../../models/auth/auth.model');
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcrypt');
const { google } = require('googleapis');
const { callExternalApi } = require('../../middlewares/externalApiClient');
const { verifyRefreshToken, generateAccessToken, generateRefreshToken } = require('../../utils/jwt.utils');
const { logIfAdmin } = require('../../utils/logIfAdmin');

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

/**
 * Configuración de las cookies de sesión.
 * @type {Object}
 * @property {boolean} httpOnly - Evita el acceso a la cookie vía JavaScript del cliente.
 * @property {boolean} secure - Solo permite el envío bajo HTTPS en producción.
 * @property {string} sameSite - Política de envío de cookies entre sitios.
 * @property {number} maxAge - Tiempo de vida de la cookie (7 días).
 */
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // false en desarrollo
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
    path: '/',
    ...(process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN 
        && { domain: process.env.COOKIE_DOMAIN }),
};

/**
 * Controlador del endpoint de inicio de sesión.
 * Orquesta la autenticación del usuario aplicando las siguientes validaciones en orden:
 * 1. Existencia del usuario por correo (solo usuarios con `estatus: true`).
 * 2. Verificación de bloqueo temporal por intentos fallidos previos.
 * 3. Comparación de contraseña con hash almacenado en base de datos.
 * 4. Incremento de intentos fallidos y bloqueo automático al alcanzar `MAX_ATTEMPTS`.
 *
 * Tras una autenticación exitosa, resetea los intentos fallidos, registra el evento
 * en bitácora y emite un JWT con vigencia de 8 horas.
 *
 * Todos los intentos (exitosos y fallidos) quedan registrados en la tabla `bitacora`
 * mediante `AuthModel.addLog` para trazabilidad y auditoría.
 *
 * @param {import('express').Request} req - Solicitud HTTP. Se esperan `email` y `password` en `req.body`.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @returns {Promise<void>} Respuesta JSON con los datos del usuario y token, o mensaje de error.
 * @throws {Error} Errores inesperados de base de datos o JWT se capturan y responden con HTTP 500.
 * @see AuthModel
 */

const login = async(req, res) => {
    console.log("Entro al login");

    const {email, password} = req.body;
    try{
        const user = await AuthModel.findUserByEmail(email);

        if (!user) {
            return res.status(401).json({message: 'Credenciales incorrectas.'});
        }

         // Se responde con el mismo mensaje genérico que credenciales incorrectas para no revelar si el correo existe
        if (user.bloqueado_hasta && new Date() < new Date(user.bloqueado_hasta)) {
            await logIfAdmin(user, 'INTENTO_LOGIN_CUENTA_BLOQUEADA');

            return res.status(401).json(
                {message: `Cuenta bloqueda. Intente en ${LOCK_MINUTES} minutos.`}
            );
        }

        const passwordOK = await bcrypt.compare(password, user.contrasena);

        if (!passwordOK) {
            const attempts = (user.intentos_fallidos || 0) + 1;

            // Al alcanzar el límite se bloquea la cuenta y se reinician los intentos en BD
            if (attempts >= MAX_ATTEMPTS){
                await AuthModel.lockAccount(user.id_usuario);

                await logIfAdmin(user, 'CUENTA_BLOQUEDA_POR_INTENTOS');

                return res.status(401).json({
                    message: `Cuenta bloqueda por ${LOCK_MINUTES} minutos.`
                });
            }

            await AuthModel.updateLoginTry(user.id_usuario, attempts);

            await logIfAdmin(user, 'INTENTO_LOGIN_FALLIDO', `Intentos: ${attempts}`);

            return res.status(401).json(
                {message: `Credenciales incorrectas.`}
            );

        }

        await AuthModel.resetLoginTry(user.id_usuario);
        await logIfAdmin(user, `LOGIN_EXITOSO`);

        const tokenPayload = {
            userId: user.id_usuario,
            email: user.correo,
            role: user.roles.nombre,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        res.cookie('refreshToken', refreshToken, cookieOptions);

        return res.status(200).json({
            id_usuario: user.id_usuario,
            correo: user.correo,
            rol: user.roles.nombre,
            primer_inicio_sesion: user.primer_inicio_sesion,
            accessToken,
        });

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ message: 'Error del servidor, inténtalo más tarde.' });
    }
};

/**
 * Procesa la autenticación mediante Google OAuth 2.0.
 * * 1. Valida el access_token con los servidores de Google usando una estrategia de reintentos.
 * 2. Verifica si el correo electrónico obtenido existe y está activo en la base de datos de ComposPet.
 * 3. Registra auditoría del intento (exitoso o fallido) en la tabla de logs.
 * 4. Genera un JWT propio de la aplicación si el usuario tiene acceso.
 * * @async
 * @param {import('express').Request} req - Objeto de petición, debe contener `token` en el body.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>} Responde con el JWT y datos del usuario o un error de autenticación.
 */
const googleAuth = async (req, res) => {
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


    const userDB = await AuthModel.findUserByEmail(email);


    if (!userDB) {
      await logIfAdmin(userDB, "LOGIN_GOOGLE_FALLIDO", `Intento con correo no registrado: ${email}`);
      
      return res.status(401).json({ 
        msg: "Este correo de Google no tiene acceso a ComposPet. Contacta al administrador." 
      });
    }

    const tokenPayload = { 
        userId: userDB.id_usuario, 
        email: userDB.correo, 
        role: userDB.roles.nombre 
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await logIfAdmin(userDB, "LOGIN_GOOGLE_EXITOSO", "Acceso mediante Google OAuth");

    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.cookie('googleToken', token, cookieOptions);

    res.status(200).json({ 
        msg: "Login correcto", 
        accessToken,
        user: { 
            id_usuario: userDB.id_usuario,
            name: name, 
            email: userDB.correo, 
            rol: userDB.roles.nombre,
            primer_inicio_sesion: userDB.primer_inicio_sesion,
            picture: picture 
        } 
    });

  } catch (error) {
    console.error("Error en Google Login:", error);
    res.status(400).json({ msg: "Token de Google inválido o expirado" });
  }
};

/**
 * Genera un nuevo par de tokens (Access y Refresh) utilizando un Refresh Token válido.
 * * @async
 * @param {import('express').Request} req - Petición que debe contener la cookie `refreshToken`.
 * @param {import('express').Response} res - Respuesta con el nuevo accessToken.
 * @returns {Promise<void>}
 * @throws {Error} Si el token ha expirado o ha sido manipulado.
 */
const refreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(403).json({ message: 'No hay token de refresco.' });
    }

    try {
        const payload = verifyRefreshToken(refreshToken);

        const newAccessToken = generateAccessToken({
            userId: payload.userId,
            email: payload.email,
            role: payload.role
        });

        const newRefreshToken = generateRefreshToken({
            userId: payload.userId,
            email: payload.email,
            role: payload.role
        });

        res.cookie('refreshToken', newRefreshToken, cookieOptions);

        return res.status(200).json({ accessToken: newAccessToken });

    } catch (error) {
        res.clearCookie('refreshToken');
        console.error('Error al refrescar token:', error);
        return res.status(403).json({ message: 'Token de refresco inválido o expirado.' });
    }
};

module.exports = {
    login, 
    googleAuth,
    refreshToken,
};