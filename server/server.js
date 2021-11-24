const express = require('express');
const bodyParser = require('body-parser')
const app = express();
app.use(bodyParser.json())
const mongoose = require('mongoose');
const Test = require('../database/models/test.js')
const Question = require('../database/models/questions.js')
const Answer = require('../database/models/answers.js')

var fs = require('fs')
var es = require('event-stream');
var path = require('path');
const PORT = 3000;

console.log('SOF.')
//csvfast??



var questions = mongoose.connect('mongodb://localhost:27017/allQuestions', (err, db)=> {
  console.log('connected to the db!');

  app.get('/', async (req, res) => {
    try {
      const posts = await Test.find();
      res.json(posts);
    } catch (err) {
      res.json({message: err})
    }
  });

  var loadQuestionFileContents = function() {
    var loc = path.join(__dirname, './data/testQuestions.csv')
    var brokenQuestions = [];
    var stream = fs.createReadStream(loc)
      .pipe(es.split())
      .pipe(es.mapSync((line)=> {
        stream.pause();
        var entries = lineToEntries(line);
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
        console.log('Finished Reading Questions!');
        console.log('Broken Questions were:', brokenQuestions)
      })
    );
  }



  var loadAnswersFileContents = function() {
    var loc = path.join(__dirname, './data/testAnswers.csv')
    var brokenAnswers = [];
    var stream = fs.createReadStream(loc)
      .pipe(es.split())
      .pipe(es.mapSync((line)=> {
        stream.pause();
        var entries = lineToEntries(line);
        if (Number.isInteger(parseInt(entries[0]))) {
          insertAnswer(entries);
        } else {
          brokenAnswers.push(entries)
        }
        stream.resume();
      })
      .on('error', (err)=> {
        console.log('ERROR!', err);
      })
      .on('end', () => {
        console.log('Finished Reading Answers!');
        console.log('Broken Answers were:', brokenAnswers)
      })
    );
  }






  var lineToEntries = function(string) {
    var word = '';
    var entries = [];
    for (var k = 0; k < string.length; k++) {
      var char = string[k];
      if (char === ',') {
        entries.push(word);
        word = '';
      } else if (char === '"') {
        //quote mode
        var startIndex = k;
        var startWord = word;
        var closed = false;
        k++;
        while (k < string.length && closed === false) {
          char = string[k];
          if (string[k] === '"') {
            entries.push(word);
            word = '';
            closed = true;
          } else {
            word += char;
          }
          k++;
        }
        if (closed === false) {
          k = startIndex+1;
          word = startWord+'"';
        }
      }
      else {
        word += char;
      }
    }
    entries.push(word.trim());
    return entries;
  }

  var insertAnswer = async function(rowEntries){
    //rowEntries.forEach((entry, index)=>console.log(`answers entry #${index}: ${entry}`));
    var qid = rowEntries[1];
    var reportedVal = false;
    if (rowEntries[6]==='true' || rowEntries[6]==='1') {
      reportedVal = true;
    }
    var answer = {
      id: parseInt(rowEntries[0]),
      body: rowEntries[2],
      date: rowEntries[3],
      answerer_name: rowEntries[4],
      answerer_email: rowEntries[5],
      reported: reportedVal,
      helpfulness: parseInt(rowEntries[7]),
    }
    //console.log('answer is: ', answer);
    // entry #0: 1
    // entry #1: 36
    // entry #2: "Supposedly suede
    // entry #2:  but I think its synthetic"
    // entry #3: "2018-01-17"
    // entry #4: "sillyguy"
    // entry #5: "first.last@gmail.com"
    // entry #6: 0
    // entry #7: 1
    try {
      // const data = await questionDoc.save();
      // const data = await questions.findOne({question_id: qid})
      //   .exec(function(err,question) {
      //     question.answers.push( answer );
      //     question.save();
      //   });
      // console.log('answers data', data);

        //console.log('adding ', answer, 'to qid', qid);

        // db.collection('allQuestions').updateOne(
        //   { question_id : qid },
        //   {
        //     $set: { 'answers': answer }
        //   }
        // );
        console.log('trying to find qid:', qid);
        const foundQuestions = await Question.find( {question_id: qid})
        console.log('questions found: ', foundQuestions)
        for (var k = 0; k < foundQuestions.length; k++) {
          foundQuestions[k].answers.push(answer)
          foundQuestions[k].save()
          console.log('saved answer for', foundQuestions[k])
        }

        // foundQuestions.forEach(async (foundQuestion)=> {
        //   foundQuestion.answers.push(answer)
        //   foundQuestion.save(done)
        //   console.log('saved answer for', foundQuestion)
        //   // Question.update(
        //   //   { question_id: qid },
        //   //   { $push: { answers: answer } },
        //   //   done
        //   // );
        // })
        //console.log('found question! here it is:', foundQuestions);
        //foundQuestions.answers.push(answer)




    } catch(err) {
      console.log('error!!!', err)
    }


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
      question_helpfulness: parseInt(rowEntries[7]),
      answers: []
    })
    try {
      const data = await questionDoc.save();
      //console.log(data);
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

  var run = async function() {
    try{
      await loadQuestionFileContents();
      await loadAnswersFileContents();
    }
    catch(err) {
      console.log("ERROR RUNNING", err);
    }
  }
  run();


  console.log('EOF.')
  app.listen(PORT, ()=>{console.log(`listening on ${PORT}`)});

})