import React, { useState } from 'react'
import { Bell, X } from 'lucide-react'

const AlertBanner = ({ alerts }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set())

  const dismissAlert = (index) => {
    setDismissedAlerts(prev => new Set(prev).add(index))
  }

  const activeAlerts = alerts.filter((_, index) => !dismissedAlerts.has(index))

  if (activeAlerts.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4">
      <div className="max-w-7xl mx-auto">
        {activeAlerts.map((alert, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 animate-pulse" />
              <span className="font-medium">{alert}</span>
            </div>
            <button
              onClick={() => dismissAlert(index)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AlertBanner
