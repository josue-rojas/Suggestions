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

pool.query('CREATE TABLE IF NOT EXISTS suggestions(id SERIAL UNIQUE PRIMARY KEY, expiration timestamptz, color VARCHAR(8), title VARCHAR(255), text VARCHAR(255), longitude DECIMAL, latitude DECIMAL)');

app.get('/', (req, res) => {
  res.render('pages/home');
})

app.get('/suggestions/:swlon/:swlat/:nelon/:nelat', (req, res)=>{
  pool.query(`SELECT * FROM suggestions WHERE longitude BETWEEN ${req.params.swlon} and ${req.params.nelon} AND latitude BETWEEN ${req.params.swlat} and ${req.params.nelat}`)
  .then((results)=> res.send(JSON.stringify(results.rows)))
  .catch((err)=> res.status(500).send({ error: `Error: ${err}` }));
});

app.get('*', (req, res) => {
  res.redirect('/');
});

app.post('/newsuggestion', (req, res) => {
  pool.query('INSERT INTO suggestions(id, expiration, color, title, text, longitude, latitude) values(DEFAULT, $1, $2, $3, $4, $5, $6)', [req.body.expiration, req.body.color, req.body.title, req.body.text, req.body.longitude, req.body.latitude])
  .then(()=> res.status(200).send({success : "Updated Successfully"}))
  .catch((err)=> res.status(500).send({ error: `Error: ${err}` }))
});

// start server
app.listen(PORT, function () {
  console.log(`Listening on port: ${PORT}`);
});
