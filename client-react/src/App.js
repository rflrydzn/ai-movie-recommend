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
  
  const [isSuggested, setIsSuggested] = useState(false)
  
function extractTitleFromResponse(text) {
  const match = text.match(/(?:\*\*\*|\*\*|\*|___|__|_)(.+?)(?:\*\*\*|\*\*|\*|___|__|_)/);
  
  
  return match ? match[1] : null;
}
  const [title, setTitle] = useState("")
  const [trailer, setTrailer] = useState("")
  const [movieDetails, setMovieDetails] = useState('')
  const [movieInfo, setMovieInfo] = useState({
    title: featured.Title,
    year: featured.Year,
    rated: featured.Rated,
    released: "",
    runtime: featured.Runtime,
    genre: featured.Genre,
    director: featured.Director,
    writers: featured.Writer,
    actors: featured.Actors,
    plot: featured.Plot,
    language: "",
    awards: "",
    poster: featured.Poster,
    ratings: featured.imdbRating,
    imdbrating: "",

  })
  const [hasStarted, setHasStarted] = useState(false)
  const [isSorry, setIsSorry] = useState("")
  const [isGreat, setIsGreat] = useState("")
  const [trailerInfo, setTrailerInfo] = useState({url: "", thumbnail: "", id: ""})
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
  const handleClick = (val) => {
    let inputText = inputRef.current.value ;
    

    // If empty, simulate a default message
    if (validationCheck(inputText)) {
      inputText = "Begin, no need to say hi/hello. ";

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
  const handleNonStreamingChat = async (val) => {
    /** Prepare POST request data. */
    const chatData = {
      chat: val || inputRef.current.value,
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
// console.log("Extracted Title:", extractedTitle);
        setTitle(extractedTitle)
        const matchSorry = /apologies/i.test(modelResponse)
        const matchGreat = /Glad you liked it/i.test(modelResponse)
        setIsGreat(matchGreat)
        setIsSorry(matchSorry)

        
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
// console.log('setissuggest', isSuggested)
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
  if (searchData?.Response === 'True') {
    setIsSuggested(true);
  }
}, [searchData]);

useEffect(() => {
  setTrailerInfo({url: "1s9Yln0YwCw"})
}, [])

const { data: movieTrailer } = useQuery({
  queryKey: ['movieTrailer', movieID],
  queryFn: async () => {
    if (!movieID) return null;
    const res = await fetch(`https://api.kinocheck.com/movies?imdb_id=${movieID}`);
    const trailerID =  await res.json();
    
    const trailerInfo = {url: trailerID.trailer.youtube_video_id,
      thumbnail: trailerID.trailer.youtube_thumbnail, id: trailerID.imdb_id
    }
    return trailerInfo;
    
  },
  enabled: !!movieID
});

useEffect(()=> {
  setTrailerInfo({id: movieTrailer?.id, url: movieTrailer?.url, thumbnail: movieTrailer?.thumbnail})
}, [movieInfo.poster])

useEffect(() => {
  if (movieInfoData) {
    setMovieInfo({
      poster: movieInfoData.Poster,
      title: movieInfoData.Title,
      genre: movieInfoData.Genre,
      plot: movieInfoData.Plot,
      year: movieInfoData.Year,
      runtime: movieInfoData.Runtime,
      imdbrating: movieInfoData.imdbRating,
      director: movieInfoData.Director,
      writers: movieInfoData.Writer,
      actors: movieInfoData.Actors,
      rated: movieInfoData.Rated,
      ratings: movieInfoData.imdbRating
    });
  }
}, [movieInfoData]);

function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[:]/g, '').trim() ;
}


useEffect(()=> {
  if (isGreat) {
    const slugged = slugify(movieInfo.title)
    window.open(`https://www.justwatch.com/us/movie/${slugged}`, '_blank');
    setIsSuggested(false)
  } 

  if (isSorry) {
    setIsSuggested(false)
  }
},[isGreat, isSorry])

console.log('happy', isGreat)
console.log('trailerrrrrr', movieTrailer?.url)

