const express = require('express');
const bodyParser = require('body-parser')
const app = express();
app.use(bodyParser.json())
const mongoose = require('mongoose');
const questionsSchema = require('../database/models/questions.js')
const Question = mongoose.model('questions', questionsSchema);
const answersSchema = require('../database/models/answers.js')
const Answer = mongoose.model('answers', answersSchema);
const answersPhotosSchema = require('../database/models/answers_photos.js')
const AnswersPhoto = mongoose.model('answers_photos', answersPhotosSchema);
var fs = require('fs')
var es = require('event-stream');
var path = require('path');
const PORT = 3000;
var questionCount = 0;
var answerCount = 0;
var answerPhotoCount = 0;
var timeStart = Date.now();

var questions = mongoose.connect('mongodb://localhost:27017/SDC', (err, db)=> {
  console.log('connected to the db (SDC)!');

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

  var loadQuestionFileContents = function() {
    return new Promise((resolve, reject) => {
      console.log('start loading questions');
      var loc = path.join(__dirname, './data/questions.csv')
      // var loc = path.join(__dirname, './data/testQuestions.csv')
      var brokenQuestions = [];
      var stream = fs.createReadStream(loc)
        .pipe(es.split())
        .pipe(es.mapSync( async (line)=> {
          stream.pause();
          var entries = lineToEntries(line);
          if (Number.isInteger(parseInt(entries[0]))) {
            await saveQuestionIntoDB(entries)
            questionCount++;
          } else {
            brokenQuestions.push(entries)
          }
          stream.resume();
        })
        .on('error', (err)=> {
          console.log('question load ERROR!', err);
          reject(err);
        })
        .on('end', () => {
          console.log('Finished Reading Questions!');
          console.log('Broken Questions were:', brokenQuestions)
          resolve(brokenQuestions);
        })
      );
    });
  }

  var loadAnswersFileContents = function() {
    return new Promise((resolve, reject) => {
      console.log('start reading answers');
      var loc = path.join(__dirname, './data/answers.csv')
      // var loc = path.join(__dirname, './data/testAnswers.csv')
      var brokenAnswers = [];
      var stream = fs.createReadStream(loc)
        .pipe(es.split())
        .pipe(es.mapSync(async (line)=> {
          stream.pause();
          var entries = lineToEntries(line);
          if (Number.isInteger(parseInt(entries[0]))) {
            await saveAnswerIntoDB(entries);
            answerCount++;
          } else {
            brokenAnswers.push(entries)
          }
          stream.resume();
        })
        .on('error', (err)=> {
          console.log('ERROR loading answer!', err);
          reject(err);
        })
        .on('end', () => {
          console.log('Finished Reading Answers!');
          console.log('Broken Answers were:', brokenAnswers)
          resolve(brokenAnswers);
        })
      );
    });
  }

  var loadAnswersPhotoFileContents = function() {
    console.log('begin reading in answers photos')
    return new Promise( (resolve, reject) => {
      var loc = path.join(__dirname, './data/answers_photos.csv')
      // var loc = path.join(__dirname, './data/testAnswers_photos.csv')
      var brokenAnswersPhotos = [];
      var stream = fs.createReadStream(loc)
        .pipe(es.split())
        .pipe(es.mapSync( async (line)=> {
          stream.pause();
          var entries = lineToEntries(line);
          if (Number.isInteger(parseInt(entries[0]))) {
            await saveAnswersPhotoIntoDB(entries);
            answerPhotoCount++;
          } else {
            brokenAnswersPhotos.push(entries)
          }
          stream.resume();
        })
        .on('error', (err)=> {
          console.log('ERROR loading in answers_photos!', err);
          reject(err);
        })
        .on('end', () => {
          console.log('Finished Reading Answers_photos!');
          console.log('Broken Answers_photos were:', brokenAnswersPhotos)
          resolve(brokenAnswersPhotos)
        })
      );
    });
  }

  var saveQuestionIntoDB = function(rowEntries) {
    return new Promise(async (resolve, reject) => {
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
        question_helpfulness: parseInt(rowEntries[7]),
        reported: reportedVal,
        last_updated: timeStart
      })
      try {
        const data = await questionDoc.save();
        if (parseInt(rowEntries[0])%1000 === 0) {
          console.log('finished saving question ', rowEntries[0]);
        }
        resolve(data);
      } catch(err) {
        console.log('error saving question!!!', err)
        reject(err);
      }
    });
  }

  var saveAnswerIntoDB = function(rowEntries) {
    return new Promise(async (resolve, reject) => {
      var qid = rowEntries[1];
      var reportedVal = false;
      if (rowEntries[6]==='true' || rowEntries[6]==='1') {
        reportedVal = true;
      }
      const answerDoc = new Answer({
        id: parseInt(rowEntries[0]),
        question_id: qid,
        body: rowEntries[2],
        date: rowEntries[3],
        answerer_name: rowEntries[4],
        answerer_email: rowEntries[5],
        reported: reportedVal,
        helpfulness: parseInt(rowEntries[7]),
        last_updated: timeStart
      })
      try {
        const data = await answerDoc.save();
        if (parseInt(rowEntries[0])%1000 === 0) {
          console.log('finished saving answer ', rowEntries[0]);
        }
        resolve(data);
      } catch(err) {
        console.log('error Saving Answer!', err)
        reject(err);
      }
    });
  }

  var saveAnswersPhotoIntoDB = function(rowEntries) {
    return new Promise(async (resolve, reject) => {
      var aid = rowEntries[1];
      const answersPhotoDoc = new AnswersPhoto({
        id: parseInt(rowEntries[0]),
        answer_id: aid,
        url: rowEntries[2]
      })
      try {
        const data = await answersPhotoDoc.save();
        if (parseInt(rowEntries[0])%1000 === 0) {
          console.log('finished saving answers_photo ', rowEntries[0]);
        }
        resolve(data);
      }
      catch(err) {
        console.log('error saving answers_photo', err)
        reject(err);
      }
    });
  }

  var dataLoad = true;
  var run = async function() {
    try{
      console.log('SOF');
      if(dataLoad) {
        //var timeStart = Math.floor(Date.now())
        await loadQuestionFileContents();
        await loadAnswersFileContents();
        await loadAnswersPhotoFileContents();
        var timeEnd = Math.floor(Date.now());
        console.log('The Loading Process took ', timeEnd-timeStart, 'milliseconds to complete.')
        console.log('QuestionsCount: ', questionCount)
        console.log('AnswersCount: ', answerCount)
        console.log('AnswersPhotoCount: ', answerPhotoCount)
        console.log((timeEnd-timeStart)/60000, ' minutes, in total')
      }
      console.log('EOF.')
    }
    catch(err) {
      console.log("ERROR RUNNING", err);
    }
  }
  run();

  // app.listen(PORT, ()=>{console.log(`listening on ${PORT}`)});

})