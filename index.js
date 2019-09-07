// "use strict";
// const express = require('express');
// const app = express();
const port = 8010;

const log = require('./winston');
// const bodyParser = require('body-parser');
// const jsonParser = bodyParser.json();

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(":memory:");

const app = require("./src/app")(db);

const buildSchemas = require("./src/schemas");

db.serialize(() => {
    buildSchemas(db);
    app.listen(port, () =>
    log.info(`App started and listening on port ${port}`)
    );
});
