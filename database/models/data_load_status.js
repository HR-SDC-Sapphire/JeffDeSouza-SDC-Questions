const mongoose = require('mongoose')

const data_load_status_schema = new mongoose.Schema({
  collection: String,
  complete: Boolean
});

module.exports =  mongoose.model('data_load_status', data_load_status_schema);
