const express = require('express');
const router = express.Router();
const multer = require('multer');
const {google} = require('googleapis');
const mime = require('mime-types');
const stream = require('stream');

const apikey = require('../apikey.json');

const mimeTypes = {
    '.aac': 'audio/aac',
    '.abw': 'application/x-abiword',
    '.arc': 'application/x-freearc',
    '.avi': 'video/x-msvideo',
    '.azw': 'application/vnd.amazon.ebook',
  };

const SCOPE = ['https://www.googleapis.com/auth/drive'];

async function authorize() {
    const jwtClient = new google.auth.JWT(
      apikey.client_email,
      null,
      apikey.private_key,
      SCOPE
    );

    await jwtClient.authorize();
  
    return jwtClient;
};

async function uploadFile(authClient, name, mimeType, buffer){
    return new Promise((resolve,reject)=>{
        const drive = google.drive({version:'v3',auth:authClient});

        var fileMetadata = {
            name: `${Date.now()}-${name}`,
            parents: ['1ttAHoW8zNVigGrwIfpWqQ5ck4XQlw7y8']
        };

        var media = {
            mimeType: mimeType,
            body: bufferToStream(buffer)
        };

        drive.files.create({
            resource: fileMetadata,
            media:media,
            fields: 'id'
        }, function(err, file){
            if(err){
                console.error('Error uploading file:', err);
                reject(err);
            } else{
                resolve(file.data.id);
            }
        });
});
};

function bufferToStream(buffer){
    let tmp = new stream.PassThrough();
    tmp.end(buffer);
    return tmp;
    // const readable = new stream.Readable();
    // readable._read = () => {};
    // readable.push(buffer);
    // readable.push(null);
    // return readable;
};
  

const Clips = require('../models/Clips');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.get('/show', async (req,res)=>{
    const {code} = req.headers;
    const clips = await Clips.findOne({code});
    if(clips){
        if(clips.text){
            res.status(200).json({text:clips.text});
        } else{
            const ext = clips.file.filename.split('.').pop();
      const contentType = mimeTypes[`.${ext}`] || 'application/octet-stream';
      res.setHeader('Content-Disposition', `attachment; filename="${clips.file.filename}"`);
      res.setHeader('Content-Type', contentType);
      res.send(clips.file.data);
        }
        // res.status(200).json({text:clips.text});
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

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
  
      let code = Math.floor(1000 + Math.random() * 9000).toString();
      let existingClip = await Clips.findOne({ code });
  
      while (existingClip) {
        code = Math.floor(1000 + Math.random() * 9000).toString();
        existingClip = await Clips.findOne({ code });
      };

      const mimeType = mime.lookup(req.file.originalname);
      
      const auth = await authorize();
      const fileId = await uploadFile(auth, req.file.originalname, mimeType, req.file.buffer);
  
      const newClip = new Clips({
        file: fileId,
        code: code,
      });
  
      await newClip.save();
  
      res.status(200).json({ message: 'Saved', code: code });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Error uploading file' });
    }
  });

module.exports = router;