const words = movieInfo.genre.split(',').map(word => word.trim());
const featuredWords = movieInfo.genre.split(',').map(word => word.trim());

  return (
    <div className='flex'>
      <div className='w-[50%]  p-5 bg-gradient-to-b from-[#0f0f0f] to-[#1a2238] text-white' style={{fontFamily: 'Verdana'}}>
        <div>
          <h1 className='text-[2rem]' style={{fontFamily: 'Helvetica Neue'}}>{movieInfo.title}</h1>
          <p className='mb-1'>{movieInfo.year} - {movieInfo.rated} - {movieInfo.runtime}</p>
        </div>

        <div className='flex gap-2'>
          <img src={movieInfo.poster} className='w-1/4 rounded-xl'></img>
          <div className='w-3/4 rounded-xl overflow-hidden'><ReactPlayer 
          url={`https://www.youtube.com/watch?v=${trailerInfo?.url || featured.Trailer}`}
          width='100%'
          height='100%'
          light={trailerInfo.thumbnail || ''}/></div>
          
        </div>
        
        <div className='flex justify-start my-3 gap-4'>
          {featuredWords.map(gen => (
            <ul>
              <li className='border rounded-xl px-2'>{gen}</li>
            </ul>
          ))}
        </div>
        <p>{movieInfo.plot}</p>
        <p className='my-3'>⭐ {movieInfo.ratings}/10</p>
        <hr />
        <p className='my-2'>Directors: {movieInfo.director} </p>
        <hr />
        <p className='my-2'>Writers: {movieInfo.writers}</p>
        <hr />
        <p className='my-2'>Actors: {movieInfo.actors}</p>
      </div>
      <div className='w-[50%]  bg-gradient-to-b from-[#0f0f0f] to-[#1a2238] text-white'>
          {data?.length <= 0 ? (
            <div className='  justify-center items-center h-screen flex'>
              <div className='flex flex-col items-center gap-8'>
          
            {/* <div className="welcome-area">
              <p className="welcome-1">Hi,</p>
              <p className="welcome-2">Let's find your perfect movie</p>
            </div> */}
                <div className='flex items-center w-full'>
                <img src={robot} width={300}></img>
                <p className='text-3xl'>
                👋 Hey there! I'm <span className="font-semibold text-yellow-300">CineMate</span> — your movie BFF bot 🍿<br />
                Need help picking the perfect film? I got you. Let’s find your next favorite watch! 🎥<br />
                Hit that button to get started!
                </p>
                

                </div>
                <button className='border-solid border-2 border-white p-2 px-10 rounded-3xl text-4xl cursor-pointer' onClick={() => {handleClick(); setHasStarted(true)}} inputRef={inputRef}>Start</button>
                </div>
              </div>
          ) : (null)}
                    

        <div className="chat-app">
          
          {/* <Header toggled={toggled} setToggled={setToggled} /> */}
          <ConversationDisplayArea  great={isGreat} sorry={isSorry} suggested={!!movieInfo.poster} waiting={waiting} data={data} streamdiv={streamdiv} answer={answer} />
          {isSuggested || isGreat || !hasStarted ? 
            <div className='hidden'>
                <MessageInput  inputRef={inputRef} waiting={waiting} handleClick={handleClick} /> 
                
            </div>: <div className='text-center'><MessageInput  inputRef={inputRef} waiting={waiting} handleClick={handleClick} /></div>}
          {isSuggested ? <div className='text-center'>
            <button className='border-solid border-2 border-white p-2 px-10 rounded-3xl text-2xl cursor-pointer m-4' onClick={()=> {inputRef.current.value = 'i like it'; handleClick()}}>Stream on JustWatch</button>
            <button className='border-solid border-2 border-white p-2 px-10 rounded-3xl text-2xl cursor-pointer m-4' onClick={()=> handleNonStreamingChat('i dont like that')}>I don't like</button>
            {/* <MessageInput isSuggested={isSuggested} inputRef={inputRef} waiting={waiting} handleClick={handleClick} /> */}
            
            
          </div> : null}
          {isGreat ? <div><button className='border-solid border-2 border-white p-2 px-10 rounded-3xl text-2xl cursor-pointer m-4' onClick={()=> handleNonStreamingChat('reset')}>Try another one</button></div> : null }
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