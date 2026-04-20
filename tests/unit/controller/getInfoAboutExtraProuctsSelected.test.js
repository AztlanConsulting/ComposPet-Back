const collectionRequestController = require("../../../controllers/collectionRequest.controller");
const CollectionRequest = require("../../../models/collectionRequest.model");

jest.mock("../../../models/collectionRequest.model");

describe("Controller - getInfoAboutExtraProuctsSelected", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it("debe devolver 400 si no se envía requestID", async () => {
    // Act
    await collectionRequestController.getInfoAboutExtraProuctsSelected(
      req,
      res,
    );

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message:
        "El id de la solicitud es requerido para obtener la información de los productos extra seleccionados.",
    });
  });

  it("debe devolver 200 con los productos seleccionados", async () => {
    // Arrange
    req.body.requestID = "request-123";

    const mockData = [
      { id_producto: 1, cantidad: 2 },
      { id_producto: 2, cantidad: 1 },
    ];

    CollectionRequest.getInfoAboutExtraProuctsSelected.mockResolvedValue(
      mockData,
    );

    // Act
    await collectionRequestController.getInfoAboutExtraProuctsSelected(
      req,
      res,
    );

    // Assert
    expect(
      CollectionRequest.getInfoAboutExtraProuctsSelected,
    ).toHaveBeenCalledWith("request-123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: mockData,
    });
  });

  it("debe devolver 500 si ocurre un error", async () => {
    // Arrange
    req.body.requestID = "request-123";

    CollectionRequest.getInfoAboutExtraProuctsSelected.mockRejectedValue(
      new Error("Error interno"),
    );

    // Act
    await collectionRequestController.getInfoAboutExtraProuctsSelected(
      req,
      res,
    );

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Error al obtener la información de los productos extra",
      error: expect.any(Error),
    });
  });
});
