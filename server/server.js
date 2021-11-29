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
const PORT = 3000;
var timeStart = Date.now();

var questionsConnection = mongoose.connect('mongodb://localhost:27017/SDC-indexed', (err, db)=> {
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

  var formatPhotos = function(photosArray) {
    var newPhotosArray = [];
    for (var k = 0; k < photosArray.length; k++) {
      var photo = photosArray[k];
      var newPhoto = {
        id: photo.id,
        url: photo.url,
      }
      newPhotosArray.push(newPhoto);
    }
    return newPhotosArray;
  }

  var attachPhotos = async function(answer_id) {
    return new Promise( async (resolve, reject) => {
      try{
        const photosResult = await AnswersPhoto.find({answer_id: answer_id});
        var photosArray = Array.from(photosResult);
        var newPhotos = formatPhotos(photosArray)
        resolve(newPhotos);
      } catch {
        reject('There was an error attaching a photo to an answer')
      }
    });
  }

  var formatAnswers = async function(answersArray, arrayFlag) {
    //replace me with a more sophisticated select
    if (arrayFlag) {
      results = [];
      for (var k = 0; k < answersArray.length; k++) {
        var answer = answersArray[k];
        var photosArray = await attachPhotos(answer.id)
        var newAnswer = {
          id: answer.id,
          body: answer.body,
          date: answer.date,
          answerer_name: answer.answerer_name,
          helpfulness: answer.helpfulness,
          photos: photosArray
        };
        results.push(newAnswer);
      }
      return results;
    } else {
      answersObject = {};
      for (var k = 0; k < answersArray.length; k++) {
        var answer = answersArray[k];
        var photosArray = await attachPhotos(answer.id)
        var newAnswer = {
          id: answer.id,
          body: answer.body,
          date: answer.date,
          answerer_name: answer.answerer_name,
          helpfulness: answer.helpfulness,
          photos: photosArray
        };
        answersObject[parseInt(answer.id)] = newAnswer;
      }
      return answersObject;
    }
  }

  var getAnswers = async function(question, page, count) {
    return new Promise( async (resolve, reject) => {
      try{
        var answersResult = [];
        if (page === undefined && count === undefined) {
          answersResult = await Answer.find({question_id: question.question_id, reported: 0});
          var answersArray = Array.from(answersResult);
          var answers = await formatAnswers(answersArray);
          resolve(answers);
        } else {
          var pageCount = page * count;
          answersResult = await Answer.find({question_id: question.question_id, reported: 0}).limit(pageCount);
          answersArray = Array.from(answersResult).slice(count * (page - 1))
          var answers = await formatAnswers(answersArray, true);
          var answersObj = {
            question: question.question_id,
            page: page,
            count: count,
            results: answers
          }
          resolve(answersObj);
        }
      } catch {
        reject('There was an error Finding() an answer')
      }
    });
  }

  var attachAnswers = function(questions) {
    return new Promise( async (resolve, reject) => {
      try{
        var newQuestions = [];
        for (var k = 0; k < questions.length; k++) {
          var question = questions[k];
          const answers = await getAnswers(question)
          question['answers'] = answers;
          newQuestions.push(question);
        }

        //HELP DESK: WHY DIDN'T THIS WORK?
        // questions.forEach( async (question) => {
        //   const answersResult = await Answer.find({question_id: question.question_id, reported: 0});
        //   var answersArray = Array.from(answersResult);
        //   question['answers'] = formatAnswers(answersArray)
        //   newQuestions.push(question);
        // })
        //IS IT BECAUSE HIGHER ORDERED FUNCTIONS DO NOT STOP - not even for async/await?

        resolve(newQuestions);
      } catch {
        reject('There was an error attaching an answer to the question')
      }
    });
  }

  //GET /qa/questions/
  app.get('/qa/questions', async (req, res) => {
    var pid = req.query.product_id;
    var page = req.query.page || 1; //ASSUMPTION: PAGE 0 == INVALID
    var count = req.query.count || 5;
    var pageCount = page * count;

    var prodQuery = {reported:0};
    if (pid !== undefined) {
      prodQuery = {product_id: pid, reported: 0};
    }
    try {
      const questions = await Question.find(prodQuery).limit(pageCount);
      var results = Array.from(questions);
      results =  results.slice(count * (page - 1))
      results = formatQuestions(results);
      var questionsWithAnswers = await attachAnswers(results)
      var questionObject = { product_id: pid, results: questionsWithAnswers }
      res.status(200).json(questionObject);
    } catch (err) {
      res.json({error_message: err})
    }
  });

  //GET /qa/questions/:question_id/answers
  app.get('/qa/questions/:question_id/answers', async (req, res) => {
    var question_id = req.params.question_id;
    var page = req.query.page || 1;
    var count = req.query.count || 5;

    //=ASSUMPTION=
    //Problem: Despite 0 being an allowed page number, the default is 1
    //Problem: Most answers don't have a second page
    //Solution: I'm treating page 0 and page 1 as the same page.
    if(page === 0) {
      page = 1;
    }

    const answers = await getAnswers({ question_id }, page, count)
    res.status(200).json(answers);
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