const express = require('express');
const bodyParser = require('body-parser')
const app = express();
app.use(bodyParser.json())
const mongoose = require('mongoose');
const Question = require('../database/models/questions.js')
const answersSchema = require('../database/models/answers.js')
const Answer = mongoose.model('answers', answersSchema);
var fs = require('fs')
var es = require('event-stream');
var path = require('path');
const PORT = 3000;


var questions = mongoose.connect('mongodb://localhost:27017/allQuestions', (err, db)=> {
  console.log('connected to the db!');


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
      var loc = path.join(__dirname, './data/testQuestions.csv')
      var brokenQuestions = [];
      var stream = fs.createReadStream(loc)
        .pipe(es.split())
        .pipe(es.mapSync( async (line)=> {
          stream.pause();
          var entries = lineToEntries(line);
          if (Number.isInteger(parseInt(entries[0]))) {
            await saveQuestionIntoDB(entries)
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

    // return new Promise((resolve, reject) => {
    //   setTimeout( async ()=> {
    //     console.log('questions file load');
    //     await saveQuestionIntoDB()
    //     resolve('questions')
    //   }, 1500)
    // })

  }

  var loadAnswersFileContents = function() {
    return new Promise((resolve, reject) => {
      console.log('start reading answers');
      var loc = path.join(__dirname, './data/testAnswers.csv')
      var brokenAnswers = [];
      var stream = fs.createReadStream(loc)
        .pipe(es.split())
        .pipe(es.mapSync(async (line)=> {
          stream.pause();
          var entries = lineToEntries(line);
          if (Number.isInteger(parseInt(entries[0]))) {
            await saveAnswerIntoDB(entries);
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
      var loc = path.join(__dirname, './data/testAnswers_photos.csv')
      var brokenAnswersPhotos = [];
      var stream = fs.createReadStream(loc)
        .pipe(es.split())
        .pipe(es.mapSync( async (line)=> {
          stream.pause();
          var entries = lineToEntries(line);
          if (Number.isInteger(parseInt(entries[0]))) {
            await saveAnswersPhotoIntoDB(entries);
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



    // return new Promise((resolve, reject) => {
    //   setTimeout( async ()=> {
    //     console.log('answersPhotos file load');
    //     await saveAnswersPhotoIntoDB();
    //     resolve('answersPhotos')
    //   }, 500)
    // })


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
        reported: reportedVal,
        question_helpfulness: parseInt(rowEntries[7]),
        answers: []
      })
      try {
        const data = await questionDoc.save();
        console.log('finished saving question');
        resolve(data);
        //console.log(data);
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
      var answer = {
        id: parseInt(rowEntries[0]),
        body: rowEntries[2],
        date: rowEntries[3],
        answerer_name: rowEntries[4],
        answerer_email: rowEntries[5],
        reported: reportedVal,
        helpfulness: parseInt(rowEntries[7]),
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
      })
      try {
        const data = await answerDoc.save();

        console.log('[answer-save] trying to find qid:', qid);
        const foundQuestions = await Question.find( {question_id: qid})
        //console.log('[answer-save] questions found: ', foundQuestions)
        for (var k = 0; k < foundQuestions.length; k++) {
          foundQuestions[k].answers.push(answer)
          await foundQuestions[k].save()
          console.log(`[answer-save] saved answer #${answer.id}}`, foundQuestions[k].question_id)
        }
        resolve(foundQuestions);
      } catch(err) {
        console.log('error Saving Answer!', err)
        reject(err);
      }
    });
  }

  var saveAnswersPhotoIntoDB = function(rowEntries) {

    return new Promise(async (resolve, reject) => {

      var aid = rowEntries[1];

      var answers_photo = {
        id: parseInt(rowEntries[0]),
        url: rowEntries[2]
      }
      try {
        //console.log('3.5trying to find aid:', aid);
        const foundAnswers = await Answer.find( {id: aid})
        //console.log('3.5answers found: ', foundAnswers)
        for (var k = 0; k < foundAnswers.length; k++) {
          foundAnswers[k].photos.push(answers_photo)
          await foundAnswers[k].save()
          //console.log('3.5saved answer for', foundAnswers[k])
          var qid = foundAnswers[k].question_id;
          //console.log('3.5SUBQUESTION ID: ', qid);
          if (qid) {
            const foundQuestions = await Question.find( {question_id: qid})
            //console.log('3.5sub-Question found', foundQuestions);
            for (var m = 0; m < foundQuestions.length; m++) {
              for (var n = 0; n < foundQuestions[m].answers.length; n++) {
                //console.log(`3.5comparing ${aid} to ${foundQuestions[m].answers[n].id}`)
                if (parseInt(foundQuestions[m].answers[n].id) === parseInt(aid)) {
                  //console.log('3.5ANSWER FOUND IN QUESTION!');
                  foundQuestions[m].answers[n].photos.push(answers_photo);
                  await foundQuestions[m].save();
                  console.log(`inserted answers_photo ${answers_photo.id}`)
                }
              }
            }
          } //end if qid
          resolve(answers_photo);
        }

      } catch(err) {
        console.log('error saving answers_photo', err)
        reject(err);
      }
    });

    // return new Promise((resolve, reject) => {
    //   setTimeout(()=> {
    //     console.log('saveAnswersPhotoIntoDB');
    //     resolve('saveAnswersPhotoIntoDB')
    //   }, 500)
    // })


  }

  var run = async function() {
    try{
      console.log('SOF');
      await loadQuestionFileContents();
      await loadAnswersFileContents();
      await loadAnswersPhotoFileContents();
      console.log('EOF.')
    }
    catch(err) {
      console.log("ERROR RUNNING", err);
    }
  }
  run();



  // app.listen(PORT, ()=>{console.log(`listening on ${PORT}`)});

})