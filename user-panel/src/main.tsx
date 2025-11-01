import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import AOS from 'aos'
import 'aos/dist/aos.css'

// Initialize AOS
AOS.init({
  duration: 800,
  easing: 'ease-out',
  once: true,
  offset: 100,
  delay: 0
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)





