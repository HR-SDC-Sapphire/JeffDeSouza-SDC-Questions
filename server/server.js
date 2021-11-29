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
var timeStart = Date.now();

var questions = mongoose.connect('mongodb://localhost:27017/SDC-indexed', (err, db)=> {
  console.log('connected to the db (SDC)!');

  var formatQuestions = function(questionsArray) {
    //replace me with a more sophisticated select
    returnArray = [];
    questionsArray.forEach((question) => {
      var newQuestion = {
        question_id: question.question_id,
        question_body: question.question_body,
        question_date: question.question_date,
        asker_name: question.asker_name,
        question_helpfulness: question.question_helpfulness,
        reported: question.reported,
        answers: question.answers
      };
      returnArray.push(newQuestion)
    })
    return returnArray;
  }

  var formatAnswers = function(answersArray) {
    //replace me with a more sophisticated select
    returnObject = {};
    answersArray.forEach((answer) => {
      var newAnswer = {
        id: answer.id,
        body: answer.body,
        date: answer.date,
        answerer_name: answer.answerer_name,
        helpfulness: answer.helpfulness,
        photos: answer.photos
      };
      returnObject[parseInt(answer.id)] = newAnswer;
    })
    return returnObject;
  }

  var attachAnswers = function(questions) {
    return new Promise( async (resolve, reject) => {
      try{
        var newQuestions = [];
        for (var k = 0; k < questions.length; k++) {
          var question = questions[k];
          const answersResult = await Answer.find({question_id: question.question_id, reported: 0});
          var answersArray = Array.from(answersResult);
          question['answers'] = formatAnswers(answersArray)
          newQuestions.push(question);
        }

        //HELP DESK: WHY DIDN'T THIS WORK?
        // questions.forEach( async (question) => {
        //   const answersResult = await Answer.find({question_id: question.question_id, reported: 0});
        //   var answersArray = Array.from(answersResult);
        //   question['answers'] = formatAnswers(answersArray)
        //   newQuestions.push(question);
        // })
        resolve(newQuestions);
      } catch {
        reject('There was an error attaching an answer to the question')
      }

    });
  }

  //GET QUESTIONS
  //GET /qa/questions/
  app.get('/qa/questions', async (req, res) => {
    var pid = req.query.product_id;
    var page = req.query.page || 1;
    var count = req.query.count || 5;
    var prodQuery = {reported:0};
    if (pid !== undefined) {
      prodQuery = {product_id: pid, reported: 0};
    }
    var pageCount = page * count;
    //console.log(`product_id ${pid}, page ${page}, count ${count}`)



    try {
      //console.log(`query is`, prodQuery)
      const posts = await Question.find(prodQuery).limit(pageCount);
      var results = Array.from(posts);
      results =  results.slice(count*(page-1))
      results = formatQuestions(results);
      var newQuestions = attachAnswers(results)
      .then((questions)=>{
        console.log('seriously the questions', questions);
        var returnVal = { product_id: pid, results: questions }
        return res.status(200).json(returnVal);
      })
      .then((val)=>{
        console.log('newQuestions', newQuestions);
        //console.log('also the val', val);
      })
      .catch((err)=>{
        console.log('there was an error', err);
      })

      // var newQuestions = [];
      // results.map( async (question) => {
      //   const answersResult = await Answer.find({question_id: question.question_id, reported: 0});
      //   var answersArray = Array.from(answersResult);
      //   question['answers'] = formatAnswers(answersArray)
      //   console.log(`Answers for QID${question.question_id} are`, question.answers);
      //   newQuestions.push(question);
      //   return question;
      // })
      //results = newQuestions;



      // var returnVal = { product_id: pid, results: newQuestions }
      // // console.log('type of result is', typeof(posts))
      // // console.log('body is ', posts)
      // // console.log('shown is', returnVal)
      // res.status(200).json(returnVal);
    } catch (err) {
      res.json({error_message: err})
    }
  });

  //GET ANSWERS FOR QID
  //GET /qa/questions/:question_id/answers
  app.get('/qa/questions/:question_id/answers', async (req, res) => {
    var question_id = req.params.question_id;
    var page = req.query.page || 1;
    var count = req.query.count || 5;

    // console.log('question_id is ', req.params.question_id);
  });

  //ADD A QUESTION
  //POST /qa/questions
  app.post('/qa/questions', async (req, res) => {

  });

  //ADD AN ANSWER
  //POST /qa/questions/:question_id/answers
  app.post('/qa/questions/:question_id/answers', async (req, res) => {
    var question_id = req.params.question_id;

  });

  //MARK QUESTION AS HELPFUL
  //PUT /qa/questions/:question_id/helpful
  app.put('/qa/questions/:question_id/helpful', async (req, res) => {
    var question_id = req.params.question_id;

  });

  //REPORT QUESTION
  //PUT /qa/questions/:question_id/report
  app.put('/qa/questions/:question_id/report', async (req, res) => {
    var question_id = req.params.question_id;

  });

  //MARK ANSWER AS HELPFUL
  //PUT /qa/answers/:answer_id/helpful
  app.put('/qa/answers/:answer_id/helpful', async (req, res) => {
    var answer_id = req.params.answer_id;
  });

  //REPORT ANSWER
  //PUT /qa/answers/:answer_id/report
  app.put('/qa/answers/:answer_id/report', async (req, res) => {
    var answer_id = req.params.answer_id;

  });



  app.listen(PORT, ()=>{console.log(`listening on ${PORT} at ${new Date().toLocaleTimeString()}`)});
})