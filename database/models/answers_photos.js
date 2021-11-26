const mongoose = require('mongoose')

const answersPhotosSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  aid: Number,
  url: String
});

module.exports =  mongoose.model('AnswersPhotos', answersPhotosSchema);
//module.exports =  answersPhotosSchema;