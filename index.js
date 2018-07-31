const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const app = express();
const parser = require('body-parser');
const { Pool, Client } = require('pg');

// setup
app.use(express.static('public/'));
app.use(parser.json());
app.set('view engine', 'ejs');
let connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: connectionString,
});

//
app.get('/', (req, res) => {

})


app.get('*', (req, res) => {
  res.redirect('/');
});

// start server
app.listen(PORT, function () {
  console.log(`Listening on port: ${PORT}`);
});
