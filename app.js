const express = require('express');
const app = express();
const cors = require('cors');
const { register } = require('./config/metrics');
const monitorMiddleware = require('./middlewares/monitor');

const routes = require('./routes/general_routes.routes');

app.use(cors());
app.use(express.json());
app.use(monitorMiddleware);

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
app.use('/', routes);

module.exports = app;