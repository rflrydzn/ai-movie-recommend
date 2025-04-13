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
import ReactPlayer from 'react-player/youtube'
import spiderman from './assets/postersample.jpg'
import robot from './assets/welcome.png'
import featured from './featured.json'

const queryClient = new QueryClient()

function AppContent() {
  
  
  
function extractTitleFromResponse(text) {
  const match = text.match(/(?:\*\*\*|\*\*|\*|___|__|_)(.+?)(?:\*\*\*|\*\*|\*|___|__|_)/);
  return match ? match[1] : null;
}
  const [title, setTitle] = useState("")
  const [trailer, setTrailer] = useState("")
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
    let inputText = inputRef.current.value;

    // If empty, simulate a default message
    if (validationCheck(inputText)) {
      inputText = "Introduce yourself";
      inputRef.current.value = inputText; // Set it in the input so the rest of the logic works
    }

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

const { data: movieTrailer } = useQuery({
  queryKey: ['movieTrailer', movieID],
  queryFn: async () => {
    if (!movieID) return null;
    const res = await fetch(`https://api.kinocheck.com/movies?imdb_id=${movieID}`);
    const trailerID =  await res.json();
    const trailerInfo = {url: trailerID.trailer.youtube_video_id,
      thumbnail: trailerID.trailer.youtube_thumbnail
    }
    return trailerInfo;
    
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
console.log(movieTrailer)

const words = movieInfo.genre.split(',').map(word => word.trim());
const featuredWords = featured.Genre.split(',').map(word => word.trim());
const samplegenre = ["action", "comedy", "horror"]
  return (
    <div className='flex'>
      <div className='w-[50%]  p-5 bg-gradient-to-b from-[#0f0f0f] to-[#1a2238] text-white' style={{fontFamily: 'Verdana'}}>
        <div>
          <h1 className='text-[2rem]' style={{fontFamily: 'Helvetica Neue'}}>{title || featured.Title}</h1>
          <p className='mb-1'>{movieInfo.year || featured.Year} - {movieInfo.rated || featured.Rated} - {movieInfo.runtime || featured.Runtime}</p>
        </div>

        <div className='flex gap-2'>
          <img src={movieInfo.poster || featured.Poster} className='w-1/4 rounded-xl'></img>
          <div className='w-3/4 rounded-xl overflow-hidden'><ReactPlayer 
          url={`https://www.youtube.com/watch?v=${movieTrailer?.url || featured.Trailer}`}
          width='100%'
          height='100%'
          light={movieTrailer?.thumbnail || ''}/></div>
          
        </div>
        
        <div className='flex justify-start my-3 gap-4'>
          {featuredWords.map(gen => (
            <ul>
              <li className='border rounded-xl px-2'>{gen}</li>
            </ul>
          ))}
        </div>
        <p>{movieInfo.plot || featured.Plot}</p>
        <p className='my-3'>⭐ {movieInfo.ratings || featured.imdbRating}/10</p>
        <hr />
        <p className='my-2'>Directors: {movieInfo.director || featured.Director} </p>
        <hr />
        <p className='my-2'>Writers: {movieInfo.writers || featured.Writer}</p>
        <hr />
        <p className='my-2'>Actors: {movieInfo.actors || featured.Actors}</p>
      </div>
      <div className='w-[50%]  bg-gradient-to-b from-[#0f0f0f] to-[#1a2238] text-white'>
          {data?.length <= 0 ? (
            <div className=''>
          
            <div className="welcome-area">
              <p className="welcome-1">Hi,</p>
              <p className="welcome-2">Let's find your perfect movie</p>
            </div>
          
                <img src={robot} width={300}></img>
                <button className='border-solid border-2' onClick={handleClick} inputRef={inputRef}>Start</button>
                
              </div>
          ) : (null)}
          
        <div className="chat-app">
          
          {/* <Header toggled={toggled} setToggled={setToggled} /> */}
          <ConversationDisplayArea suggested={!!movieInfo.poster} waiting={waiting} data={data} streamdiv={streamdiv} answer={answer} />
          <div className={data?.length <= 0 ? 'hidden' : ''}><MessageInput inputRef={inputRef} waiting={waiting} handleClick={handleClick} /></div>
          {/* <MessageInput inputRef={inputRef} waiting={waiting} handleClick={handleClick} /> */}
          {/* title: {title}
          id: {movieID}
          ytid: {movieTrailer?.url}
          {movieDetails.Response ? (
            <p>{movieDetails.Search[0].Year}</p>
          ): null} */}
        </div>
      
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