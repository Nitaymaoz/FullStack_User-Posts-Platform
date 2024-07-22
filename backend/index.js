const mngs = require('mongoose')
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const express = require('express');
const app = express();
const cors = require("cors");
const bcrypt = require('bcrypt');
const costFactor = 12;

const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET;

app.use(express.json());
app.use(cors({
  exposedHeaders: ['x-total-count','x-highest-id']
}));


const requestLogger = (request, response, next) => {
    const date = new Date();
    const msg = `Time: ${date}\nHTTP request method: ${request.method}\nRequest target path: ${request.path}\nRequest body: ${JSON.stringify(request.body)}\n\n`;
    fs.appendFile("../backend/log.txt", msg, (error) => {
        if(error){
            console.log('Failed to write to log.txt', error);
        }
        })
    next();
  }

app.use(requestLogger)

app.get("/notes", async (req, resp) => {
      resp.set('x-total-count', await Note.countDocuments()); // set the total count in the response header
      const highestNote = await Note.findOne().sort({ id: -1 }); // find the note with the highest id
      highestNoteId = highestNote.id;
      resp.set('x-highest-id',highestNoteId);
      const _per_page = parseInt(req.query._per_page, 10); 
      const _page = parseInt(req.query._page, 10);

      if (_page && _per_page) {
          const skipNumber = _per_page * (_page - 1) ;
          // id:1 = sort by id ascending
          await Note.find().sort({ id: 1 }).skip(skipNumber).limit(_per_page).then(notes=>{
            resp.status(200).json(notes);
          }
        ).catch (error=>{
          resp.status(500).json({ error: `Generic error response when fetching ${_per_page} posts per_Page ` });
        });
      } else {
          await Note.find().sort({ id: 1 }).then(notes=>{
            resp.status(200).json(notes);
          }
        ).catch (error=>{
          resp.status(500).json({ error: "Generic error response when fetching All notes" });
        });
      }
});



app.get("/notes/:skipNumber", async (req, resp) => {
  await Note.findOne().skip(req.params.skipNumber).sort({id:1}).then(note => {
      if (!note) {
        return resp.status(404).json({ error: `Unknown route/note number: ${req.params.skipNumber}` });// Node:id = skipNumber + 1
      }
        resp.status(200).json({note});
      })
      .catch(error => {
        resp.status(404).json({ error: `Unknown route/note number: ${req.params.skipNumber}`}); 
      });
});

app.put("/notes/:id", async (req, resp) => {
    const noteId = parseInt(req.params.id,10);
    await Note.findOne({id:noteId}).then(note => {
        note.content = req.body.content == null ? note.content : req.body.content;
        note.save()
        .then(savedNote => {
          resp.status(200).json({savedNote});
        })
        .catch(error => {
          resp.status(500).json({ error: `Generic error response, cannot save note: ${req.params.skipNumber}` });
        });
      })
      .catch(error => {
        resp.status(500).json({ error: `Generic error response, cannot update note: ${req.params.skipNumber}` });
      });
});

app.delete("/notes/:id", async (req, resp) => {
    const noteId = parseInt(req.params.id,10);
    await Note.findOneAndDelete({ id: noteId }).then(note => {
        if (!note) {
          return resp.status(404).json({ error: "Note not found" });
        }
          resp.status(204).json({ message: `Note ${noteId} successfully deleted` });
    })
    .catch(error => {
        resp.status(500).json({ error: `Generic error response, cannot delete note: ${noteId}` });
    });
});

const noteSchema = new mngs.Schema({
    id: { type: Number, required: true },
    title: { type: String, required: true },
    author: {
        name: { type: String, default: null },
        email: { type: String, default: null }
    },
    content: { type: String, required: true }
});

const userSchema = new mngs.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    username: { type: String, required: true },
    passwordHash: { type: String, required: true }
  }
);

async function conn(){
     if(!process.env.MONGODB_CONNECTION_URL){
         throw new Error("MONGODB_CONNECTION_URL is undefined");
     }
    try{
        const connection = await mngs.connect(process.env.MONGODB_CONNECTION_URL);
        console.log('Connected to Mongo');
    }
    catch(error){
        console.log('Unable to connect to Mongo: ', error);
    }
}

    const Note = mngs.model("Note", noteSchema);
    const User = mngs.model("User",userSchema);

    app.post('/notes', async (req, resp) => {
      const reqBody = req.body;
    
      //!reqBody.content || !reqBody.id || !reqBody.title || !reqBody.author.name || !reqBody.author.email - original if request
      if (!reqBody.content) {
        return resp.status(400).json({ error: 'Missing fields in the request' });
      }
      //testing if any other field is missing
      if(!reqBody.id){
        const highestNote = await Note.findOne().sort({ id: -1 }); // find the note with the highest id
        const highestNoteId = highestNote.id;
        reqBody.id=highestNoteId;
      }
      if(!reqBody.title) reqBody.title=" ";
      if(!reqBody.author.name) reqBody.author.name=" ";
      if(!reqBody.author.email) reqBody.author.email=" ";

      const note = new Note({
        id: reqBody.id,
        title: reqBody.title,
        author: {
          name: reqBody.author.name,
          email: reqBody.author.email,
        },
        content: reqBody.content,
      });
      
      note.save()
        .then(savedNote => {
          resp.status(201).json({savedNote});
        })
        .catch(error => {
        resp.status(500).json({ error: `Generic error response, cannot save note` });
        });
    });

    app.post('/users', async (req, resp) => {
      const _name = req.body.name;
      const _email = req.body.email;
      const _username = req.body.username;
      const _password = req.body.password;

    
      if (!_name || !_email || !_username || !_password) {
        return resp.status(400).json({ error: 'At least one of the required fields is missing' });
      }
    
      try {
        const passwordHash = await bcrypt.hash(_password, costFactor);
    
        const user = new User({
          name:_name,
          email:_email,
          username:_username,
          passwordHash:passwordHash
        });
    
        user.save()
          .then(savedUser => {
            resp.status(201).json(savedUser);
          })
          .catch(error => {
            resp.status(500).json({ error: 'Generic error response, create user' });
          });
      } catch (error) {
        resp.status(500).json({ error: 'Generic error response, create user' });
      }
    });

    app.post('/login', async (req, resp) => {
      const _username = req.body.username;
      const _password = req.body.password;
    
      if (!_username || !_password) {
        return resp.status(400).json({ error: 'Username or password is missing' });
      }
    
      try {
        const loginUser = await User.findOne({ _username });
        if (!loginUser) {
          return resp.status(401).json({ error: 'The username or password are incorrect' });
        }
    
        const passwordConfirmation = await bcrypt.compare(_password, loginUser.passwordHash);
        if (!passwordConfirmation) {
          return resp.status(401).json({ error: 'The username or password are incorrect' });
        }
    
        const token = jwt.sign({ username: loginUser.username, id: loginUser._id }, SECRET);
        resp.status(200).json({ token, name: loginUser.name, email: loginUser.email });
      } catch (error) {
        console.error('Error logging in:', error.message); // Log the error message
        console.error('Error details:', error); // Log the complete error details
        resp.status(500).json({ error: 'Generic error response, cannot login' });
      }
    });

app.listen(3001);

conn();