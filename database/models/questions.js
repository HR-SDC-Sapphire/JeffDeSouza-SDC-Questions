const mongoose = require('mongoose')
const answersSchema = require('./answers.js')

const questionsSchema = mongoose.Schema({
  product_id: {
    type: Number,
    required: true,
    index: true
  },
  question_id: {
    type: Number,
    required: true,
    index: true
  },
  question_body: String,
  question_date: String,
  asker_name: String,
  asker_email: {
    type: String,
    lowercase: true
  },
  question_helpfulness: Number,
  reported: Boolean,
  last_updated: Number,
  answers: [ answersSchema ]
});

module.exports =  questionsSchema;
//module.exports =  mongoose.model('Questions', questionsSchema);