/**
* Recibe una métrica de Web Vitals del frontend y la registra en la consola del backend.
*
* @param {Object} req - Objeto de solicitud de Express.
* @param {Object} req.body - Datos de la métrica de Web Vitals.
* @param {Object} res - Objeto de respuesta de Express.
* @returns {Object} Respuesta JSON que confirma la recepción de la métrica.
*/
const registerWebVitalMetric = (req, res) => {
    try {
        
        const metricData = req.body;

        if (!metricData) {
            return res.status(400).json({
                message: 'Metric data is required',
            });
        }


        const {
            name,
            value,
            delta,
            unit,
            id,
            url,
            timestamp,
        } = req.body;

        console.log('\n[Web Vital Received]');

        console.table({
                [`Metric: ${name}`]: {
                    Value: `${value} ${unit}`,
                    Delta: `${delta} ${unit}`,
                    URL: url,
                    Date: timestamp,
                },
        });

        return res.status(200).json({
            message: 'Web Vital metric received successfully',
        });
    } catch (error) {
        console.error('Error receiving Web Vital metric:', error);

        return res.status(500).json({
            message: 'Error receiving Web Vital metric',
        });
    }
};

module.exports = {
    registerWebVitalMetric,
};