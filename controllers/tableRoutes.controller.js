const Routes = require('../models/route.model');

const getTableInfo = async(req,res) => {
    try {
        const routeInfo = await Routes.getRoutesInfo();
        
        return res.status(200).json({
            success: true,
            data: routeInfo,
        })
    } catch(error){
        return res.status(400).json({
            success: false,
            message: "Ocurrió un error obteniendo la información.",
        })
    }
}


module.exports = {
    getTableInfo,
}