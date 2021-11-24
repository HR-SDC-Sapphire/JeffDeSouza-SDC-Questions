const mongoose = require('mongoose')

const QuestionsSchema = mongoose.Schema({
  product_id: {
    type: Number,
    required: true
  },
  question_id: {
    type: Number,
    required: true
  },
  question_body: String,
  question_date: String,
  asker_name: String,
  asker_email: {
    type: String,
    lowercase: true
  }
  question_helpfulness: Number,
  reported: Boolean,
  answers: [{
    id: {
      type: Number,
      required: true
    },
    body: String,
    date: String,
    answerer_name: String,
    answerer_email: String,
    reported: Boolean,
    helpfulness: Number,
    photos: [{
      id: {
        type: Number,
        required: true
      },
      url: String
    }]
  }]
});

module.exports =  mongoose.model('Questions', QuestionsSchema);