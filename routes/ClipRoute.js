const express = require('express');
const router = express.Router();

const Clips = require('../models/Clips');

router.get('/show', async (req,res)=>{
    const {code} = req.headers;
    const clips = await Clips.findOne({code});
    if(clips){
        res.status(200).json({text:clips.text});
    } else{
        res.status(200).json({text:'NOT FOUND'});
    };
});

router.post('/save', async (req,res)=>{
    const {text} = req.body;
    let code = Math.floor(1000 + Math.random() * 9000).toString();

    let clips = await Clips.findOne({code});

    while(clips){
        code = Math.floor(1000 + Math.random() * 9000).toString();
        clips = await Clips.findOne({code});
    };

    const newClip = new Clips({text, code});
    await newClip.save();

    res.status(200).json({message:'Saved', code:code});
    
});

module.exports = router;