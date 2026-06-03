const { validateEditClient, validateRequestUpdate } = require('../../../utils/editValidations');


describe('Unit - Utils - validateEditClient', () => {

    describe('campos opcionales', () => {

        it('debe retornar isValid true con objeto vacío (todos opcionales)', () => {
            const result = validateEditClient({});

            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual({});
        });

        it('debe retornar isValid true con solo cellphone válido', () => {
            const result = validateEditClient({ cellphone: '4421234567' });

            expect(result.isValid).toBe(true);
            expect(result.data.cellphone).toBe('4421234567');
            expect(result.data.email).toBeUndefined();
        });

        it('debe retornar isValid true con solo email válido', () => {
            const result = validateEditClient({ email: 'test@correo.com' });

            expect(result.isValid).toBe(true);
            expect(result.data.email).toBe('test@correo.com');
            expect(result.data.cellphone).toBeUndefined();
        });

        it('no debe incluir campos no enviados en data', () => {
            const result = validateEditClient({ notes: 'Solo notas' });

            expect(result.data.cellphone).toBeUndefined();
            expect(result.data.email).toBeUndefined();
            expect(result.data.address).toBeUndefined();
            expect(result.data.pets).toBeUndefined();
            expect(result.data.family).toBeUndefined();
            expect(result.data.routeId).toBeUndefined();
            expect(result.data.notes).toBe('Solo notas');
        });

    });

    describe('cellphone', () => {

        it('debe aceptar teléfono de 10 dígitos', () => {
            const result = validateEditClient({ cellphone: '4421234567' });
            expect(result.isValid).toBe(true);
        });

        it('debe aceptar teléfono con prefijo +52', () => {
            const result = validateEditClient({ cellphone: '+524421234567' });
            expect(result.isValid).toBe(true);
        });

        it('debe rechazar teléfono con menos dígitos', () => {
            const result = validateEditClient({ cellphone: '12345' });
            expect(result.isValid).toBe(false);
            expect(result.errors.cellphone).toBeDefined();
        });

        it('debe rechazar teléfono con letras', () => {
            const result = validateEditClient({ cellphone: 'abcdefghij' });
            expect(result.isValid).toBe(false);
            expect(result.errors.cellphone).toBeDefined();
        });

    });

    describe('email', () => {

        it('debe aceptar email válido', () => {
            const result = validateEditClient({ email: 'usuario@dominio.com' });
            expect(result.isValid).toBe(true);
            expect(result.data.email).toBe('usuario@dominio.com');
        });

        it('debe convertir email a minúsculas', () => {
            const result = validateEditClient({ email: 'USUARIO@DOMINIO.COM' });
            expect(result.data.email).toBe('usuario@dominio.com');
        });

        it('debe rechazar email sin @', () => {
            const result = validateEditClient({ email: 'usuariodominio.com' });
            expect(result.isValid).toBe(false);
            expect(result.errors.email).toBeDefined();
        });

        it('debe rechazar email sin dominio', () => {
            const result = validateEditClient({ email: 'usuario@' });
            expect(result.isValid).toBe(false);
            expect(result.errors.email).toBeDefined();
        });

        it('no debe validar email si no fue enviado', () => {
            const result = validateEditClient({});
            expect(result.errors.email).toBeUndefined();
        });

    });

    describe('address', () => {

        it('debe aceptar dirección válida', () => {
            const result = validateEditClient({ address: 'Calle Falsa 123' });
            expect(result.isValid).toBe(true);
        });

        it('debe rechazar dirección con emojis', () => {
            const result = validateEditClient({ address: 'Calle 😀 123' });
            expect(result.isValid).toBe(false);
            expect(result.errors.address).toBe('La dirección no puede contener emojis.');
        });

        it('debe rechazar dirección menor a 5 caracteres', () => {
            const result = validateEditClient({ address: 'Ca1' });
            expect(result.isValid).toBe(false);
            expect(result.errors.address).toBeDefined();
        });

        it('debe rechazar dirección con caracteres especiales no permitidos', () => {
            const result = validateEditClient({ address: 'Calle <script>' });
            expect(result.isValid).toBe(false);
            expect(result.errors.address).toBeDefined();
        });

        it('no debe validar address si no fue enviado', () => {
            const result = validateEditClient({});
            expect(result.errors.address).toBeUndefined();
        });

    });

    describe('pets', () => {

        it('debe aceptar valor válido de mascotas', () => {
            const result = validateEditClient({ pets: '2 perros' });
            expect(result.isValid).toBe(true);
        });

        it('debe rechazar mascotas con emojis', () => {
            const result = validateEditClient({ pets: '🐶 perro' });
            expect(result.isValid).toBe(false);
            expect(result.errors.pets).toBe('Mascotas no puede contener emojis.');
        });

        it('debe rechazar mascotas mayor a 100 caracteres', () => {
            const result = validateEditClient({ pets: 'a'.repeat(101) });
            expect(result.isValid).toBe(false);
            expect(result.errors.pets).toBe('La información de mascotas es demasiado larga.');
        });

        it('debe aceptar mascotas de exactamente 100 caracteres', () => {
            const result = validateEditClient({ pets: 'a'.repeat(100) });
            expect(result.isValid).toBe(true);
        });

        it('no debe validar pets si no fue enviado', () => {
            const result = validateEditClient({});
            expect(result.errors.pets).toBeUndefined();
        });

    });

    describe('family', () => {

        it('debe aceptar valor válido de familia', () => {
            const result = validateEditClient({ family: '2 adultos, 1 niño' });
            expect(result.isValid).toBe(true);
        });

        it('debe rechazar familia con emojis', () => {
            const result = validateEditClient({ family: '👨‍👩‍👧' });
            expect(result.isValid).toBe(false);
            expect(result.errors.family).toBe('Familia no puede contener emojis.');
        });

        it('debe rechazar familia mayor a 100 caracteres', () => {
            const result = validateEditClient({ family: 'b'.repeat(101) });
            expect(result.isValid).toBe(false);
            expect(result.errors.family).toBe('La información de familia es demasiado larga.');
        });

        it('no debe validar family si no fue enviado', () => {
            const result = validateEditClient({});
            expect(result.errors.family).toBeUndefined();
        });

    });

    describe('notes', () => {

        it('debe aceptar notas válidas', () => {
            const result = validateEditClient({ notes: 'Dejar en la puerta' });
            expect(result.isValid).toBe(true);
        });

        it('debe rechazar notas con emojis', () => {
            const result = validateEditClient({ notes: 'Entregar 📦' });
            expect(result.isValid).toBe(false);
            expect(result.errors.notes).toBe('Las notas no pueden contener emojis.');
        });

        it('debe rechazar notas mayor a 500 caracteres', () => {
            const result = validateEditClient({ notes: 'n'.repeat(501) });
            expect(result.isValid).toBe(false);
            expect(result.errors.notes).toBe('Ingresa máximo 500 caracteres.');
        });

        it('debe aceptar notas de exactamente 500 caracteres', () => {
            const result = validateEditClient({ notes: 'n'.repeat(500) });
            expect(result.isValid).toBe(true);
        });

        it('no debe validar notes si no fue enviado', () => {
            const result = validateEditClient({});
            expect(result.errors.notes).toBeUndefined();
        });

    });

    describe('routeId', () => {

        it('debe aceptar routeId entero positivo', () => {
            const result = validateEditClient({ routeId: 3 });
            expect(result.isValid).toBe(true);
            expect(result.data.routeId).toBe(3);
        });

        it('debe rechazar routeId igual a 0', () => {
            const result = validateEditClient({ routeId: 0 });
            expect(result.isValid).toBe(false);
            expect(result.errors.routeId).toBeDefined();
        });

        it('debe rechazar routeId negativo', () => {
            const result = validateEditClient({ routeId: -1 });
            expect(result.isValid).toBe(false);
            expect(result.errors.routeId).toBeDefined();
        });

        it('debe rechazar routeId no numérico', () => {
            const result = validateEditClient({ routeId: 'abc' });
            expect(result.isValid).toBe(false);
            expect(result.errors.routeId).toBeDefined();
        });

        it('no debe validar routeId si no fue enviado', () => {
            const result = validateEditClient({});
            expect(result.errors.routeId).toBeUndefined();
            expect(result.data.routeId).toBeUndefined();
        });

    });

    describe('escapeHtml', () => {

        it('debe escapar caracteres HTML en address', () => {
            const result = validateEditClient({ address: 'Calle & Avenida 123' });
            expect(result.data.address).toBe('Calle &amp; Avenida 123');
        });

        it('debe escapar comillas en notes', () => {
            const result = validateEditClient({ notes: 'Código "A1"' });
            expect(result.data.notes).toBe('Código &quot;A1&quot;');
        });

    });

    describe('múltiples campos y múltiples errores', () => {

        it('debe acumular múltiples errores', () => {
            const result = validateEditClient({
                cellphone: '123',
                email: 'no-es-email',
                routeId: -5,
            });

            expect(result.isValid).toBe(false);
            expect(result.errors.cellphone).toBeDefined();
            expect(result.errors.email).toBeDefined();
            expect(result.errors.routeId).toBeDefined();
        });

        it('debe retornar isValid true con todos los campos válidos', () => {
            const result = validateEditClient({
                cellphone: '4421234567',
                email: 'test@test.com',
                address: 'Calle Verdadera 456',
                pets: '1 gato',
                family: '2 adultos',
                notes: 'Sin notas especiales',
                routeId: 2,
            });

            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual({});
        });

    });

});

