import React from 'react';
import Markdown from 'react-markdown';
import userIcon from '../assets/user-icon.png';
// TODO: Consider replacing chatbotIcon with its own distinct icon.
import chatbotIcon from '../assets/user-icon.png'
import robot from '../assets/popcornn.png'
import bulb from '../assets/bulbb.png'
import book from '../assets/bookk.png'
import suggest from '../assets/suggestt.png'


const ChatArea = ({ suggested, waiting, data, streamdiv, answer }) => {
  const lastModelMessage = [...data].reverse().find(item => item.role === 'model');
  console.log('message',lastModelMessage)
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
          
          {suggested ? <img src={suggest} width={300} /> : <img src={waiting ? book : bulb} width={300}></img> }
          <p><Markdown children={lastModelMessage.parts[0].text} /></p>
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