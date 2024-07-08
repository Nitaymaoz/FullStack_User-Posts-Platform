"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import "./design.css";

const NOTES_URL = "http://localhost:3001/notes";
const NOTES_PER_PAGE = 10;

interface Note {
  id: number;
  title: string;
  author: {
    name: string;
    email: string;
  };
  content: string;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newNote, setNewNote] = useState<Note>({
    id: 0,
    title: "",
    author: { name: "", email: "" },
    content: "",
  });
  const [refresh, setRefresh] = useState(0);
  const [noteId, setNoteId] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState<string>("");
  const [addingNewNote, setAddingNewNote] = useState(false);

  useEffect(() => {
    console.log("Fetching Notes for page:", activePage);
    axios
      .get(NOTES_URL, {
        params: {
          _page: activePage,
          _per_page: NOTES_PER_PAGE,
        },
      })
      .then((response) => {
        console.log(response.data);
        setNotes(Array.isArray(response.data) ? response.data : []);

        const totalCount = parseInt(response.headers["x-total-count"], 10);
        const highestNoteId = parseInt(response.headers["x-highest-id"], 10);
        setNewNote((prevNote) => ({
          ...prevNote,
          id: highestNoteId + 1,
        }));
        setTotalPages(Math.ceil(totalCount / NOTES_PER_PAGE));
      })
      .catch((error) => {
        console.log("Encountered an error:" + error);
      });
  }, [activePage, refresh]);

  function handlePageChange(newPage: number) {
    console.log("Changing to page:", newPage);
    setActivePage(newPage);
  }

  function clearTextfields() {
    (document.getElementById("new-note-Title") as HTMLInputElement).value = "";
    (
      document.getElementById("new-note-Author_Name") as HTMLInputElement
    ).value = "";
    (
      document.getElementById("new-note-Author_Email") as HTMLInputElement
    ).value = "";
    (document.getElementById("new-note-Content") as HTMLTextAreaElement).value =
      "";
  }

  function handleAddNewNoteClick() {
    setAddingNewNote(true);
  }

  function handleSaveNewNote() {
    const newNoteData = {
      id: newNote.id,
      content: (document.getElementById("new-note-Content") as HTMLInputElement)
        .value,
      title: (document.getElementById("new-note-Title") as HTMLInputElement)
        .value,
      author: {
        name: (
          document.getElementById("new-note-Author_Name") as HTMLInputElement
        ).value,
        email: (
          document.getElementById("new-note-Author_Email") as HTMLInputElement
        ).value,
      },
    };
    axios
      .post(NOTES_URL, newNoteData)
      .then((response) => {
        setRefresh(refresh + 1);
        setNewNote({
          id: 0,
          title: "",
          author: { name: "", email: "" },
          content: "",
        });
        clearTextfields();
        setAddingNewNote(false);
      })
      .catch((error) => console.log("Failed to add note:", error));
  }

  function handleCancelNewNote() {
    setAddingNewNote(false);
  }

  function handleButtons() {
    let pageButtons = [];
    if (totalPages <= 5) {
      for (let i = 0; i < totalPages; i++) pageButtons.push(i + 1);
    } else if (activePage < 3) {
      pageButtons = [1, 2, 3, 4, 5];
    } else if (totalPages - activePage < 2) {
      pageButtons = [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    } else {
      pageButtons = [
        activePage - 2,
        activePage - 1,
        activePage,
        activePage + 1,
        activePage + 2,
      ];
    }
    return pageButtons;
  }

  function onEditNote(note: Note) {
    setNoteId(note.id);
    setNoteContent(note.content);
  }

  function onSaveNote(noteId: number) {
    const editedNoteData = {
      id: noteId,
      content: noteContent,
    };
    axios
      .put(`${NOTES_URL}/${noteId}`, editedNoteData)
      .then((response) => {
        setRefresh(refresh + 1);
        setNoteId(null);
      })
      .catch((error) => console.log("Failed to edit note:", error));
  }

  function onCancel() {
    setNoteId(null);
    setNoteContent("");
  }

  function handleDeleteNote(id: number) {
    const isLastNote: boolean = notes.length == 1;
    axios
      .delete(`${NOTES_URL}/${id}`)
      .then((response) => {
        if (isLastNote && activePage > 1) {
          setActivePage(activePage - 1);
        } else {
          setRefresh(refresh + 1); // Refresh notes after deleting a note
        }
      })
      .catch((error) => console.log("Failed to delete note:", error));
  }

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-no-repeat bg-center"
      style={{
        backgroundImage: `url('my-space2.png')`,
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex-col min-h-screen p-3">
        {/* Header */}
        <div
          style={{
            margin: "10px 0",
            fontWeight: "bold",
            fontSize: "24px",
            color: "turquoise",
          }}
        >
          <div className="text-center">The New FaceBook</div>
        </div>

        {/* Button add new note */}
        <div className="input-area-container">
          {addingNewNote ? (
            <div>
              <input
                type="text"
                id="new-note-Title"
                placeholder="new-note-Title"
                style={{ color: "black" }}
              />
              <input
                type="text"
                id="new-note-Author_Name"
                placeholder="new-note-Author_Name"
                style={{ color: "black" }}
              />
              <input
                type="text"
                id="new-note-Author_Email"
                placeholder="new-note-Author_Email"
                style={{ color: "black" }}
              />
              <input
                type="text"
                id="new-note-Content"
                placeholder="new-note-Content"
                name="text_input_new_note"
                style={{ color: "black" }}
              />
              <button
                onClick={handleSaveNewNote}
                name="text_input_save_new_note"
                className="button5"
              >
                Save
              </button>
              <button
                onClick={handleCancelNewNote}
                name="text_input_cancel_new_note"
                className="button5"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="button-container">
              <button
                className="button1"
                name="add_new_note"
                onClick={handleAddNewNoteClick}
              >
                Add New Note
              </button>
            </div>
          )}
        </div>

        {/* Display the notes */}
        <div className="flex-1 w-full overflow-y-auto p-4">
          {notes.map((Note) => (
            <div key={Note.id} className="note" id={`${Note.id.toString()}`}>
              <div className="note-content">
                <h2>{Note.title}</h2>
                <small>
                  By: {Note.author.name} ({Note.author.email})
                </small>
                {noteId === Note.id ? (
                  <div>
                    <input
                      type="text"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      name={`text_input-${Note.id}`}
                      style={{ color: "black" }}
                    />
                    <button
                      onClick={() => onSaveNote(Note.id)}
                      name={`text_input_save-${Note.id}`}
                      className="button5"
                    >
                      Save
                    </button>
                    <button
                      onClick={onCancel}
                      name={`text_input_cancel-${Note.id}`}
                      className="button5"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p>{Note.content}</p>
                )}
              </div>
              <div className="button-container-Note">
                <button
                  className="button3"
                  name={`delete-${Note.id.toString()}`}
                  onClick={() => handleDeleteNote(Note.id)}
                >
                  Delete Note
                </button>
                <button
                  className="button2"
                  name={`edit-${Note.id.toString()}`}
                  onClick={() => onEditNote(Note)}
                >
                  Edit Note
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pages buttons */}
        <div className="w-full fixed bottom-0 left-0 flex justify-center p-2 space-x-3">
          <div className="button-container">
            <button
              className="button4"
              name="previous"
              onClick={() => handlePageChange(Math.max(activePage - 1, 1))}
            >
              Prev
            </button>
            <button
              className="button4"
              name="first"
              onClick={() => handlePageChange(1)}
            >
              First
            </button>
          </div>
          {handleButtons().map((page) => (
            <button
              className="button4"
              key={page}
              name={`page-${page}`}
              onClick={() => handlePageChange(page)}
              style={{ fontWeight: page === activePage ? "bold" : "normal" }}
            >
              {page}
            </button>
          ))}
          <div className="button-container">
            <button
              className="button4"
              name="next"
              onClick={() =>
                handlePageChange(Math.min(activePage + 1, totalPages))
              }
            >
              Next
            </button>
            <button
              className="button4"
              name="last"
              onClick={() => handlePageChange(totalPages)}
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
