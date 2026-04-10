/**
 * Genera el cuerpo HTML para los correos de Compospet.
 * @param {string} message - Contenido dinámico del mensaje.
 * @returns {string} Estructura HTML completa.
 */
const getEmailTemplate = (message) => {
    return `
    <div style="font-family: Arial, sans-serif; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
        <h2 style="color: #4CAF50;">Compospet</h2>
        <p style="font-size: 16px; color: #333;">${message}</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #888;">Este es un mensaje automático de activación.</p>
    </div>
    `.trim();
};

module.exports = { getEmailTemplate };