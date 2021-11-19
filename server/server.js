const express = require('express');
const bodyParser = require('body-parser')
const app = express();
app.use(bodyParser.json())
const mongoose = require('mongoose');
const Test = require('../database/models/test.js')

mongoose.connect('mongodb://localhost:27017/test', ()=> {
  console.log('connected to db!');
})

app.get('/', (req, res) => {
  console.log('request received');
  res.send('home!');
});

app.post('/insert', (req, res) => {
  var body = req.body;
  const test1 = new Test({
    title: req.body.title,
    description: req.body.description
  });

  test1.save()
  .then((data)=> {
    console.log('data is', data);
    res.json(data);
  })
  .catch((err)=> {
    res.status(200).send('there was an error', err);
  })

  console.log('insert received', body);
  //res.send('insert!');
});


app.listen(3000);