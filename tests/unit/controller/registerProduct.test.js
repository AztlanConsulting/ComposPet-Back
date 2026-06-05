jest.mock('../../../models/inventory.model');
jest.mock('fs/promises', () => ({
    unlink: jest.fn().mockResolvedValue(),
}));
jest.mock('file-type', () => ({
    fileTypeFromFile: jest.fn(),
}));

const inventoryController = require('../../../controllers/inventory.controller');
const Inventory = require('../../../models/inventory.model');
const fs = require('fs/promises');
const { fileTypeFromFile } = require('file-type');

describe('Controller - postRegisterProduct', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {},
            file: null,
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.clearAllMocks();
    });

    it('debe devolver 400 si faltan datos requeridos', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Faltan datos requeridos para registrar el producto.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
        expect(Inventory.createNewProduct).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si los tipos de datos son inválidos', async () => {
        req.body = {
            name: 123,
            price: '100',
            quantity: '10',
            color: '#169B49',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Los datos del producto tienen un tipo inválido.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si el nombre contiene caracteres inválidos', async () => {
        req.body = {
            name: 'Producto@Test',
            price: '100',
            quantity: '10',
            color: '#169B49',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'El nombre contiene caracteres inválidos.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si la descripción no es texto', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100',
            quantity: '10',
            color: '#169B49',
            description: 123,
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'La descripción debe ser texto.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si la descripción contiene caracteres inválidos', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100',
            quantity: '10',
            color: '#169B49',
            description: 'Descripción @ inválida',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'La descripción contiene caracteres inválidos.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si el nombre excede 60 caracteres', async () => {
        req.body = {
            name: 'a'.repeat(61),
            price: '100',
            quantity: '10',
            color: '#169B49',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'El nombre excede la longitud permitida.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si la descripción excede 255 caracteres', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100',
            quantity: '10',
            color: '#169B49',
            description: 'a'.repeat(256),
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'La descripción excede la longitud permitida.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si el nombre contiene emojis', async () => {
        req.body = {
            name: 'Producto 🐶',
            price: '100',
            quantity: '10',
            color: '#169B49',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'El nombre contiene caracteres inválidos.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si el precio tiene más de 2 decimales', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100.999',
            quantity: '10',
            color: '#169B49',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'El precio solo puede tener hasta 2 decimales.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si el precio es inválido', async () => {
        req.body = {
            name: 'Producto Test',
            price: '0',
            quantity: '10',
            color: '#169B49',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'El precio es inválido.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si el precio excede 100000', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100000.01',
            quantity: '10',
            color: '#169B49',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'El precio no puede exceder $100,000.00.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si la cantidad es inválida', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100',
            quantity: '-1',
            color: '#169B49',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'La cantidad es inválida.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si la cantidad excede 999', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100',
            quantity: '1000',
            color: '#169B49',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'La cantidad no puede ser mayor a 999.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si el color es inválido', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100',
            quantity: '10',
            color: 'verde',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'El color es inválido.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si la extensión de imagen no es válida', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100',
            quantity: '10',
            color: '#169B49',
        };

        req.file = {
            originalname: 'test.pdf',
            mimetype: 'application/pdf',
            size: 1000,
            path: 'uploads/products/test.pdf',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(fs.unlink).toHaveBeenCalledWith('uploads/products/test.pdf');
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'La extensión de la imagen no es válida.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si la imagen tiene mimetype inválido', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100',
            quantity: '10',
            color: '#169B49',
        };

        req.file = {
            originalname: 'test.png',
            mimetype: 'application/pdf',
            size: 1000,
            path: 'uploads/products/test.png',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(fs.unlink).toHaveBeenCalledWith('uploads/products/test.png');
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'La imagen debe ser JPG, JPEG, SVG, AVIF, HEIC, PNG o WEBP.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si la imagen excede 2 MB', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100',
            quantity: '10',
            color: '#169B49',
        };

        req.file = {
            originalname: 'test.png',
            mimetype: 'image/png',
            size: 2 * 1024 * 1024 + 1,
            path: 'uploads/products/test.png',
        };

        await inventoryController.postRegisterProduct(req, res);

        expect(fs.unlink).toHaveBeenCalledWith('uploads/products/test.png');
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'La imagen no puede exceder 2 MB.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si el contenido del archivo no corresponde a una imagen válida', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100',
            quantity: '10',
            color: '#169B49',
        };

        req.file = {
            originalname: 'test.png',
            mimetype: 'image/png',
            size: 1000,
            path: 'uploads/products/test.png',
        };

        fileTypeFromFile.mockResolvedValue(null);

        await inventoryController.postRegisterProduct(req, res);

        expect(fileTypeFromFile).toHaveBeenCalledWith('uploads/products/test.png');
        expect(fs.unlink).toHaveBeenCalledWith('uploads/products/test.png');
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'El contenido del archivo no corresponde a una imagen válida.',
        });

        expect(Inventory.findByName).not.toHaveBeenCalled();
    });

    it('debe devolver 409 si ya existe un producto con el mismo nombre', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100',
            quantity: '10',
            color: '#169B49',
        };

        Inventory.findByName.mockResolvedValue({
            id_producto: 1,
            nombre: 'Producto Test',
        });

        await inventoryController.postRegisterProduct(req, res);

        expect(Inventory.findByName).toHaveBeenCalledWith('Producto Test');
        expect(Inventory.createNewProduct).not.toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Ya existe un producto registrado con este nombre.',
        });
    });

    it('debe registrar un producto exitosamente sin imagen', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100.50',
            quantity: '10',
            color: '#169B49',
            description: 'Producto de prueba',
        };

        Inventory.findByName.mockResolvedValue(null);
        Inventory.createNewProduct.mockResolvedValue({
            id_producto: 1,
            nombre: 'Producto Test',
            precio: 100.50,
            cantidad: 10,
            color: '#169B49',
            estatus: true,
            deleted: false,
            imagen_url: 'uploads/products/default-product.png',
        });

        await inventoryController.postRegisterProduct(req, res);

        expect(Inventory.findByName).toHaveBeenCalledWith('Producto Test');
        expect(Inventory.createNewProduct).toHaveBeenCalledWith({
            name: 'Producto Test',
            price: 100.50,
            description: 'Producto de prueba',
            quantity: 10,
            imageUrl: 'uploads/products/default-product.png',
            color: '#169B49',
        });

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debe registrar un producto exitosamente con imagen', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100',
            quantity: '10',
            color: '#169B49',
        };

        req.file = {
            originalname: 'test.png',
            mimetype: 'image/png',
            size: 1000,
            path: 'uploads\\products\\test.png',
        };

        fileTypeFromFile.mockResolvedValue({
            ext: 'png',
            mime: 'image/png',
        });

        Inventory.findByName.mockResolvedValue(null);
        Inventory.createNewProduct.mockResolvedValue({
            id_producto: 1,
            nombre: 'Producto Test',
            precio: 100,
            cantidad: 10,
            color: '#169B49',
            estatus: true,
            deleted: false,
            imagen_url: 'uploads/products/test.png',
        });

        await inventoryController.postRegisterProduct(req, res);

        expect(Inventory.createNewProduct).toHaveBeenCalledWith({
            name: 'Producto Test',
            price: 100,
            description: '',
            quantity: 10,
            imageUrl: 'uploads/products/test.png',
            color: '#169B49',
        });

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debe devolver 500 si ocurre un error inesperado', async () => {
        req.body = {
            name: 'Producto Test',
            price: '100',
            quantity: '10',
            color: '#169B49',
        };

        Inventory.findByName.mockRejectedValue(new Error('Error interno'));

        await inventoryController.postRegisterProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error del servidor al registrar un producto',
        });
    });
});

describe('Controller - getInventory', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {};

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.clearAllMocks();
    });

    it('debe obtener el inventario exitosamente', async () => {
        Inventory.getInventory.mockResolvedValue([
            {
                id_producto: 1,
                nombre: 'Producto Test',
                precio: 100,
                descripcion: 'Descripción',
                cantidad: 10,
                color: '#169B49',
                estatus: true,
                imagen_url: 'uploads/products/test.png',
            },
        ]);

        await inventoryController.getInventory(req, res);

        expect(Inventory.getInventory).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Inventario obtenido exitosamente.',
            data: [
                {
                    productId: 1,
                    name: 'Producto Test',
                    price: 100,
                    description: 'Descripción',
                    quantity: 10,
                    color: '#169B49',
                    status: true,
                    imageUrl: 'uploads/products/test.png',
                },
            ],
        });
    });

    it('debe devolver 500 si ocurre un error al obtener inventario', async () => {
        Inventory.getInventory.mockRejectedValue(new Error('Error interno'));

        await inventoryController.getInventory(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error del servidor al obtener el inventario',
        });
    });
});