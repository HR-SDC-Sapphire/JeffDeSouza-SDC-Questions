const express = require('express');
const bodyParser = require('body-parser')
const app = express();
app.use(bodyParser.json())
const mongoose = require('mongoose');
const Test = require('../database/models/test.js')

mongoose.connect('mongodb://localhost:27017/test', ()=> {
  console.log('connected to db!');
})

app.get('/', async (req, res) => {
  try {
    const posts = await Test.find();
    res.json(posts);
  } catch (err) {
    res.json({message: err})
  }
});

app.post('/insert', async (req, res) => {
  var body = req.body;
  const test1 = new Test({
    title: req.body.title,
    description: req.body.description
  });

  try {
    const data = await test1.save();
    res.json(data);
  } catch(err) {
    res.json({message: err})
  }
});

app.listen(3000);