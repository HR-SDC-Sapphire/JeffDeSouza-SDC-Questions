const mongoose = require('mongoose')

const answersSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  question_id: Number,
  body: String,
  date: String,
  answerer_name: String,
  answerer_email: String,
  reported: Boolean,
  helpfulness: Number
  // photos: [{
  //   id: {
  //     type: Number,
  //     required: true
  //   },
  //   url: String
  // }]
});

module.exports =  mongoose.model('Answers', answersSchema);
//module.exports =  answersSchema;