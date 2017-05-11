// @flow
/* eslint-disable no-console */

import express from 'express';
import bodyParser from 'body-parser';

import maker, {generators} from './';

const app = express();
const PORT = 4321;

const HTTP_ERROR = 400;

const CSS = `span#error {color:red;}
  p {font-family:monospace}
  li {list-style-type: none}
  ol li {font-style: italic; display: inline-block; padding-right: 1em;}`;

const HEADER = `<html>
  <head><title>Delirium output</title></head>
  <style>${CSS}</style>
  <body>`;

const FOOTER = '</body></html>';

function makeListItem(text) {
  return `<li>${text}</li>`;
}

function generateDocsHtml() {
  const docs = [];

  for (const func in generators) {
    if (generators.hasOwnProperty(func) && generators[func].doc) {
      let commandDoc = `<b>${func}:</b> ${generators[func].doc}`;

      if (generators[func].args) {
        const args = generators[func].args.map(makeListItem).join(' ');

        commandDoc += `<ol>${args}</ol>`;
      }
      docs.push(commandDoc);
    }
  }
  const fullDocs = docs.map(makeListItem).join(' ');

  return `<ul>${fullDocs}</ul>`;
}

app.get('/',
  bodyParser.urlencoded({extended: true}),
  (req, res) => {
    const defs = req.query;

    if (Object.keys(defs).length === 0) {
      return res.send(`${HEADER}Generators:${generateDocsHtml()}${FOOTER}`);
    }

    try {
      res.setHeader('Content-Type', 'application/json');
      res.append('Access-Control-Allow-Origin', '*');
      return res.send(JSON.stringify(maker(defs)));
    } catch (err) {
      return res.status(HTTP_ERROR).send(`${HEADER}<p>Error: variable `
        + `<span id="error">${err.message}</span> not found.</p><pre>${err.stack}</pre>${FOOTER}`);
    }
  }
);

app.listen(PORT, () => {
  console.log(`Delirium now listening on port ${PORT}`);
});
