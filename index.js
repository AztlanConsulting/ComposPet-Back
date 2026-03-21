const express = require('express');
const app = express();
const PORT = 8080;
const cors = require('cors');

const routes = require('./routes/general_routes.routes');

app.use(cors()); 
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'API funcionando' });
});

app.use('/', routes);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});