const mngs = require('mongoose')
const fs = require('fs');
const path = require('path');

//require("dotenv").config()
const express = require('express');
const app = express();
const cors = require("cors");
console.log("App listen at port 3002");
app.use(express.json());
app.use(cors());

const requestLogger = (request, response, next) => {
    const date = new Date();
    const msg = `Time: ${date}\nHTTP request method: ${request.method}\nRequest target path: ${request.path}\nRequest body: ${JSON.stringify(request.body)}\n\n`;
    fs.appendFile("src\\app\\log.txt", msg, (error) => {
        if(error){
            console.log('Failed to write to log.txt', error);
        }
        })
    next();
  }

app.use(requestLogger)

app.get("/notes", (req, resp) => {
    Note.find().then(notes => {
       // resp.status(200).json({ error: `Notes successfully found` });
       resp.status(200).json({notes});
      })
      .catch(error => {
      //  console.error('Failed to get notes:', error.message);
        resp.status(500).json({ error: "Generic error response" });
      });
});

app.get("/notes/:skipNumber", (req, resp) => {
    Note.findOne().skip(req.params.skipNumber).then(note => {
        resp.status(200).json({note});
       // resp.status(200).json({ error:  });
      })
      .catch(error => {
     //   console.error('Failed to get note:', error.message);
        resp.status(404).json({ error: `Unknown route/note number: ${req.params.skipNumber}`}); // Node:id = skipNumber + 1
      });
});

app.put("/notes/:skipNumber", (req, resp) => {
    Note.findOne().skip(req.params.skipNumber).then(note => {
        note.id = req.body.id == null ? note.author.id : req.body.id;
        note.title = req.body.title == null ? note.author.title : req.body.title;
        note.author.name = req.body.author.name == null ? note.author.name : req.body.author.name;
        note.author.email = req.body.email == null ? note.author.email : req.body.author.email;
        note.content = req.body.content == null ? note.content : req.body.content;
        note.save()
        .then(savedNote => {
          resp.json(savedNote);
          resp.status(201).json({ message : `Note ${req.params.skipNumber} successfully saved`});
        })
        .catch(error => {
     //     console.error('Failed to update note:', error.message);
          resp.status(500).json({ error: `Generic error response, cannot save note: ${req.params.skipNumber}` });
        });
      })
      .catch(error => {
     //   console.error('Failed to update note:', error.message);
        resp.status(500).json({ error: `Generic error response, cannot update note: ${req.params.skipNumber}` });
      });
});

app.delete("/notes/:skipNumber", (req, resp) => {
    Note.findOne().skip(req.params.skipNumber).then(note => {
        if (!note) {
            return resp.status(404).json({ error: "Note not found" });
        }

        Note.findByIdAndDelete(note._id)
            .then(() => {
                resp.status(200).json({ message: `Note ${req.params.skipNumber} successfully deleted` });
            })
            .catch(error => {
                //console.error('Failed to delete note:', error.message);
                resp.status(500).json({ error: `Generic error response, cannot delete note: ${req.params.skipNumber}` });
            });
    })
    .catch(error => {
        //console.error('Failed to find note:', error.message);
        resp.status(404).json({ error: `Unknown route/note number: ${req.params.skipNumber}` });
    });
});

const MONGODB_CONNECTION_URL = 'mongodb+srv://kaze:Q0JnadLr1ix5jpo1@cluster0.iuj4hib.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

const noteSchema = new mngs.Schema({
    id: { type: Number, required: true },
    title: { type: String, required: true },
    author: {
        name: { type: String, default: null },
        email: { type: String, default: null }
    },
    content: { type: String, required: true }
});

async function conn(){
    if(!MONGODB_CONNECTION_URL){
        throw new Error("MONGODB_CONNECTION_URL is undefined");
    }
    try{
        const connection = await mngs.connect(MONGODB_CONNECTION_URL);
        console.log('Connected to Mongo');
    }
    catch(error){
        console.log('Unable to connect to Mongo: ', error);
    }
}

    const Note = mngs.model("Note", noteSchema);

    app.post('/notes', (req, resp) => {
      const reqBody = req.body;
    
      if (!reqBody.content || !reqBody.id || !reqBody.title || !reqBody.author.name || !reqBody.author.email) {
        return resp.status(400).json({ error: 'Missing fields in the request' });
      }
    
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
          resp.json(savedNote);
          resp.status(201).json({ message: `Note ${req.params.skipNumber} successfully saved`});
        })
        .catch(error => {
        //  console.error('Failed to save note:', error.message);
        resp.status(500).json({ error: `Generic error response, cannot save note` });
        });
    });

app.listen(3002);

conn();