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


pool.query('CREATE TABLE IF NOT EXISTS suggestions(id SERIAL UNIQUE PRIMARY KEY, expiration timestamptz, color VARCHAR(8), title VARCHAR(255)), text VARCHAR(255), latitude DECIMAL, longitude DECIMAL');

//
app.get('/', (req, res) => {
  res.render('pages/home');
})


app.get('*', (req, res) => {
  res.redirect('/');
});

app.post('/newsuggestion', (req, res) => {
  // res.status(200).send({success : "Updated Successfully"});
  // return
  pool.query('INSERT INTO suggestions(id, expiration, color, title, text, latitude, longitude) values(DEFAULT $1, $2, $3, $4, $5, $6, $7)', [req.body.expiration, req.body.color, req.body.title, req.body.text, req.body.latitude, req.body.longitude])
  .then(()=> res.status(200).send({success : "Updated Successfully"}))
  .catch(()=> res.status(500).send({ error: 'Something failed!' }))
});

// start server
app.listen(PORT, function () {
  console.log(`Listening on port: ${PORT}`);
});
