const express = require('express');
const router = express.Router();

const solicitudRecController = require('../controllers/solicitudes_rec.controller');

// Ruta que obtiene la solicitud de recolección actual del cliente para la semana indicada
router.post('/form02/obtener', solicitudRecController.obtenerSolicitudRecActual);

// Ruta que guarda la información de la primera sección del formulario de recolección.
router.post('/form02/guardar', solicitudRecController.guardarSolicitudRecPrimeraSeccion);

// Ruta que obtiene la solicitud de recolección actual del cliente para la semana indicada
router.get('/form04/obtener', solicitudRecController.obtenerProductosExtra);

// Ruta que guarda la información de la primera sección del formulario de recolección.
router.post('/form04/guardar', solicitudRecController.guardarSolicitudRecSegundaSeccion);

router.post('/ultimaSolicitud', solicitudRecController.obtenerUltimaSolicitudPorCliente);

module.exports = router;