const collectionRequestController = require('../../../controllers/collectionRequest.controller');
const CollectionRequest = require('../../../models/collectionRequest.model');

jest.mock('../../../models/collectionRequest.model');

describe('Controller - getCurrentCollectionRequest', ()=> {
    let req;
    let res;

    beforeEach(()=> {
        req={
            body: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.clearAllMocks();
    });

    it ('Debe devolver 400 si no mandas el id del la solicitud', async() =>{

        //Arrange (Preparar)
        req.body = {
            wantsCollection: true,
            wantsExtraProducts: true,
            collectedBuckets: 2,
            deliveredBuckets: 1,
        };

        //Actuar
        await collectionRequestController.saveCollectionRequestFirstSection(req, res);

        //Afirmar
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Faltan datos requeridos para guardar la primera sección de la solicitud de recolección.',
        });

        expect(CollectionRequest.saveCollectionRequestFirstSection).not.toHaveBeenCalled();

    });

    it ('Debe devolver 400 si no manda la respuesta de si quiere recolección', async() =>{

        //Arrange (Preparar)
        req.body = {
            requestId: 'req-123',
            wantsExtraProducts: true,
            collectedBuckets: 2,
            deliveredBuckets: 1,
        };

        //Actuar
        await collectionRequestController.saveCollectionRequestFirstSection(req, res);

        //Afirmar
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Faltan datos requeridos para guardar la primera sección de la solicitud de recolección.',
        });

        expect(CollectionRequest.saveCollectionRequestFirstSection).not.toHaveBeenCalled();
    });

    it ('Debe devolver 400 si no manda la respuesta de si quiere productos extras', async() =>{

        //Arrange
        req.body = {
            requestId: 'req-123',
            wantsCollection: true,
            collectedBuckets: 2,
            deliveredBuckets: 1,
        };

        //Actuar
        await collectionRequestController.saveCollectionRequestFirstSection(req, res);

        //Afirmar
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Faltan datos requeridos para guardar la primera sección de la solicitud de recolección.',
        });

        expect(CollectionRequest.saveCollectionRequestFirstSection).not.toHaveBeenCalled();
    });

    it ('Debe devolver 200 si la recolección fue guardada con exito', async() =>{

        //Arrange (Preparar)
        req.body = {
            requestId: 'req-123',
            wantsCollection: true,
            wantsExtraProducts: false,
            collectedBuckets: 3,
            deliveredBuckets: 1,
        };

        const mockSavedCollectionRequest = {
            id_solicitud: 'req-123',
            quiere_recoleccion: true,
            quiere_productos_extra: false,
            cubetas_recolectadas: 3,
            cubetas_entregadas: 1,
        };

        CollectionRequest.saveCollectionRequestFirstSection.mockResolvedValue(
            mockSavedCollectionRequest,
        );

        //Actuar
        await collectionRequestController.saveCollectionRequestFirstSection(req, res);

        //Afirmar
        expect(CollectionRequest.saveCollectionRequestFirstSection).toHaveBeenCalledWith({
            requestId: 'req-123',
            wantsCollection: true,
            wantsExtraProducts: false,
            collectedBuckets: 3,
            deliveredBuckets: 1,
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Primera sección de la solicitud de recolección guardada exitosamente.',
            data: mockSavedCollectionRequest,
        });
    });

    it ('Debe devolver 500 si ocurre un error al guardar la solicitud', async() =>{

        //Arrange (Preparar)
        req.body = {
            requestId: 'req-123',
            wantsCollection: true,
            wantsExtraProducts: true,
            collectedBuckets: 2,
            deliveredBuckets: 1,
        };

        CollectionRequest.saveCollectionRequestFirstSection.mockRejectedValue(
            new Error('Error interno'),
        );

        //Actuar
        await collectionRequestController.saveCollectionRequestFirstSection(req, res);

        expect(CollectionRequest.saveCollectionRequestFirstSection).toHaveBeenCalledWith({
            requestId: 'req-123',
            wantsCollection: true,
            wantsExtraProducts: true,
            collectedBuckets: 2,
            deliveredBuckets: 1,
        });

        //Afirmar
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error servidor al guardar la primera sección de la solicitud de recolección.',
            error: expect.any(Error),
        });
    });
});