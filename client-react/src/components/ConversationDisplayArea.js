import React from 'react';
import Markdown from 'react-markdown';
import userIcon from '../assets/user-icon.png';
// TODO: Consider replacing chatbotIcon with its own distinct icon.
import chatbotIcon from '../assets/user-icon.png'

const ChatArea = ({ data, streamdiv, answer }) => {
  
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

      {data.map((element, index) => (
        
        <div key={index} className={element.role}>
          
            {index == 0 ? null : <p className={`text-${index % 2 === 0 ? 'end' : 'start'}`}> <Markdown children={element.parts[0].text} /></p> }
        </div>
      ))}

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