const prisma = require("../config/prisma");

const parseTransferData = (notes) => {
    if (!notes) return { accountHolder: null, accountNumber: null };

    const parts = notes.split("\r\n"); // ← era "¶"
    const accountHolder = parts[0]?.trim() || null;
    const cuentaPart = parts[2]?.trim() || null;
    const accountNumber = cuentaPart?.replace(/^Cuenta:\s*/i, "").trim() || null;

    return { accountHolder, accountNumber };
};

module.exports = class AdminProfile {
    static async getProfileInformation(userId){
        const [user, transfer] = await Promise.all([
            prisma.usuarios_cp.findUnique({
                where: { id_usuario: userId },
                select: {
                    nombre: true,
                    apellido: true,
                    telefono: true,
                    correo: true,
                },
            }),
            prisma.formas_pago.findFirst({
                where: { 
                    tipo: "Transferencia" 
                },
                select: { 
                    notas: true 
                },
            }),
        ]);

        if (!user) throw new Error("Usuario no encontrado.");

        const { accountHolder, accountNumber } = parseTransferData(transfer?.notas);

        return {
            name: `${user.nombre} ${user.apellido ?? ""}`.trim(),
            phone: user.telefono,
            email: user.correo,
            accountHolder,
            accountNumber,
        };

    }

    static async updateProfileInformation(
        userId,
        {
            nombre,
            apellido,
            phone,
            email,
            accountHolder,
            accountNumber,
        }
    ) {
        const transferNotes =
            `${accountHolder}\r\n\r\nCuenta: ${accountNumber}`;

        await prisma.$transaction([
            prisma.usuarios_cp.update({
                where: {
                    id_usuario: userId,
                },
                data: {
                    nombre,
                    apellido,
                    telefono: phone,
                    correo: email,
                },
            }),

            prisma.formas_pago.updateMany({
                where: {
                    tipo: "Transferencia",
                },
                data: {
                    notas: transferNotes,
                },
            }),
        ]);

        return this.getProfileInformation(userId);
    }
}