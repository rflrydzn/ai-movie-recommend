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
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

/** Submission using the Enter key or button. */
const MessageInput = ({ isSuggested, inputRef, waiting, handleClick }) => {
  return !isSuggested && (
    <div className="">
      <input
        className="p-5 w-96 pr-40 rounded-2xl border-white border text-left text"
        type="text"
        name="chat"
        placeholder="Enter a message."
        ref={inputRef}
        disabled={waiting}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleClick();
        }}
      />
      {/* <button className="" onClick={handleClick}>
        <span className="fa-span-send">
          <FontAwesomeIcon icon={faPaperPlane} />
        </span>
      </button> */}
    </div>
  );
};

export default MessageInput;