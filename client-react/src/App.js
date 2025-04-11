/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** Import necessary modules. */
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { flushSync } from 'react-dom';
import './App.css';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'

/** Import necessary components. */
import ConversationDisplayArea from './components/ConversationDisplayArea.js';
import Header from './components/Header.js';
import MessageInput from './components/MessageInput.js';

const queryClient = new QueryClient()

function AppContent() {
  
  
  
function extractTitleFromResponse(text) {
  const match = text.match(/(?:\*\*\*|\*\*|\*|___|__|_)(.+?)(?:\*\*\*|\*\*|\*|___|__|_)/);
  return match ? match[1] : null;
}
  const [title, setTitle] = useState("")
  const [movieDetails, setMovieDetails] = useState('')
  const [movieInfo, setMovieInfo] = useState({
    title: "",
    year: "",
    rated: "",
    released: "",
    runtime: "",
    genre: "",
    director: "",
    writers: "",
    actors: "",
    plot: "",
    language: "",
    awards: "",
    poster: "",
    ratings: "",
    imdbrating: "",

  })
  /** Reference variable for message input button. */
  const inputRef = useRef();
  /** Host URL */
  const host = "http://localhost:9000"
  /** URL for non-streaming chat. */
  const url = host + "/chat";
  /** URL for streaming chat. */
  const streamUrl = host + "/stream";
  /** State variable for message history. */
  const [data, setData] = useState([]);
  /** State variable for Temporary streaming block. */
  const [answer, setAnswer] = useState("")
  /** State variable to show/hide temporary streaming block. */
  const [streamdiv, showStreamdiv] = useState(false);
  /** State variable to toggle between streaming and non-streaming response. */
  const [toggled, setToggled] = useState(false);
  /** 
   * State variable used to block the user from inputting the next message until
   * the previous conversation is completed.
   */
  const [waiting, setWaiting] = useState(false);
  /** 
   * `is_stream` checks whether streaming is on or off based on the state of 
   * toggle button.
   */
  const is_stream = toggled;

  /** Function to scroll smoothly to the top of the mentioned checkpoint. */
  function executeScroll() {
    const element = document.getElementById('checkpoint');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /** Function to validate user input. */
  function validationCheck(str) {
    return str === null || str.match(/^\s*$/) !== null;
  }

  /** Handle form submission. */
  const handleClick = () => {
    if (validationCheck(inputRef.current.value)) {
      console.log("Empty or invalid entry");
    } else {
      if (!is_stream) {
        /** Handle non-streaming chat. */
        handleNonStreamingChat();
      } else {
        /** Handle streaming chat. */
        handleStreamingChat();
      }
    }
  };

  /** Handle non-streaming chat. */
  const handleNonStreamingChat = async () => {
    /** Prepare POST request data. */
    const chatData = {
      chat: inputRef.current.value,
      history: data
    };

    /** Add current user message to history. */
    const ndata = [...data,
      {"role": "user", "parts":[{"text": inputRef.current.value}]}]

    /**
     * Re-render DOM with updated history.
     * Clear the input box and temporarily disable input.
     */
    flushSync(() => {
        setData(ndata);
        inputRef.current.value = ""
        inputRef.current.placeholder = "Waiting for model's response"
        setWaiting(true)
    });

    /** Scroll to the new user message. */
    executeScroll();

    /** Headers for the POST request. */
    let headerConfig = {
      headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          "Access-Control-Allow-Origin": "*",
      }
    };

    /** Function to perform POST request. */
    const fetchData = async() => {
      var modelResponse = ""
      try {
        const response = await axios.post(url, chatData, headerConfig);
        modelResponse = response.data.text
        console.log(modelResponse)
        const extractedTitle = extractTitleFromResponse(modelResponse);
console.log("Extracted Title:", extractedTitle);
        setTitle(extractedTitle)
        
      } catch (error) {
        modelResponse = "Error occurred";
      }finally {
        /** Add model response to the history. */
        const updatedData = [...ndata,
          {"role": "model", "parts":[{"text": modelResponse}]}]

        /**
         * Re-render DOM with updated history.
         * Enable input.
         */
        flushSync(() => {
          setData(updatedData);
          inputRef.current.placeholder = "Enter a message."
          setWaiting(false)
        });
        /** Scroll to the new model response. */
        executeScroll();
      }
    };
    
    fetchData();
    
  };

  /** Handle streaming chat. */
  const handleStreamingChat = async () => {
    /** Prepare POST request data. */
    const chatData = {
      chat: inputRef.current.value,
      history: data
    };

    /** Add current user message to history. */
    const ndata = [...data,
      {"role": "user", "parts":[{"text": inputRef.current.value}]}]

    /**
     * Re-render DOM with updated history.
     * Clear the input box and temporarily disable input.
     */
    flushSync(() => {
      setData(ndata);
      inputRef.current.value = ""
      inputRef.current.placeholder = "Waiting for model's response"
      setWaiting(true)
    });

    /** Scroll to the new user message. */
    executeScroll();

    /** Headers for the POST request. */
    let headerConfig = {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
    }

    /** Function to perform POST request. */
    const fetchStreamData = async() => {
      try {
        setAnswer("");
        const response = await fetch(streamUrl, {
          method: "post",
          headers: headerConfig,
          body: JSON.stringify(chatData),
        });

        if (!response.ok || !response.body) {
          throw response.statusText;
        }

        /** 
         * Creates a reader using ReadableStream interface and locks the
         * stream to it.
         */
        const reader = response.body.getReader();
        /** Create a decoder to read the stream as JavaScript string. */
        const txtdecoder = new TextDecoder();
        const loop = true;
        var modelResponse = "";
        /** Activate the temporary div to show the streaming response. */
        showStreamdiv(true);

        /** Loop until the streaming response ends. */
        while (loop) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          /**
           * Decode the partial response received and update the temporary
           * div with it.
           */
          const decodedTxt = txtdecoder.decode(value, { stream: true });
          setAnswer((answer) => answer + decodedTxt);
          modelResponse = modelResponse + decodedTxt;
          
          executeScroll();
        }
      } catch (err) {
        modelResponse = "Error occurred";
      } finally {
        /** Clear temporary div content. */
        setAnswer("")
        /** Add the complete model response to the history. */
        const updatedData = [...ndata,
          {"role": "model", "parts":[{"text": modelResponse}]}]
        /** 
         * Re-render DOM with updated history.
         * Enable input.
         */
        flushSync(() => {
          setData(updatedData);
          inputRef.current.placeholder = "Enter a message."
          setWaiting(false)
        });
        /** Hide temporary div used for streaming content. */
        showStreamdiv(false);
        /** Scroll to the new model response. */
        executeScroll();
      }
    };
    fetchStreamData();
  };

  // useEffect(() => {
  //   async function fetchMovie() {
  //     if (title != null) {
  //       try {
  //         const res = await fetch(`https://www.omdbapi.com/?s=${title}&apikey=b9465903`);
  //         const moviedata = await res.json();
  //           if (moviedata.Search && moviedata.Search.length > 0) {
  //             console.log("movie data:", moviedata); // or store it in state
  //             setMovieID(moviedata.Search[0].imdbID)
  //           }
          
  //       } catch (err) {
  //         console.error("Error fetching movie data:", err);
  //       }
  //       console.log("id", movieID)
  //       const resdetails = await fetch(`https://www.omdbapi.com/?i=${movieID}&plot=full&apikey=b9465903`)
  //       const movieinfo = await resdetails.json()
  //       setMovieInfo({
  //         poster: movieinfo.Poster, 
  //         genre: movieinfo.Genre,
  //         plot: movieinfo.Plot,
  //         year: movieinfo.Year,
  //         runtime: movieinfo.Runtime,
  //       })
  //       console.log("info", movieinfo)
  //     }
      
  //   }
  
  //   fetchMovie();
  // }, [title]);

  // 1. Search for movie ID by title
