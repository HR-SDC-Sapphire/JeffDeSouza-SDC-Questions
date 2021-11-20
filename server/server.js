const express = require('express');
const bodyParser = require('body-parser')
const app = express();
app.use(bodyParser.json())
const mongoose = require('mongoose');
const Test = require('../database/models/test.js')
const Question = require('../database/models/questions.js')
var fs = require('fs')
var es = require('event-stream');
var path = require('path');
const PORT = 3000;

console.log('SOF.')
//csvfast??

mongoose.connect('mongodb://localhost:27017/allQuestions', ()=> {
  console.log('connected to the db!');
})

app.get('/', async (req, res) => {
  try {
    const posts = await Test.find();
    res.json(posts);
  } catch (err) {
    res.json({message: err})
  }
});

var loadFileContents = function() {
  var loc = path.join(__dirname, './data/testQuestions.csv')
  var stream = fs.createReadStream(loc)
  var brokenQuestions = [];
    .pipe(es.split())
    .pipe(es.mapSync((line)=> {
      stream.pause();
      // console.log('line:', line);
      var entries = lineToEntries(line);
      //entries.forEach((entry, index)=> console.log('entry #', index, entry))
      if (Number.isInteger(parseInt(entries[0]))) {
        insertQuestion(entries);
      } else {
        brokenQuestions.push(entries)
      }
      stream.resume();
    })
    .on('error', (err)=> {
      console.log('ERROR!', err);
    })
    .on('end', () => {
      console.log('Finished Reading!');
    })
  );
}
loadFileContents();

var lineToEntries = function(string) {
  var word = '';
  var entries = [];
  for (var k = 0; k < string.length; k++) {
    var char = string[k];
    if (char === ',') {
      entries.push(word);
      word = '';
    } else {
      word += char;
    }
  }
  entries.push(word.trim());
  return entries;
}

var insertQuestion = async function(rowEntries) {
  // entry # 0 id
  // entry # 1  product_id
  // entry # 2  body
  // entry # 3  date_written
  // entry # 4  asker_name
  // entry # 5  asker_email
  // entry # 6  reported
  // entry # 7  helpful

  //console.log(`should be numbers: [${rowEntries[1]},${rowEntries[0]},${rowEntries[7]}]`)

  var reportedVal = false;
  if (rowEntries[6]==='true' || rowEntries[6]==='1') {
    reportedVal = true;
  }
  const questionDoc = new Question({
    product_id: parseInt(rowEntries[1]),
    question_id: parseInt(rowEntries[0]),
    question_body:rowEntries[2],
    question_date: rowEntries[3],
    asker_name: rowEntries[4],
    asker_email: rowEntries[5],
    reported: reportedVal,
    question_helpfulness: parseInt(rowEntries[7])
  })
  try {
    const data = await questionDoc.save();
    console.log(data);
  } catch(err) {
    console.log('error!!!', err)
  }
}


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


console.log('EOF.')
app.listen(PORT, ()=>{console.log(`listening on ${PORT}`)});
