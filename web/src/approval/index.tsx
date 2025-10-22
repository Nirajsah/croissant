import React from 'react'
import { createRoot } from 'react-dom/client'
import ApprovalPopup from './ApprovalPopup'

// Create root element
const rootElement = document.createElement('div')
rootElement.id = 'root'
document.body.appendChild(rootElement)

// Render the React app
const root = createRoot(rootElement)
root.render(
  <React.StrictMode>
    <ApprovalPopup />
  </React.StrictMode>
)
