import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Clock, Users, TrendingUp, Upload } from 'lucide-react'
import api from '../api/axios'

const Analytics = () => {
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLocations()
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      fetchAnalytics()
    }
  }, [selectedLocation])

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations')
      setLocations(response.data.locations)
      if (response.data.locations.length > 0) {
        setSelectedLocation(response.data.locations[0].name)
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/analytics/${selectedLocation}`)
      setAnalyticsData(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayName = days[date.getDay()]
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    return `${dayName} ${time}`
  }

  // Prepare data for charts
  const lineChartData = analyticsData?.logs.slice(-30).map(log => ({
    timestamp: log.timestamp,
    value: log.person_count
  })) || []

  const barChartData = analyticsData?.hourly_averages.map(hour => ({
    hour: hour.hour,
    value: hour.avg_count,
    fill: hour.avg_count < 11 ? '#10b981' : hour.avg_count <= 25 ? '#f59e0b' : '#ef4444'
  })) || []

  const getStats = () => {
    if (!analyticsData?.hourly_averages) return {}

    const hourlyAverages = analyticsData.hourly_averages
    const peakHour = hourlyAverages.reduce((max, curr) => 
      curr.avg_count > max.avg_count ? curr : max
    )
    const quietestHour = hourlyAverages.reduce((min, curr) => 
      curr.avg_count < min.avg_count ? curr : min
    )
    const averageCount = hourlyAverages.reduce((sum, curr) => sum + curr.avg_count, 0) / hourlyAverages.length

    // Format hours as "2:00 PM"
    const formatHour = (hour) => {
      const period = hour < 12 ? 'AM' : 'PM'
      const displayHour = hour <= 12 ? hour : hour - 12
      return `${displayHour}:00 ${period}`
    }

    return {
      peakHour: formatHour(peakHour.hour),
      quietestHour: formatHour(quietestHour.hour),
      averageCount: Math.round(averageCount),
      totalUploads: analyticsData.logs.length
    }
  }

  const stats = getStats()

  const LineTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-[#1a1a2e] p-3 rounded border border-gray-700">
          <p className="text-white font-medium">{formatTimestamp(payload[0].payload.timestamp)}</p>
          <p className="text-gray-300 text-sm">Count: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  const BarTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-[#1a1a2e] p-3 rounded border border-gray-700">
          <p className="text-white font-medium">{payload[0].payload.hour}:00</p>
          <p className="text-gray-300 text-sm">Avg: {payload[0].value.toFixed(1)} people</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Location Analytics 📊
          </h1>
          <div className="mt-4">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-[#13131a] text-white border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-indigo-500"
            >
              {locations.map((location) => (
                <option key={location.name} value={location.name}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#13131a] rounded-lg p-6 border border-gray-800 h-24"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800 h-96"></div>
              <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800 h-96"></div>
            </div>
          </div>
        ) : analyticsData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center space-x-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  <span className="text-gray-400 text-sm">Peak Hour</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.peakHour}</div>
              </div>

              <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center space-x-3 mb-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  <span className="text-gray-400 text-sm">Quietest Hour</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.quietestHour}</div>
              </div>

              <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-400 text-sm">Average Count</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.averageCount}</div>
              </div>

              <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center space-x-3 mb-2">
                  <Upload className="w-5 h-5 text-purple-500" />
                  <span className="text-gray-400 text-sm">Total Uploads</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalUploads}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-6">People Count Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      tickFormatter={formatTimestamp}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                    <Tooltip content={<LineTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#6366F1" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-6">Hourly Averages</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      tickFormatter={(hour) => {
                        const period = hour < 12 ? 'AM' : 'PM'
                        const displayHour = hour <= 12 ? hour : hour - 12
                        return `${displayHour}${period}`
                      }}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="value" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">Select a location to view analytics</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics
