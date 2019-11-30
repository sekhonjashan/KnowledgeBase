/**
 * @description Annotated Relational Algebra System
 * @fileoverview Server configuration and creating a new HTTP server instance
 * @author Sadaf Najam
 * @year 2019
 */
const express = require('express');
path = require('path');
bodyParser = require('body-parser');
cors = require('cors');
const aras = require('./routes/aras.route');
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use('/', aras);
const port = process.env.PORT || 4000;
/**
 * Server configuration
 * HTTP server instance
 * server will run default port 4000 
 */
const server = app.listen(port, function(){
  console.log('Listening on port ' + port);
});