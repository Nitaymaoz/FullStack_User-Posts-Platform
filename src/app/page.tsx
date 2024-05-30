"use client";
import { useState, useEffect } from 'react';
import Image from "next/image";
import notesData from './../../data/notes.json';
import axios from 'axios';

const NOTES_URL = 'http://localhost:3001/notes'
const POSTS_PER_PAGE = 10;

interface Post{
  id:number;
  title:string;
  author: {
    name: string;
    email: string;
  };
  content:string;
}

export default function Home() {
  //const [index,setIndex] = useState(0);
  const [posts,setPosts] = useState<Post[]>([]);
  const [activePage, setActivePage] = useState(1);

  useEffect(() => {
    console.log('Fetching posts for page:', activePage); // Log active page
    const promise = axios.get(NOTES_URL, {
        params: {
          _page: activePage,
          _per_page: POSTS_PER_PAGE
        }});
    promise.then(response => { console.log(response.data); // Log the data to verify structure
    setPosts(Array.isArray(response.data) ? response.data : []);
    }).catch(error => { console.log("Encountered an error:" + error)});
  },[activePage]);


  function handlePageChange(newPage:number){
    console.log('Changing to page:', newPage); // Log page change
    setActivePage(newPage);
  }

  return (
    <div>
        {/* Header */}
        <div style={{ margin: '20px 0', fontWeight: 'bold', fontSize: '24px' }}>
        <div className="text-center my-3">
          Welcome to my Next.js app!
          </div>
        </div>


        {/* Background
        <div className="relative min-h-screen flex flex-col justify-between items-center"
        style={{ backgroundImage: `url('Cool_guy_schotch.jpg')`, backgroundSize: 'contain', backgroundPosition: 'center' }}>
        </div> */}


        {/* Display the notes */}
        <div>
        <map name="print posts"></map>
        </div>
        <div>
          {posts.map(post => (
            <div key={post.id} className="note">
              <h2>{post.title}</h2>
              <p>By: {post.author.name} ({post.author.email})</p>
              <p>{post.content}</p>
            </div>
          ))}
        </div>

        {/* Pages buttons */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-3">
        <button onClick={()=>handlePageChange(activePage-1)} name="previous" >Previous</button>
        <button onClick={()=>handlePageChange(1)} name="first" >First</button>
        <button onClick={()=>handlePageChange(1)} name="page-1" >1</button>
        <button onClick={()=>handlePageChange(2)} name="page-2" >2</button>
        <button onClick={()=>handlePageChange(activePage + 1)} name="next" >Next</button>
        {/* <button onClick={()=>handlePageChange()} name="last" >Last</button> */}
      </div>
    </div>
  );
}