describe('Unit - Utils - validateRequestUpdate', () => {

    const baseData = {
        collectedBuckets: 5,
        deliveredBuckets: 2,
    };

    describe('collectedBuckets', () => {

        it('debe aceptar valor válido', () => {
            const result = validateRequestUpdate(baseData);
            expect(result.isValid).toBe(true);
        });

        it('debe rechazar si es null', () => {
            const result = validateRequestUpdate({ ...baseData, collectedBuckets: null });
            expect(result.isValid).toBe(false);
            expect(result.errors.collectedBuckets).toBe('Las cubetas son obligatorias.');
        });

        it('debe rechazar si es undefined', () => {
            const result = validateRequestUpdate({ deliveredBuckets: 2 });
            expect(result.isValid).toBe(false);
            expect(result.errors.collectedBuckets).toBe('Las cubetas son obligatorias.');
        });

        it('debe rechazar si es mayor a 100', () => {
            const result = validateRequestUpdate({ ...baseData, collectedBuckets: 101 });
            expect(result.isValid).toBe(false);
            expect(result.errors.collectedBuckets).toBe('Las cubetas recolectadas no pueden ser más de 100.');
        });

        it('debe aceptar exactamente 100', () => {
            const result = validateRequestUpdate({ ...baseData, collectedBuckets: 100 });
            expect(result.isValid).toBe(true);
        });

        it('debe aceptar 0', () => {
            const result = validateRequestUpdate({ ...baseData, collectedBuckets: 0 });
            expect(result.isValid).toBe(true);
        });

    });

    describe('deliveredBuckets', () => {

        it('debe rechazar si es null', () => {
            const result = validateRequestUpdate({ ...baseData, deliveredBuckets: null });
            expect(result.isValid).toBe(false);
            expect(result.errors.deliveredBuckets).toBe('Las cubetas son obligatorias.');
        });

        it('debe rechazar si es undefined', () => {
            const result = validateRequestUpdate({ collectedBuckets: 5 });
            expect(result.isValid).toBe(false);
            expect(result.errors.deliveredBuckets).toBe('Las cubetas son obligatorias.');
        });

        it('debe rechazar valor negativo', () => {
            const result = validateRequestUpdate({ ...baseData, deliveredBuckets: -1 });
            expect(result.isValid).toBe(false);
            expect(result.errors.deliveredBuckets).toBe('El número de cubetas debe de ser positivo.');
        });

        it('debe rechazar si es mayor a 20', () => {
            const result = validateRequestUpdate({ ...baseData, deliveredBuckets: 21 });
            expect(result.isValid).toBe(false);
            expect(result.errors.deliveredBuckets).toBe('Las cubetas a entregar no pueden ser más de 20.');
        });

        it('debe aceptar exactamente 20', () => {
            const result = validateRequestUpdate({ ...baseData, deliveredBuckets: 20 });
            expect(result.isValid).toBe(true);
        });

        it('debe aceptar 0', () => {
            const result = validateRequestUpdate({ ...baseData, deliveredBuckets: 0 });
            expect(result.isValid).toBe(true);
        });

    });

    describe('totalPaid', () => {

        it('debe aceptar totalPaid válido', () => {
            const result = validateRequestUpdate({ ...baseData, totalPaid: 150 });
            expect(result.isValid).toBe(true);
        });

        it('no debe validar totalPaid si no fue enviado', () => {
            const result = validateRequestUpdate(baseData);
            expect(result.errors.totalPaid).toBeUndefined();
        });

        it('debe rechazar totalPaid negativo', () => {
            const result = validateRequestUpdate({ ...baseData, totalPaid: -1 });
            expect(result.isValid).toBe(false);
            expect(result.errors.totalPaid).toBe('El total pagado debe de ser positivo.');
        });

        it('debe rechazar totalPaid mayor a 1000000', () => {
            const result = validateRequestUpdate({ ...baseData, totalPaid: 1000001 });
            expect(result.isValid).toBe(false);
            expect(result.errors.totalPaid).toBe('Ingrese un valor real.');
        });

        it('debe aceptar totalPaid igual a 0', () => {
            const result = validateRequestUpdate({ ...baseData, totalPaid: 0 });
            expect(result.isValid).toBe(true);
        });

    });

    describe('notes', () => {

        it('debe aceptar notas válidas', () => {
            const result = validateRequestUpdate({ ...baseData, notes: 'Sin novedad' });
            expect(result.isValid).toBe(true);
        });

        it('debe rechazar notas con emojis', () => {
            const result = validateRequestUpdate({ ...baseData, notes: 'Todo bien 👍' });
            expect(result.isValid).toBe(false);
            expect(result.errors.notes).toBe('Las notas no pueden contener emojis.');
        });

        it('debe rechazar notas mayor a 500 caracteres', () => {
            const result = validateRequestUpdate({ ...baseData, notes: 'x'.repeat(501) });
            expect(result.isValid).toBe(false);
            expect(result.errors.notes).toBe('Ingresa máximo 500 caracteres.');
        });

        it('no debe validar notes si está vacío', () => {
            const result = validateRequestUpdate({ ...baseData, notes: '' });
            expect(result.errors.notes).toBeUndefined();
        });

    });

    describe('schedule', () => {

        it('debe aceptar horario válido HH:MM', () => {
            const result = validateRequestUpdate({ ...baseData, schedule: '09:30' });
            expect(result.isValid).toBe(true);
        });

        it('debe rechazar horario con formato incorrecto (24hrs)', () => {
            const result = validateRequestUpdate({ ...baseData, schedule: '14:00' });
            expect(result.isValid).toBe(false);
            expect(result.errors.schedule).toBe('Ingresa un horario con el formato HH:MM (12 hrs.)');
        });

        it('debe rechazar horario con emojis', () => {
            const result = validateRequestUpdate({ ...baseData, schedule: '⏰:30' });
            expect(result.isValid).toBe(false);
            expect(result.errors.schedule).toBe('El horario no puede contener emojis.');
        });

        it('no debe validar schedule si está vacío', () => {
            const result = validateRequestUpdate({ ...baseData, schedule: '' });
            expect(result.errors.schedule).toBeUndefined();
        });

        it('debe aceptar 12:59', () => {
            const result = validateRequestUpdate({ ...baseData, schedule: '12:59' });
            expect(result.isValid).toBe(true);
        });

        it('debe rechazar 00:00 (hora 00 no válida en 12hrs)', () => {
            const result = validateRequestUpdate({ ...baseData, schedule: '00:00' });
            expect(result.isValid).toBe(false);
        });

    });

    describe('sanitizedData', () => {

        it('debe retornar sanitizedData con los datos originales más notas y schedule escapados', () => {
            const result = validateRequestUpdate({
                ...baseData,
                notes: 'Nota <b>especial</b>',
                schedule: '10:00',
            });

            expect(result.sanitizedData.notes).toBe('Nota &lt;b&gt;especial&lt;/b&gt;');
            expect(result.sanitizedData.schedule).toBe('10:00');
            expect(result.sanitizedData.collectedBuckets).toBe(5);
        });

    });

});