const SolicitudesRec = require('../models/solicitudes_rec.model');


/**
 * Obtiene la solicitud de recolección actual del cliente para la semana actual
 * Si no existe una solicitud en ese rango de fechas, el modelo crea una solicitud inicial
 *
 * @async
 * @function obtenerSolicitudRecActual
 * @param {number} req.body.idCliente - Id del cliente
 * @param {string} req.body.fechaInicioSemana - Fecha inicial de la semana
 * @param {string} req.body.fechaFinSemana - Fecha final de la semana
 */

const obtenerSolicitudRecActual = async (req, res) => {
    try {

        //Arbnb style destructuring para extraer los datos del body de la solicitud
        const {
            idCliente,
            fechaInicioSemana,
            fechaFinSemana,
        } = req.body;

        // Validación de que lleguen los datos
        if (!idCliente || !fechaInicioSemana || !fechaFinSemana) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos para obtener la solicitud de recolección.',
            });
        }

        // Solicita al modelo la búsqueda o creación de la solicitud actual
        const solicitudRecActual = await SolicitudesRec.obtenerSolicitudRecActual(
            idCliente, 
            fechaInicioSemana, 
            fechaFinSemana
        );

         // Si ya existe una solicitud dentro del rango semanal, se retorna
        if (!solicitudRecActual) {
            solicitudRecActual= await SolicitudesRec.crearSolicitudRecInicial(idCliente);
        }

        res.status(200).json({
            success: true,
            message: "Solicitud de recolección obtenida exitosamente.",
            data: solicitudRecActual,
        });
    } catch (error) {
        console.error("Error al obtener la solicitud de recolección:", error);
        res.status(500).json({
            success: false,
            message: "Error servidor al obtener la solicitud de recolección.",
            error,
        });
    }   
};

/**
 * Guarda la información de la primera sección del formulario de recolección
 * Actualiza la solicitud con la decisión del cliente sobre si quiererecolección,
 * productos extra y las cantidades de cubetas que entregara y que le recolectaran 
 *
 * @async
 * @function guardarSolicitudRecPrimeraSeccion
 * @param {number} req.body.idSolicitud - Id de la solicitud
 * @param {boolean} req.body.quiereRecoleccion - Cliente desea recolección
 * @param {boolean} req.body.quiereProductosExtra - Cliente desea productos extra
 * @param {number} req.body.cubetasRecolectadas  - Cantidad de cubetas que el cliente entregará
 * @param {number} req.body.cubetasEntregadas -  Cantidad de cubetas vacías solicitadas
 */

const guardarSolicitudRecPrimeraSeccion = async (req, res) => {
    try {
        const {
            idSolicitud,
            quiereRecoleccion,
            quiereProductosExtra,
            cubetasRecolectadas,
            cubetasEntregadas,
        } = req.body;

        // Validación de que lleguen los datos
        if (!idSolicitud || quiereRecoleccion === undefined || quiereProductosExtra === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos para guardar la primera sección de la solicitud de recolección.',
            });
        }

         // Envía al modelo la información para actualizar la solicitud
        const solicitudGuardada = await SolicitudesRec.guardarSolicitudRecPrimeraSeccion({
            idSolicitud,
            quiereRecoleccion,
            quiereProductosExtra,
            cubetasRecolectadas,
            cubetasEntregadas
        });

        res.status(200).json({
            success: true,
            message: "Primera sección de la solicitud de recolección guardada exitosamente.",
            data: solicitudGuardada,
        });
    } catch (error) {
        console.error("Error al guardar la primera sección de la solicitud de recolección:", error);
        res.status(500).json({
            success: false,
            message: "Error servidor al guardar la primera sección de la solicitud de recolección.",
            error,
        });
    }
}

module.exports = {
    obtenerSolicitudRecActual,
    guardarSolicitudRecPrimeraSeccion,
};