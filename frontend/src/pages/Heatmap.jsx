import React, { useState, useEffect } from 'react'
import api from '../api/axios'

const Heatmap = () => {
  const [heatmapData, setHeatmapData] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [loading, setLoading] = useState(true)

  const hours = Array.from({ length: 17 }, (_, i) => i + 6) // 6 AM to 10 PM
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  useEffect(() => {
    fetchLocations()
    fetchHeatmapData()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations')
      setLocations(['all', ...response.data.locations.map(loc => loc.name)])
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  }

  const fetchHeatmapData = async () => {
    try {
      const response = await api.get('/heatmap')
      setHeatmapData(response.data.heatmap_data)
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCellData = (day, hour) => {
    const filteredData = heatmapData.filter(item => {
      const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation
      return matchesLocation && item.day === day && item.hour === hour
    })

    if (filteredData.length === 0) return null

    const avgLevel = filteredData.reduce((sum, item) => sum + item.avg_level, 0) / filteredData.length
    
    if (avgLevel <= 1.5) return { level: 'low', value: avgLevel }
    if (avgLevel <= 2.5) return { level: 'medium', value: avgLevel }
    return { level: 'high', value: avgLevel }
  }

  const getCellClass = (cellData) => {
    if (!cellData) return 'bg-gray-900 text-gray-600'
    
    switch (cellData.level) {
      case 'low': return 'bg-green-900 text-green-300 hover:bg-green-800'
      case 'medium': return 'bg-yellow-900 text-yellow-300 hover:bg-yellow-800'
      case 'high': return 'bg-red-900 text-red-300 hover:bg-red-800'
      default: return 'bg-gray-900 text-gray-600'
    }
  }

  const getCellText = (cellData) => {
    if (!cellData) return '—'
    return cellData.level.charAt(0).toUpperCase() + cellData.level.slice(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-white mb-8">Peak Hours Heatmap 🔥</h1>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-48 mb-8"></div>
            <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
              <div className="grid grid-cols-8 gap-2">
                {[...Array(8 * 17)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Peak Hours Heatmap 🔥
          </h1>
          <div className="mt-4">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-[#13131a] text-white border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-indigo-500"
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location === 'all' ? 'All Locations' : location}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800 mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-gray-400 text-sm font-medium p-2 text-right">Hour</th>
                  {days.map((day) => (
                    <th key={day} className="text-gray-400 text-sm font-medium p-2 text-center">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map((hour) => (
                  <tr key={hour}>
                    <td className="text-gray-400 text-sm p-2 text-right font-mono">
                      {hour}:00
                    </td>
                    {days.map((day) => {
                      const cellData = getCellData(days.indexOf(day), hour)
                      return (
                        <td key={`${day}-${hour}`} className="p-1">
                          <div
                            className={`h-10 flex items-center justify-center rounded text-xs font-medium transition-all duration-200 cursor-pointer ${getCellClass(cellData)}`}
                          >
                            {getCellText(cellData)}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Legend</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-900 rounded border border-green-700"></div>
              <span className="text-gray-300 text-sm">Low Crowd (≤10 people)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-yellow-900 rounded border border-yellow-700"></div>
              <span className="text-gray-300 text-sm">Medium Crowd (11-25 people)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-900 rounded border border-red-700"></div>
              <span className="text-gray-300 text-sm">High Crowd (26+ people)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-900 rounded border border-gray-700"></div>
              <span className="text-gray-300 text-sm">No Data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Heatmap
