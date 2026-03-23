import React from 'react'

const CrowdBadge = ({ level }) => {
  const getBadgeConfig = (level) => {
    switch (level) {
      case 'low':
        return {
          emoji: '🟢',
          text: 'Low',
          className: 'bg-green-500/20 text-green-400 border-green-500/30'
        }
      case 'medium':
        return {
          emoji: '🟡',
          text: 'Medium',
          className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        }
      case 'high':
        return {
          emoji: '🔴',
          text: 'High',
          className: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
        }
      default:
        return {
          emoji: '⚪',
          text: 'Unknown',
          className: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        }
    }
  }

  const config = getBadgeConfig(level)

  return (
    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
      <span>{config.emoji}</span>
      <span>{config.text}</span>
    </span>
  )
}

export default CrowdBadge
