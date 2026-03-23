import React, { useState } from 'react'
import { Users, Clock, Camera, Brain, TrendingUp, X } from 'lucide-react'
import CrowdBadge from './CrowdBadge'
import UploadModal from './UploadModal'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api/axios'

const LocationCard = ({ 
  name, 
  currentLevel, 
  personCount, 
  bestTime, 
  worstTime, 
  recommendation, 
  goNow,
  onUploadComplete,
  onRefresh 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showSmartPrediction, setShowSmartPrediction] = useState(false)
  const [showFuturePrediction, setShowFuturePrediction] = useState(false)
  const [smartPredictions, setSmartPredictions] = useState([])
  const [futurePredictions, setFuturePredictions] = useState([])
  const [loading, setLoading] = useState(false)

  const getBorderColor = () => {
    switch (currentLevel) {
      case 'low': return 'border-green-500 shadow-green-500/20'
      case 'medium': return 'border-yellow-500 shadow-yellow-500/20'
      case 'high': return 'border-red-500 shadow-red-500/20'
      default: return 'border-gray-800'
    }
  }

  const getGlowColor = () => {
    switch (currentLevel) {
      case 'low': return 'shadow-lg shadow-green-500/30'
      case 'medium': return 'shadow-lg shadow-yellow-500/30'
      case 'high': return 'shadow-lg shadow-red-500/30'
      default: return ''
    }
  }

  const fetchSmartPredictions = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/predict/${name}`)
      setSmartPredictions(response.data.predictions)
      setShowSmartPrediction(true)
    } catch (error) {
      console.error('Failed to fetch smart predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFuturePredictions = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/predict-next-hour/${name}`)
      setFuturePredictions(response.data.predictions)
      setShowFuturePrediction(true)
    } catch (error) {
      console.error('Failed to fetch future predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = (result) => {
    if (onUploadComplete) {
      onUploadComplete(name, result)
    }
    if (onRefresh) {
      onRefresh()
    }
    setIsModalOpen(false)
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-[#1a1a2e] p-2 rounded border border-gray-700 text-xs">
          <p className="text-white">{payload[0].payload.time}</p>
          <p className="text-gray-300">Count: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  const chartData = futurePredictions.map(pred => ({
    time: pred.time,
    value: pred.predicted_count,
    level: pred.predicted_level
  }))

  return (
    <>
      <div className={`bg-[#13131a] rounded-lg p-6 border ${getBorderColor()} hover:border-indigo-500 transition-all duration-300 transform hover:scale-[1.02] ${getGlowColor()}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">{name}</h3>
          <CrowdBadge level={currentLevel} />
        </div>

        {recommendation && (
          <div className="mb-4 p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
            <p className="text-indigo-300 text-sm font-medium">{recommendation}</p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 text-gray-300">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              <span className="font-medium">{personCount}</span> people currently
            </span>
          </div>

          <div className="flex items-center space-x-3 text-gray-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              Best time: <span className="font-medium">{bestTime}</span>
            </span>
          </div>

          {worstTime && (
            <div className="flex items-center space-x-3 text-gray-300">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">
                Worst time: <span className="font-medium">{worstTime}</span>
              </span>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mb-4">
          <button
            className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
              goNow
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
          >
            {goNow ? 'Go Now ✅' : 'Wait ⚠️'}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <Camera className="w-4 h-4" />
            <span>Upload</span>
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={fetchSmartPredictions}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
          >
            <Brain className="w-4 h-4 mr-1" />
            Smart Prediction
          </button>

          <button
            onClick={fetchFuturePredictions}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Future Prediction
          </button>
        </div>

        {showSmartPrediction && (
          <div className="mt-4 p-4 bg-[#1a1a2e] border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Next 3 Hours</h4>
              <button
                onClick={() => setShowSmartPrediction(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex space-x-2">
              {smartPredictions.map((pred, index) => (
                <div key={index} className="text-center">
                  <p className="text-gray-400 text-xs mb-1">{pred.hour}:00</p>
                  <CrowdBadge level={pred.predicted_level} />
                </div>
              ))}
            </div>
          </div>
        )}

        {showFuturePrediction && (
          <div className="mt-4 p-4 bg-[#1a1a2e] border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Next 60 Minutes Forecast</h4>
              <button
                onClick={() => setShowFuturePrediction(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={{ fill: '#6366F1', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        location={name}
        onUploadComplete={handleUploadComplete}
      />
    </>
  )
}

export default LocationCard
