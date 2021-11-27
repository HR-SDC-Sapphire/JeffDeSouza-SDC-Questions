const mongoose = require('mongoose')
const answersPhotosSchema = require('./answers_photos.js')

const answersSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    index: true
  },
  question_id: {
    type: Number,
    required: true,
    index: true
  }
  body: String,
  date: String,
  answerer_name: String,
  answerer_email: String,
  reported: Boolean,
  helpfulness: Number,
  last_updated: Number,
  photos: [ answersPhotosSchema ]
});

module.exports =  answersSchema;
//module.exports =  mongoose.model('Answers', answersSchema);
