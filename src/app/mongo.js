const mngs = require('mongoose')

//require("dotenv").config()

const express = require('express');
const app = express();
const cors = require("cors");
console.log("App listen at port 3002");
app.use(express.json());
app.use(cors());
app.get("/notes", (req, resp) => {
    Note.find().then(notes => {
        resp.json(notes);
      })
      .catch(error => {
        console.error('Failed to save note:', error.message);
        resp.status(500).json({ error: "Internal Server Error" });
      });
});

app.get("/notes/:skipNumber", (req, resp) => {
    Note.findOne().skip(req.params.skipNumber).then(note => {
        resp.json(note);
      })
      .catch(error => {
        console.error('Failed to save note:', error.message);
        resp.status(500).json({ error: "Internal Server Error" });
      });
});

app.put("/notes/:skipNumber", (req, resp) => {
    Note.findOne().skip(req.params.skipNumber).then(note => {
        note.title = req.body.title == null ? note.author.title : req.body.title;
        note.author.name = req.body.author.name == null ? note.author.name : req.body.author.name;
        note.author.email = req.body.email == null ? note.author.email : req.body.author.email;
        note.content = req.body.content == null ? note.content : req.body.content;
        note.save()
        .then(savedNote => {
          resp.json(savedNote);
        })
        .catch(error => {
          console.error('Failed to save note:', error.message);
          resp.status(500).json({ error: "Internal Server Error" });
        });
      })
      .catch(error => {
        console.error('Failed to save note:', error.message);
        resp.status(500).json({ error: "Internal Server Error" });
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

    app.post('/notes', (request, response) => {
      const reqBody = request.body;
    
      if (!reqBody.content) {
        return response.status(400).json({ error: 'content missing' });
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
          response.json(savedNote);
        })
        .catch(error => {
          console.error('Failed to save note:', error.message);
          response.status(500).json({ error: "Internal Server Error" });
        });
    });

app.listen(3002);

conn();