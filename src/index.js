// @flow
/* eslint-disable no-console */

import express from 'express';
import bodyParser from 'body-parser';

import maker from './maker';

const app = express();
const PORT = 4321;

const HTTP_ERROR = 400;

const HEADER = `<html><head><title>Delirium output</title></head><style>
  span#error {color:red;}
  p {font-family:monospace}
  </style><body>`;

const FOOTER = '</body></html>';

app.get('/',
  bodyParser.urlencoded({extended: true}),
  (req, res, next) => {
    const defs = req.query;

    try {
      res.setHeader('Content-Type', 'application/json');
      res.append('Access-Control-Allow-Origin', '*');
      res.send(JSON.stringify(maker(defs)));
    } catch (err) {
      res.status(HTTP_ERROR).send(`${HEADER}<p>Error: variable `
        + `<span id="error">${err.message}</span> not found.</p><pre>${err.stack}</pre>${FOOTER}`);
    }
    next();
  }
);

app.listen(PORT, () => {
  console.log(`Delirium now listening on port ${PORT}`);
});
