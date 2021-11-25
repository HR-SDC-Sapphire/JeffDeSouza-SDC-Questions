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
  console.log('connected to the db!0');

  var loadQuestionFileContents = function() {
    return new Promise((resolve, reject) => {
      setTimeout(()=> {
        console.log('questions file load');
        resolve('questions')
      }, 2000)
    })
  }

  var loadAnswersFileContents = function() {
    return new Promise((resolve, reject) => {
      setTimeout(()=> {
        console.log('answers file load');
        resolve('answers')
      }, 1000)
    })
  }

  var loadAnswersPhotoFileContents = async function() {
    return new Promise((resolve, reject) => {
      setTimeout(()=> {
        console.log('answersPhotos file load');
        resolve('answersPhotos')
      }, 500)
    })
  }

  var saveQuestionIntoDB = function() {
    return new Promise((resolve, reject) => {
      setTimeout(()=> {
        console.log('save questions entry');
        resolve('saveQuestion')
      }, 2000)
    })
  }

  var saveAnswerIntoDB = function() {
    return new Promise((resolve, reject) => {
      setTimeout(()=> {
        console.log('saveAnswerIntoDB');
        resolve('saveAnswerIntoDB')
      }, 1000)
    })
  }

  var saveAnswersPhotoIntoDB = function() {
    return new Promise((resolve, reject) => {
      setTimeout(()=> {
        console.log('saveAnswersPhotoIntoDB');
        resolve('saveAnswersPhotoIntoDB')
      }, 500)
    })
  }

  var run = async function() {
    try{
      console.log('SOF');
      await loadQuestionFileContents();
      await saveQuestionIntoDB();
      await loadAnswersFileContents();
      await saveAnswerIntoDB();
      await loadAnswersPhotoFileContents();
      await saveAnswersPhotoIntoDB();
      console.log('EOF.')
    }
    catch(err) {
      console.log("4ERROR RUNNING", err);
    }
  }
  run();



  app.listen(PORT, ()=>{console.log(`listening on ${PORT}`)});

})