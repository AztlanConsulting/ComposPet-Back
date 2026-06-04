const creditController = require('../../../controllers/credit.controller');
const Credit = require('../../../models/credit.model');

jest.mock('../../../models/credit.model');

describe('Controller - getCreditBalance', () => {
    let req;
    let res;

    beforeEach(()=>{
        req = {
            body: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        
        jest.clearAllMocks();
    });

    it ('Debe devolver 400 si no mandas el id del cliente', async () =>{


        await creditController.getCreditBalance(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Falta id del cliente para obtener el balance de tarjeta',
        });

        expect(Credit.getCreditBalance).not.toHaveBeenCalled();
    });

    it('Debe devolver 200 si recupera el saldo del cliente', async() => {

        req.body.clientId = "11111111-1111-1111-1111-111111111111";

        const mockCreditBalance = [
            { saldo: 500 },
        ];

        Credit.getCreditBalance.mockResolvedValue(mockCreditBalance);

        //Accción
        await creditController.getCreditBalance(req, res);

        //
        expect(Credit.getCreditBalance).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111");
        expect(Credit.getCreditBalance).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Saldo de tarjeta obtenido exitosamente",
            data: mockCreditBalance,
        });
    });

    it("Debe crear una tarjeta inicial y devolver 200 si el cliente", async () => {

        req.body.clientId = "11111111-1111-1111-1111-111111111111";

        const mockInitialCredit = {
            saldo: 0,
        };

        Credit.getCreditBalance.mockResolvedValue(null);
        Credit.createInitialCredit.mockResolvedValue(mockInitialCredit);

        await creditController.getCreditBalance(req, res);

        expect(Credit.getCreditBalance).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111");
        expect(Credit.createInitialCredit).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111");

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Saldo de tarjeta obtenido exitosamente",
            data: mockInitialCredit,
        });
    });

    it("Dene devolver 500 si ocurre un error al saldo", async () => {

        req.body.clientId = "11111111-1111-1111-1111-111111111111";

        Credit.getCreditBalance.mockRejectedValue(
            new Error("Error interno")
        );

        await creditController.getCreditBalance(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Error servidor al obtener el saldo del cliente.",
            error: expect.any(Error),
        });
    });
});