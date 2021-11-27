const mongoose = require('mongoose')

const answersPhotosSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  answer_id: Number,
  url: String,
  last_updated: Number
});

module.exports =  answersPhotosSchema;
//module.exports =  mongoose.model('AnswersPhotos', answersPhotosSchema);
