const mongoose = require('mongoose')

const answersPhotosSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    index: true
  },
  answer_id: {
    type: Number,
    required: true,
    index: true
  },
  url: String,
  last_updated: Number
});

module.exports =  answersPhotosSchema;
//module.exports =  mongoose.model('AnswersPhotos', answersPhotosSchema);
