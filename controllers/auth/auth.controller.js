const AuthModel = require('../../models/auth/auth.model');
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcrypt');

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;

/**
 * Controlador del endpoint de inicio de sesión.
 * Orquesta la autenticación del usuario aplicando las siguientes validaciones en orden:
 * 1. Existencia del usuario por correo (solo usuarios con `estatus: true`).
 * 2. Verificación de bloqueo temporal por intentos fallidos previos.
 * 3. Comparación de contraseña con hash almacenado en base de datos.
 * 4. Incremento de intentos fallidos y bloqueo automático al alcanzar `MAX_INTENTOS`.
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

    console.log("headers:", req.headers["content-type"]);
    console.log("body:", req.body);

    const {email, password} = req.body;

    try{
        const user = await AuthModel.findUserByEmail(email);

        if (!user) {
            await AuthModel.addLog(null, 'INTENTO_LOGIN_USUARIO_INEXISTENTE',
                `Correo no encontrado: ${email}`);

            console.log("1. Usuario encontrado:", user ? "SÍ" : "NO");

            return res.status(401).json({message: 'Credenciales incorrectas.'});
        }

         // Se responde con el mismo mensaje genérico que credenciales incorrectas para no revelar si el correo existe
        if (user.bloqueado_hasta && new Date < new Date(user.bloqueado_hasta)) {
            await AuthModel.addLog(null, 'INTENTO_LOGIN_CUENTA_BLOQUEADA');

            console.log("2. bloqueado_hasta:", user.bloqueado_hasta);

            return res.status(401).json(
                {message: `Cuenta bloqueda. Intente en ${BLOQUEO_MINUTOS} minutos.`}
            );
        }

        const passwordOK = await bcrypt.compare(password, user.contrasena);

        console.log("3. Contraseña correcta:", passwordOK);

        console.log("password recibido:", password);
        console.log("hash en BD:", user.contrasena);
        console.log("longitud hash:", user.contrasena.length);

        if (!passwordOK) {
            const intentos = (user.intentos_fallidos || 0) + 1;

            // Al alcanzar el límite se bloquea la cuenta y se reinician los intentos en BD
            if (intentos >= MAX_INTENTOS){
                await AuthModel.lockAccount(user.id_usuario);
                await AuthModel.addLog(user.id_usuario, 'CUENTA_BLOQUEDA_POR_INTENTOS');

                return res.status(401).json({
                    message: `Cuenta bloqueda por ${BLOQUEO_MINUTOS} minutos.`
                });
            }

            await AuthModel.updateLoginTry(user.id_usuario, intentos);
            await AuthModel.addLog(user.id_usuario, 'INTENTO_LOGIN_FALLIDO',
                `Intentos: ${intentos}`);
            
            const restantes = MAX_INTENTOS - intentos;

            return res.status(401).json(
                {message: `Credenciales incorrectas. Intentos restantes: ${restantes}.`}
            );

        }

        await AuthModel.resetLoginTry(user.id_usuario);
        await AuthModel.addLog(user.id_usuario, `LOGIN_EXITOSO`);

        const token = jwt.sign(
            {
                id: user.id_usuario,
                email: user.correo,
                rol: user.roles.nombre,
            },
            process.env.JWT_SECRET, { expiresIn: '8h' }
        );

        return res.status(200).json({
            id_usuario: user.id_usuario,
            correo: user.correo,
            rol: user.roles.nombre,
            primer_inicio_sesion: user.primer_inicio_sesion,
            token,
        });

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

module.exports = {login};