import React, { createContext, useContext, useState, useEffect } from 'react'

const MessageContext = createContext<any>(null)

export const MessageProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [message, setMessage] = useState<any>(null)

  useEffect(() => {
    const handleMessage = (msg: any) => {
      setMessage(msg)
    }

    chrome.runtime.onMessage.addListener(handleMessage)

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  return (
    <MessageContext.Provider value={message}>
      {children}
    </MessageContext.Provider>
  )
}

export const useMessage = () => {
  const context = useContext(MessageContext)
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider')
  }
  return context
}
