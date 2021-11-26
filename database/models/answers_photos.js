const mongoose = require('mongoose')

const answersPhotosSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  answer_id: Number,
  url: String
});

module.exports =  mongoose.model('AnswersPhotos', answersPhotosSchema);
//module.exports =  answersPhotosSchema;