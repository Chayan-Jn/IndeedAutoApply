import React, { useState } from 'react'
import './App.css'
const App = () => {
  const [job,setJob] = useState('')
  const [location,setLocation] = useState('')
  function handleSubmit(e){
    e.preventDefault();

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'trigger_search',
        job: job,
        location: location.trim() === '' ? 'India' : location
      });
    });

  }
  return (
    <div className='main'>
      <input value={job} 
      onChange={(e)=>setJob(e.target.value)}
      placeholder= 'Enter the Job/Internship'
      className='input-job'
      />

      <input type="text" id="" 
      onChange={(e)=>setLocation(location)}
      placeholder='Location'
      className='location'
      />

      <button className='search-apply' onClick={handleSubmit}>Search</button>
    </div>
  )
}

export default App