import React, { useState } from 'react'
import './App.css'

const App = () => {
  const [job, setJob] = useState('')
  const [location, setLocation] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    console.log('[App] Submit clicked')

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'trigger_search',
        job: job,
        location: location.trim() === '' ? 'India' : location
      })
    })
  }

  return (
    <div className='main'>
      <input
        value={job}
        onChange={(e) => setJob(e.target.value)}
        placeholder='Enter the Job/Internship'
        className='input-job'
      />

      <input
        type='text'
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder='Location'
        className='location'
      />

      <button type='button' className='search-apply' onClick={handleSubmit}>
        Search
      </button>
    </div>
  )
}

export default App
