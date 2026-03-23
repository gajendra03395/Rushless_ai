import React, { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const Toast = ({ message, type = 'info' }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 2800)

    return () => clearTimeout(timer)
  }, [])

  const getToastConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-600',
          icon: CheckCircle,
          iconColor: 'text-green-100'
        }
      case 'error':
        return {
          bgColor: 'bg-red-600',
          icon: AlertCircle,
          iconColor: 'text-red-100'
        }
      case 'info':
      default:
        return {
          bgColor: 'bg-indigo-600',
          icon: Info,
          iconColor: 'text-indigo-100'
        }
    }
  }

  const config = getToastConfig(type)
  const Icon = config.icon

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`${config.bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-[300px] max-w-md`}>
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
        <span className="flex-1">{message}</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast
