const express = require('express');
const app = express();
const cors = require('cors');

const routes = require('./routes/general_routes.routes');

app.use(cors({
  origin: 'https://compospetmx.org',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use('/', routes);

module.exports = app;