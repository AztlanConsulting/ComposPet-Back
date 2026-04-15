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

const obtenerProductosExtra = async (req, res) => {
    try {
        const productosExtra = await SolicitudesRec.obtenerProductosExtra();

        return res.status(200).json({
            success: true,
            message: 'Productos extra obtenidos exitosamente.',
            data: productosExtra,
        });
    } catch (error) {
        if (error.message === 'PRODUCTOS_EXTRA_NO_ENCONTRADOS') {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron productos extra.',
            });
        }

        console.error('Error al obtener productos extra:', error);
        return res.status(500).json({
            success: false,
            message: 'Error servidor al obtener productos extra.',
            error,
        });
    }
};

const guardarSolicitudRecSegundaSeccion = async (req, res) => {
    console.log("Guardando segunda sección de la solicitud de recolección con body:", req.body);

    try {
        const { id_solicitud: idSolicitud, productos } = req.body;

        if (!idSolicitud || !Array.isArray(productos)) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos para guardar la segunda sección de la solicitud de recolección.',
            });
        }

        if (
            !productos.every(
                (producto) =>
                    producto.id_producto !== undefined &&
                    producto.cantidad !== undefined
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Cada producto debe incluir id_producto y cantidad.',
            });
        }

        const productosGuardados = await SolicitudesRec.guardarSolicitudRecSegundaSeccion(
            idSolicitud,
            productos
        );

        return res.status(200).json({
            success: true,
            message: 'Segunda sección de la solicitud de recolección guardada exitosamente.',
            data: productosGuardados,
        });
    } catch (error) {
        if (error.message === 'Solicitud no encontrada') {
            return res.status(404).json({
                success: false,
                message: 'La solicitud de recolección no existe.',
            });
        }

        console.error('Error al guardar la segunda sección de la solicitud de recolección:', error);

        return res.status(500).json({
            success: false,
            message: 'Error servidor al guardar la segunda sección de la solicitud de recolección.',
            error,
        });
    }
};

/**
 * Obtiene el id de la última solicitud de recolección de un cliente
 *
 * @async
 * @function obtenerUltimaSolicitudPorCliente
 * @param {string} req.body.id_cliente - Id del cliente
 */
const obtenerUltimaSolicitudPorCliente = async (req, res) => {

    try {
        const { id_cliente: idCliente } = req.body;
        if (!idCliente) {
            console.log("Entro donde")
            return res.status(400).json({
                success: false,
                message: 'El id del cliente es requerido.',
            });
        }

        const data = await SolicitudesRec.obtenerUltimaSolicitudPorCliente(idCliente);
        console.log('Última solicitud encontrada:', data);

        return res.status(200).json({
            data,
        });

    } catch (error) {
        console.error('Error al obtener la última solicitud:', error);
        return res.status(500).json({
            success: false,
            message: 'Error servidor al obtener la última solicitud.',
            error,
        });
    }
};

const getInfoAboutExtraProuctsSelected = async (req, res) => {
    try {
        console.log("Obteniendo información de los productos extra seleccionados con body:", req.body);
        const requestId  = req.body.requestID;
        console.log("Id de solicitud recibido:", requestId);

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: "El id de la solicitud es requerido para obtener la información de los productos extra seleccionados.",
            });
        }

        const data = await SolicitudesRec.getInfoAboutExtraProuctsSelected(requestId);

        return res.status(200).json({
            data,
        });
    } catch (error){
        return res.status(500).json({
            success:false,
            message: "Error al obtener la información de los productos extra",
            error,
        })
    }
};

module.exports = {
    obtenerSolicitudRecActual,
    guardarSolicitudRecPrimeraSeccion,
    guardarSolicitudRecSegundaSeccion,
    obtenerProductosExtra,
    obtenerUltimaSolicitudPorCliente,
    getInfoAboutExtraProuctsSelected,
};