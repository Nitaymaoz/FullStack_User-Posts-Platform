"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import '../app/design.css';


const NOTES_URL = "http://localhost:3001/notes";
const USERS_URL = "http://localhost:3001/users";
const LOGIN_URL = "http://localhost:3001/login";
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

export async function getStaticProps() {
  try{
  const response = await axios.get(NOTES_URL, {
    params: {
      _page: 1,
      _per_page: NOTES_PER_PAGE,
    },
  });

  const initialNotes = response.data;
  const totalCount = parseInt(response.headers["x-total-count"], 10);
  const initialTotalPages = Math.ceil(totalCount / NOTES_PER_PAGE);
  const initialHighestNoteId = parseInt(response.headers["x-highest-id"], 10);

  return {
    props: {
      initialNotes,
      initialTotalPages,
      initialHighestNoteId,
    },
  };
  } catch(err){
    console.log("getStaticProps error", err);
  }
}

interface HomeProps {
  initialNotes: Note[];
  initialTotalPages: number;
  initialHighestNoteId: number;
}

export default function Home({ initialNotes, initialTotalPages, initialHighestNoteId }: HomeProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activePage, setActivePage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [highestNodeId,setHighestNodeId] = useState(1);
  if(highestNodeId<initialHighestNoteId) setHighestNodeId(initialHighestNoteId);

  const [newNote, setNewNote] = useState<Note>({
    id: initialHighestNoteId +1,
    title: "",
    author: { name: "", email: "" },
    content: "",
  });
  const [refresh, setRefresh] = useState(0);
  const [noteId, setNoteId] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState<string>("");
  const [addingNewNote, setAddingNewNote] = useState(false);
  const [token, setToken] = useState(null);
  const [currUserName,setCurrUserName] = useState("");
  const [currUserEmail,setcurrUserEmail] = useState("");
  const [cache, setCache] = useState<{ [key: number]: Note[] }>({1:initialNotes});


  useEffect(() => {
    let isMounted = true;
    const fetchPages = async (pages: number[]) => {
      const fetchPromises = pages.map((page) =>
        axios.get(NOTES_URL, {
          params: {
            _page: page,
            _per_page: NOTES_PER_PAGE,
          },
        })
      );
      const results = await Promise.all(fetchPromises);
      if(isMounted){
      const newCache = results.reduce((acc, res, idx) => {
        acc[pages[idx]] = res.data;
        return acc;
      }, {});
  
      setCache((prevCache) => {
        // Merge new cache with previous cache
        const updatedCache = { ...prevCache, ...newCache };
  
        // Calculate pages to keep
        const pagesToKeep: number[] = [];
        if (totalPages <= 5) {
          for (let i = 1; i <= totalPages; i++) pagesToKeep.push(i);
        } else if (activePage < 3) {
          pagesToKeep.push(1, 2, 3, 4, 5);
        } else if (totalPages - activePage < 2) {
          pagesToKeep.push(
            totalPages - 4,
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages
          );
        } else {
          pagesToKeep.push(
            activePage - 2,
            activePage - 1,
            activePage,
            activePage + 1,
            activePage + 2
          );
        }
  
        // Remove pages not in the range to keep
        Object.keys(updatedCache).forEach((page) => {
          if (!pagesToKeep.includes(Number(page))) {
            delete updatedCache[Number(page)];
          }
        });
  
        return updatedCache;
      });
    }
    };
    
    //Fetch current page
    const fetchCurrentPage = async () =>{
    console.log("Fetching Notes for page:", activePage);
    try { 
      const response =await axios.get(NOTES_URL, {
        params: {
          _page: activePage,
          _per_page: NOTES_PER_PAGE,
        }, 
      })
      if(isMounted){
        const highestNoteId = parseInt(response.headers["x-highest-id"], 10);
        console.log(response.data);
        setNotes(Array.isArray(response.data) ? response.data : []);

        const totalCount = parseInt(response.headers["x-total-count"], 10);
        
        setNewNote((prevNote) => ({
          ...prevNote,
          id: highestNodeId + 1,
        }));
        setTotalPages(Math.ceil(totalCount / NOTES_PER_PAGE));
      }
      }
      catch(error){
        if(isMounted) console.log("Encountered an error:" + error);
      }
  };
  
  if (cache[activePage]) {
    console.log("Using cached data for page:", activePage);
    setNotes(cache[activePage]);
  } else {
    fetchCurrentPage();
  }
  let pagesToFetch : number[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pagesToFetch.push(i);
  } else if (activePage < 3) {
    pagesToFetch = [1, 2, 3, 4, 5];
  } else if (totalPages - activePage < 2) {
    pagesToFetch = [
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  } else {
    pagesToFetch = [
      activePage - 2,
      activePage - 1,
      activePage,
      activePage + 1,
      activePage + 2,
    ];
  }

  pagesToFetch = pagesToFetch.filter((page) => !cache[page]);

  if (pagesToFetch.length > 0) {
    fetchPages(pagesToFetch);
  }
  return () => {
    isMounted = false; // Cleanup function 
  };
}, [highestNodeId,activePage, refresh, totalPages, cache]);

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
    // Increment the highestNodeIdref.current
    console.log("Old highestNodeIdref.current:", highestNodeId);

    
    console.log("New highestNodeIdref.current:", highestNodeId);
    
    // Create the new note data
    const newNoteData = {
      id: highestNodeId+1,
      content: (document.getElementById("new-note-Content") as HTMLInputElement).value,
      title: (document.getElementById("new-note-Title") as HTMLInputElement).value,
      author: {
        name: currUserName,
        email: currUserEmail,
      },
    };
  
    console.log("New note data:", newNoteData);
    // accepted token will be saved in a React state and sent as an 'Authorization' header
    axios
      .post(NOTES_URL, newNoteData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then((response) => {
        setHighestNodeId(highestNodeId+1);
        setNotes((prevNotes) => [...prevNotes, newNoteData]);
  
        // Update the cache
        setCache((prevCache) => ({
          ...prevCache,
          [activePage]: [...prevCache[activePage], newNoteData],
        }));
  
        // Refresh and reset form
        //setRefresh(refresh + 1); is it required here?
        setNewNote({
          id: 0,
          title: "",
          author: { name: "", email: "" },
          content: "",
        });
        clearTextfields();
        setAddingNewNote(false);
      })
      .catch((error) => {
        console.log("Failed to add note:", error);
      });
  }
  
  function handleCancelNewNote() {
    setAddingNewNote(false);
  }

  function handleButtons() {
    let pageButtons : number[] = [];
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
    // accepted token will be saved in a React state and sent as an 'Authorization' header
    axios
      .put(`${NOTES_URL}/${noteId}`, editedNoteData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then((response) => {
        setNotes((prevNotes) => prevNotes.map((note) => (note.id === noteId ? { ...note, content: noteContent } : note)));
      setCache((prevCache) => ({
        ...prevCache,
        [activePage]: prevCache[activePage].map((note) => (note.id === noteId ? { ...note, content: noteContent } : note)),
      }));
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
    // accepted token will be saved in a React state and sent as an 'Authorization' header
    axios
      .delete(`${NOTES_URL}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then((response) => {
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));

        setCache((prevCache) => ({
          ...prevCache,
          [activePage]: prevCache[activePage].filter((note) => note.id !== id),
        }));

        if (isLastNote && activePage > 1) {
          setActivePage(activePage - 1);
        } else {
          setRefresh(refresh + 1); // Refresh notes after deleting a note, is it required here?
        }
      })
      .catch((error) => console.log("Failed to delete note:", error));
  }

      const switchTheme = () => {
        setIsDarkMode((prevMode) => {
          const newMode = !prevMode;
          document.querySelector("body")?.setAttribute("data-theme", newMode ? "dark" : "light");
          return newMode;
        });
      };


      const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // avoid submission
        const userData = {
            name: (document.getElementById("register-name")as HTMLInputElement).value,
            email: (document.getElementById("register-email")as HTMLInputElement).value,
            username: (document.getElementById("register-username")as HTMLInputElement).value,
            password: (document.getElementById("register-password")as HTMLInputElement).value,
        };
    
        try {
            await axios.post(USERS_URL, userData);
            
        } catch (error) {
          console.log("Failed to add new user::", error);
        }
    };

    const handleLogout = () => {
      setToken(null);
      setCurrUserName("");
      setcurrUserEmail("");
    }

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault(); // avoid submission
      const loginData = {
          username: (document.getElementById("login-username")as HTMLInputElement).value,
          password: (document.getElementById("login-password")as HTMLInputElement).value,
      };
  
      try {
          const response = await axios.post(LOGIN_URL, loginData);
          setToken(response.data.token);
          setCurrUserName(response.data.name);
          setcurrUserEmail(response.data.email);
      } catch (error) {
        console.log("Failed to login:", error);
      }
  };
  

  return (
    <div>
      {/*toggle dark mode */}
      <div className="wrapper">
        <button className="change_theme" name="change_theme" onClick={switchTheme}>
          Change Theme
        </button>
      </div>

      <div className="flex flex-col min-h-screen p-3 items-center justify-center">
        {/* Header */}
        <div
          style={{
            margin: "10px 0",
            fontWeight: "bold",
            fontSize: "24px",
            color: "turquoise",
          }}
        >
          <div className="text-center" style={{display: 'flex', justifyContent: 'center'}}>The New FaceBook</div>
        </div>

        {/* Registration Form */}
        <div>
          <h2>Register</h2>
          <form name="create_user_form" onSubmit={handleRegister}>
          <input type="text" name="create_user_form_name" id="register-name" placeholder="Name" />
          <input type="text" name="create_user_form_email" id="register-email" placeholder="Email" />
          <input type="text" name="create_user_form_username" id="register-username" placeholder="Username" />
          <input type="password" name="create_user_form_password" id="register-password" placeholder="Password" />
          <button type="submit" name="create_user_form_create_user">Create User</button>
          </form>
        </div>

        <div>
        {token ? (
          <button className="button1" name="logout" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <div>
            <h2>Login</h2>
            <form name="login_form" onSubmit={handleLogin}>
              <input type="text" name="login_form_username" id="login-username" placeholder="Username" />
              <input type="password" name="login_form_password" id="login-password" placeholder="Password" />
              <button type="submit" name="login_form_login">Login</button>
            </form>
          </div>
        )}
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
            <div className="button-container2">
              {token &&(
              <button
                className="button1"
                name="add_new_note"
                onClick={handleAddNewNoteClick}
              >
                Add New Note
              </button>
              )}
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
              {Note.author.name === currUserName &&(
                <>
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
                </>
              )}
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
