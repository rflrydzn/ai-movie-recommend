import React, { useEffect } from 'react';
import Markdown from 'react-markdown';
import userIcon from '../assets/user-icon.png';
// TODO: Consider replacing chatbotIcon with its own distinct icon.
import chatbotIcon from '../assets/user-icon.png'
import robot from '../assets/popcornn.png'
import bulb from '../assets/bulbb.png'
import book from '../assets/bookk.png'
import suggest from '../assets/suggestt.png'
import sad from '../assets/sadd.png'
import { useState } from 'react';


const ChatArea = ({ sorry, response, suggested, waiting, data, streamdiv, answer, inputRef }) => {
  const lastModelMessage = [...data].reverse().find(item => item.role === 'model');
  
  const [apologies, setApologies] = useState("")
  
  const robotState = () => {
    if (sorry) {
      return sad
    } else if (waiting) {
      return book
    } else if (suggested) {
      return suggest
    } else {
      return bulb
    }
  }
  // const sadrobot = async (text) => {
  //   return /sorry/i.test(text); // 'i' makes it case-insensitive
  // };
  // console.log("chatresponse", response)
  console.log('suggest', suggested)
  console.log('sorry', sorry)
  
  
  return (
    <div className="">
      {/* {data?.length <= 0 ? (
        <div className="welcome-area">
          <p className="welcome-1">Hi,</p>
          <p className="welcome-2">Let's find your perfect movie</p>
        </div>
      ) : (
        <div className="" style={{display: "none"}}></div>
      )} */}

{lastModelMessage && (
        <div className={lastModelMessage.role}>
          <div className='flex items-center  '>
          
          {/* {suggested ? <img src={suggest} width={300} /> : <img src={waiting ? book : bulb} width={300}></img> }
          {sorry ? <img src={sad} /> : null} */}
          <img src={robotState()} width={300} />
          
          <p className='text-3xl'><Markdown children={lastModelMessage.parts[0].text} /></p>
          </div>
          
        </div>
      )}


      {streamdiv && (
        <div className="text-end bg-amber-800">
          
          {answer && <p className='text-end bg-amber-800'><Markdown children={answer} /></p>}
        </div>
      )}
      
      <span id="checkpoint"></span>
    </div>
  );
};

export default ChatArea;