const { data: searchData } = useQuery({
  queryKey: ['movieSearch', title],
  queryFn: async () => {
    if (!title) return null;
    const res = await fetch(`https://www.omdbapi.com/?s=${title}&apikey=b9465903`);
    return res.json();
  },
  enabled: !!title
});

// 2. Get full movie info by ID
const movieID = searchData?.Search?.[0]?.imdbID;

const { data: movieInfoData } = useQuery({
  queryKey: ['movieInfo', movieID],
  queryFn: async () => {
    if (!movieID) return null;
    const res = await fetch(`https://www.omdbapi.com/?i=${movieID}&plot=full&apikey=b9465903`);
    return res.json();
  },
  enabled: !!movieID
});

useEffect(() => {
  if (movieInfoData) {
    setMovieInfo({
      poster: movieInfoData.Poster,
      genre: movieInfoData.Genre,
      plot: movieInfoData.Plot,
      year: movieInfoData.Year,
      runtime: movieInfoData.Runtime,
      imdbrating: movieInfoData.imdbRating,
      director: movieInfoData.Director,
      writers: movieInfoData.Writer,
      actors: movieInfoData.Actors,
      rated: movieInfoData.Rated
    });
  }
}, [movieInfoData]);

  return (
    <div className='flex'>
      <div className='w-[50%] border-2'>
        <div>
          <h1>{title}</h1>
          <p>{movieInfo.year} - {movieInfo.rated} - {movieInfo.runtime}</p>
        </div>

        <div>
          <img src={movieInfo.poster}></img>
          <img src='' alt='trailer'></img>
        </div>
        
        <div>
          <button>{movieInfo.genre}</button>
        </div>
        <p>{movieInfo.plot}</p>
        <p>Rating - {movieInfo.imdbrating}</p>
        <hr />
        <p>Director: {movieInfo.director} </p>
        <hr />
        <p>Writers: {movieInfo.writers}</p>
        <hr />
        <p>Actors: {movieInfo.actors}</p>
      </div>
      <div className='w-[50%] border-2'>
      <center>
        <div className="chat-app">
          <Header toggled={toggled} setToggled={setToggled} />
          <ConversationDisplayArea data={data} streamdiv={streamdiv} answer={answer} />
          <MessageInput inputRef={inputRef} waiting={waiting} handleClick={handleClick} />
          title: {title}
          id: {movieID}
          {movieDetails.Response ? (
            <p>{movieDetails.Search[0].Year}</p>
          ): null}
        </div>
      </center>
      </div>
      
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}


export default App;