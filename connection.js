const mongoose = require('mongoose');

const url = `mongodb+srv://raushan:raushan2504@cluster0.hwvaxa9.mongodb.net/clipboard?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(url).then(()=>{console.log('Connected to database')}).catch((err)=>{console.log('Error in connecting to database',err)});