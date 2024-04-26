const mongoose = require('mongoose');

const clipSchema = new mongoose.Schema({
    text:{
        type:String,
    },
    code:{
        type:String,
    }
});

const clips = mongoose.model('clips',clipSchema);
module.exports = clips;