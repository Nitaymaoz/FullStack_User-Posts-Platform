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
  const [posts,setPosts] = useState<Post[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [totalPages,setTotalPages] = useState(1);

  // Call to server (front end calls backend)
  const promise2 = axios.get("http://localhost:3001/notes").then(response =>{
    console.log(response);
  });

  useEffect(() => {
    console.log('Fetching posts for page:', activePage); // Log active page
    const promise = axios.get(NOTES_URL, {
      params: {
        _page: activePage,
        _per_page: POSTS_PER_PAGE
      }
    });
  
    promise.then(response => {
      console.log(response.data); // show data in dev tools
      setPosts(Array.isArray(response.data) ? response.data : []);
      
      const totalCount = parseInt(response.headers['x-total-count'], 10);
      setTotalPages(Math.ceil(totalCount / POSTS_PER_PAGE));
    }).catch(error => {
      console.log("Encountered an error:" + error)
    });
  }, [activePage]); // optimized - re-rendering only when active page is changed.
  
  


  function handlePageChange(newPage:number){
    console.log('Changing to page:', newPage); // Log page change
    setActivePage(newPage);
  }

  function test(){
    console.log('test');
  }

  function handleButtons(){
    let pageButtons = [];
    if(totalPages<=5){
      for(let i=0;i<totalPages;i++)
        pageButtons.push(i+1);
    }
    else if(activePage<3)
      pageButtons=[1,2,3,4,5];
    else if((totalPages-activePage) < 2)
      pageButtons = [totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages];
    else{
      pageButtons = [activePage-2,activePage-1,activePage,activePage+1,activePage+2];
    }
    return pageButtons;
  }

  return (
    <div className="relative min-h-screen w-full bg-cover bg-no-repeat bg-center"
        style={{ backgroundImage: `url('my-space2.png')`,backgroundAttachment: 'fixed', backgroundSize: 'contain', backgroundPosition: 'center' }}>
    <div className="flex-col min-h-screen p-3">
        {/* Header */}
        <div style={{ margin: '10px 0', fontWeight: 'bold', fontSize: '24px' ,color:'turquoise'}}>
        <div className="text-center">
          The New FaceBook
          </div>
        </div>


      
        {/* Display the notes */}
        <div className="flex-1 w-full overflow-y-auto p-4">
          {posts.map(post => (
            <div key={post.id} className="note" id={`${post.id.toString()}`} >
              <h2>{post.title}</h2>
              <small>By: {post.author.name} ({post.author.email})</small>
              <h2>{post.content}</h2>
            </div>
          ))}
        </div>

        {/* Pages buttons */}
        <div className="w-full fixed bottom-0 left-0 flex justify-center p-2 space-x-3">
        <button name="previous" onClick={()=>handlePageChange(Math.max(activePage-1,1))}>Prev</button>
        <button name="first" onClick={()=>handlePageChange(1)}>First</button>
        <button name="test" onClick={()=>test()}>Test</button>
        
        {handleButtons().map(page=>(<button key="{page}" 
        name={'page-${page}'}
        onClick={()=>handlePageChange(page)}
        style={{ fontWeight: page === activePage ? 'bold' : 'normal' }}
        >{page}
        </button>))}


        <button name="next" onClick={()=>handlePageChange(Math.min(activePage + 1,totalPages))}>Next</button>
        <button name="last" onClick={()=>handlePageChange(totalPages)}>Last</button>
        </div>
      </div>
    </div>
  );
}
