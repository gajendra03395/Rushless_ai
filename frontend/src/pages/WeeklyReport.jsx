import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Clock, Calendar, Users } from 'lucide-react'
import api from '../api/axios'

const WeeklyReport = () => {
  const [weeklyData, setWeeklyData] = useState(null)
  const [loading, setLoading] = useState(true)

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  useEffect(() => {
    fetchWeeklyReport()
  }, [])

  const fetchWeeklyReport = async () => {
    try {
      const response = await api.get('/weekly-report')
      setWeeklyData(response.data)
    } catch (error) {
      console.error('Failed to fetch weekly report:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSummaryStats = () => {
    if (!weeklyData) return {}

    const mostCrowded = weeklyData.most_crowded?.[0] || {}
    const busiestDay = weeklyData.weekly_data?.reduce((max, curr) => 
      curr.avg_level > (max?.avg_level || 0) ? curr : max, {}
    )
    const peakHour = weeklyData.weekly_data?.reduce((max, curr) => 
      curr.avg_count > (max?.avg_count || 0) ? curr : max, {}
    )
    const totalUploads = weeklyData.weekly_data?.length || 0

    return {
      mostCrowdedLocation: mostCrowded.location || 'N/A',
      busiestDay: days[busiestDay.day] || 'N/A',
      peakHour: 'N/A', // Would need more detailed data for this
      totalUploads
    }
  }

  const getDailyChartData = () => {
    if (!weeklyData?.weekly_data) return []

    const dailyAverages = days.map((day, index) => {
      const dayData = weeklyData.weekly_data.filter(item => item.day === index)
      if (dayData.length === 0) return { day: dayShort[index], avgLevel: 0 }
      
      const avgLevel = dayData.reduce((sum, item) => sum + item.avg_level, 0) / dayData.length
      return { day: dayShort[index], avgLevel: parseFloat(avgLevel.toFixed(2)) }
    })

    return dailyAverages
  }

  const getLocationStats = () => {
    if (!weeklyData?.weekly_data || !weeklyData?.quietest_hours) return []

    const locations = [...new Set(weeklyData.weekly_data.map(item => item.location))]
    
    return locations.map(location => {
      const locationData = weeklyData.weekly_data.filter(item => item.location === location)
      const quietestHour = weeklyData.quietest_hours.find(item => item.location === location)
      
      const peakHour = locationData.reduce((max, curr) => 
        curr.avg_count > (max?.avg_count || 0) ? curr : max, {}
      )

      return {
        name: location,
        quietestHour: quietestHour?.quietest_hour || 'N/A',
        peakHour: `${peakHour.hour}:00`,
        weeklyPattern: locationData.map(item => item.avg_level)
      }
    })
  }

  const stats = getSummaryStats()
  const dailyChartData = getDailyChartData()
  const locationStats = getLocationStats()

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-[#1a1a2e] p-3 rounded border border-gray-700">
          <p className="text-white font-medium">{payload[0].payload.day}</p>
          <p className="text-gray-300 text-sm">Avg Level: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-white mb-8">Weekly Report 📈</h1>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#13131a] rounded-lg p-6 border border-gray-800 h-24"></div>
              ))}
            </div>
            <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800 h-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#13131a] rounded-lg p-6 border border-gray-800 h-32"></div>
              ))}
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
            Weekly Report 📈
          </h1>
          <p className="text-gray-400 text-lg">
            Auto-generated crowd intelligence report
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              <span className="text-gray-400 text-sm">Most Crowded Location</span>
            </div>
            <div className="text-xl font-bold text-white">{stats.mostCrowdedLocation}</div>
          </div>

          <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <span className="text-gray-400 text-sm">Busiest Day Overall</span>
            </div>
            <div className="text-xl font-bold text-white">{stats.busiestDay}</div>
          </div>

          <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center space-x-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-400 text-sm">Peak Hour Overall</span>
            </div>
            <div className="text-xl font-bold text-white">{stats.peakHour}</div>
          </div>

          <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <span className="text-gray-400 text-sm">Total Uploads This Week</span>
            </div>
            <div className="text-xl font-bold text-white">{stats.totalUploads}</div>
          </div>
        </div>

        <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800 mb-8">
          <h3 className="text-xl font-semibold text-white mb-6">Crowd by Day of Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="day" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                domain={[0, 3]}
                ticks={[0, 1, 2, 3]}
                tickFormatter={(value) => ['Low', 'Medium', 'High', 'Very High'][value] || ''}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="avgLevel" 
                fill="#6366F1"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-white mb-6">Per Location Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locationStats.map((location) => (
              <div key={location.name} className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
                <h4 className="text-lg font-semibold text-white mb-4">{location.name}</h4>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quietest Hour:</span>
                    <span className="text-green-400 font-medium">{location.quietestHour}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Peak Hour:</span>
                    <span className="text-red-400 font-medium">{location.peakHour}</span>
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-gray-400 text-sm">Weekly Pattern:</span>
                </div>
                <div className="flex space-x-1">
                  {location.weeklyPattern.map((level, index) => (
                    <div
                      key={index}
                      className={`flex-1 h-2 rounded ${
                        level <= 1.5 ? 'bg-green-600' :
                        level <= 2.5 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      title={`${dayShort[index]}: Level ${level.toFixed(1)}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeeklyReport
