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

    it ('Debe devolver 400 si no mandas el id del cliente', async() => {

        //Arrange (Preparar)
        req.body = {
            weekStartDate: '2026-04-26T00:00:00.000Z',
            weekEndDate: '2026-05-02T23:59:59.999Z',
        };

        //Actuar
        await collectionRequestController.getCurrentCollectionRequest(req, res);

        //Afirmar
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Faltan datos requeridos para obtener la solicitud de recolección.',
        });

        expect(CollectionRequest.getCurrentCollectionRequest).not.toHaveBeenCalled();
    });

    it ('Debe devolver 400 si no mandas el día inicial de la semana', async() => {

        //Arrange
        req.body = {
            clientId: '11111111-1111-1111-1111-111111111111',
            weekEndDate: '2026-05-02T23:59:59.999Z',
        };

        //Actuar
        await collectionRequestController.getCurrentCollectionRequest(req, res);

        //Afirmar
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Faltan datos requeridos para obtener la solicitud de recolección.',
        });

        expect(CollectionRequest.getCurrentCollectionRequest).not.toHaveBeenCalled();        
    });

    it ('Debe devolver 400 si no mandas el día final de la semana', async() => {

        //Arrange (Preparar)
        req.body = {
            clientId: '11111111-1111-1111-1111-111111111111',
            weekStartDate: '2026-04-26T00:00:00.000Z',
        };

        //Actuar
        await collectionRequestController.getCurrentCollectionRequest(req, res);

        //Afirmar
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({

            success: false,
            message: 'Faltan datos requeridos para obtener la solicitud de recolección.',
        })

        expect(CollectionRequest.getCurrentCollectionRequest).not.toHaveBeenCalled();
    });

    it ('Debe devolver 200 si encuentra un solicitud', async() => {

        //Arrange
        req.body = {
            clientId: '11111111-1111-1111-1111-111111111111',
            weekStartDate: '2026-04-26T00:00:00.000Z',
            weekEndDate: '2026-05-02T23:59:59.999Z',
        };

        const mockCurrentRequest = {
            id_solicitud: "115552255",
            id_cliente: req.body.clientId,
            cubetas_recolectadas: 2,
            cubetas_entregadas: 1,
            total_a_pagar: 100,
            total_pagado: 0,
            fecha: new Date("2026-04-28T12:00:00.000Z"),
            notas: "Solicitud existente",
            quiere_recoleccion: true,
            quiere_productos_extra: false,
        };

        CollectionRequest.getCurrentCollectionRequest.mockResolvedValue(mockCurrentRequest);

        //Actuar
        await collectionRequestController.getCurrentCollectionRequest(req, res);

        //Afirmar
        expect(CollectionRequest.getCurrentCollectionRequest).toHaveBeenCalledWith(
            req.body.clientId,
            req.body.weekStartDate,
            req.body.weekEndDate,
        );

        expect(CollectionRequest.createInitialCollectionRequest).not.toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Solicitud de recolección obtenida exitosamente.',
            data: mockCurrentRequest,
        });
        
    });

    it ('Debe crear una nueva solicitud y devolver 200', async() => {

        req.body = {
            clientId: '11111111-1111-1111-1111-111111111111',
            weekStartDate: '2026-04-26T00:00:00.000Z',
            weekEndDate: '2026-05-02T23:59:59.999Z',
        };

        const mockNewRequest = {
            id_solicitud: "115552211",
            id_cliente: req.body.clientId,
            cubetas_recolectadas: 0,
            cubetas_entregadas: 0,
            total_a_pagar: 0,
            total_pagado: 0,
            fecha: new Date("2026-04-28T12:00:00.000Z"),
            notas: null,
            quiere_recoleccion: true,
            quiere_productos_extra: true,
        };

        CollectionRequest.getCurrentCollectionRequest.mockResolvedValue(null);
        CollectionRequest.createInitialCollectionRequest.mockResolvedValue(mockNewRequest);

        await collectionRequestController.getCurrentCollectionRequest(req, res);

        expect(CollectionRequest.getCurrentCollectionRequest).toHaveBeenCalledWith(
            req.body.clientId,
            req.body.weekStartDate,
            req.body.weekEndDate,
        );

        expect(CollectionRequest.createInitialCollectionRequest).toHaveBeenCalledWith(
            req.body.clientId,
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Solicitud de recolección obtenida exitosamente.',
            data: mockNewRequest,
        });
    });

    it ('Debe devolver 500 si ocurre un error al obtener la solicitud', async() => {

        req.body = {
            clientId: '11111111-1111-1111-1111-111111111111',
            weekStartDate: '2026-04-26T00:00:00.000Z',
            weekEndDate: '2026-05-02T23:59:59.999Z',
        };

        CollectionRequest.getCurrentCollectionRequest.mockRejectedValue(
            new Error('Error interno'),
        );

        await collectionRequestController.getCurrentCollectionRequest(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error servidor al obtener la solicitud de recolección.',
            error: expect.any(Error),
        });
    });
})