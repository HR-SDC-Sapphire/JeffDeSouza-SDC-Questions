const mongoose = require('mongoose')

const AnswersSchema = mongoose.Schema({
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
  });

module.exports =  mongoose.model('Answers', AnswersSchema);