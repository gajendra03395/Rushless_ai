import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api/axios'

const PredictionChart = ({ location }) => {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await api.get(`/predict/${location}`)
        const data = response.data.predictions.map(pred => ({
          hour: `${pred.hour}:00`,
          level: pred.predicted_level === 'low' ? 0 : pred.predicted_level === 'medium' ? 1 : 2,
          levelText: pred.predicted_level
        }))
        setPredictions(data)
      } catch (error) {
        console.error('Failed to fetch predictions:', error)
      } finally {
        setLoading(false)
      }
    }

    if (location) {
      fetchPredictions()
    }
  }, [location])

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-[#1a1a2e] p-3 rounded border border-gray-700">
          <p className="text-white font-medium">{payload[0].payload.hour}</p>
          <p className="text-gray-300 text-sm">Level: {payload[0].payload.levelText}</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
      <h3 className="text-xl font-semibold text-white mb-6">Next 3 Hours Prediction</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={predictions}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="hour" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            domain={[0, 2]}
            ticks={[0, 1, 2]}
            tickFormatter={(value) => ['Low', 'Medium', 'High'][value]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="level" 
            fill="#6366F1"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PredictionChart
