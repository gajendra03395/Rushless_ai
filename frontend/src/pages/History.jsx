import React, { useState, useEffect } from 'react'
import { Users, Filter } from 'lucide-react'
import CrowdBadge from '../components/CrowdBadge'
import api from '../api/axios'

const History = () => {
  const [history, setHistory] = useState([])
  const [filteredHistory, setFilteredHistory] = useState([])
  const [locations, setLocations] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [showingCount, setShowingCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    location: 'all',
    crowdLevel: 'all',
    date: ''
  })
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 20

  useEffect(() => {
    fetchHistory()
    fetchLocations()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [history, filters])

  const fetchHistory = async () => {
    try {
      const response = await api.get('/history?limit=100')
      setHistory(response.data.history)
      setTotalCount(response.data.total_count)
      setShowingCount(response.data.showing)
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations')
      setLocations(response.data.locations)
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...history]

    if (filters.location !== 'all') {
      filtered = filtered.filter(item => item.location === filters.location)
    }

    if (filters.crowdLevel !== 'all') {
      filtered = filtered.filter(item => item.crowd_level === filters.crowdLevel)
    }

    if (filters.date) {
      const filterDate = new Date(filters.date).toDateString()
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp).toDateString()
        return itemDate === filterDate
      })
    }

    setFilteredHistory(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage)

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayName = days[date.getDay()]
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    return `${dayName}, ${time}`
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-white mb-8">Upload History 📋</h1>
          <div className="animate-pulse">
            <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800 mb-6 h-20"></div>
            <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-700 rounded mb-2"></div>
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
            Upload History 📋
          </h1>
          <p className="text-gray-400">
            Showing latest {showingCount} of {totalCount} total entries
          </p>
        </div>

        <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800 mb-6">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-indigo-500 mr-2" />
            <h3 className="text-lg font-semibold text-white">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Location
              </label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full bg-[#0a0a0f] text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Locations</option>
                {locations.map((location) => (
                  <option key={location.name} value={location.name}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Crowd Level
              </label>
              <select
                value={filters.crowdLevel}
                onChange={(e) => handleFilterChange('crowdLevel', e.target.value)}
                className="w-full bg-[#0a0a0f] text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="w-full bg-[#0a0a0f] text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#13131a] rounded-lg border border-gray-800 overflow-hidden">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">
                {history.length === 0 ? 'No upload history found' : 'No entries match your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 font-medium p-4">#</th>
                    <th className="text-left text-gray-400 font-medium p-4">Location</th>
                    <th className="text-left text-gray-400 font-medium p-4">People Count</th>
                    <th className="text-left text-gray-400 font-medium p-4">Crowd Level</th>
                    <th className="text-left text-gray-400 font-medium p-4">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.map((entry, index) => (
                    <tr 
                      key={entry.id} 
                      className={`border-b border-gray-800 ${index % 2 === 0 ? 'bg-[#0a0a0f]' : 'bg-[#13131a]'}`}
                    >
                      <td className="text-gray-400 p-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="text-white p-4 font-medium">{entry.location}</td>
                      <td className="text-gray-300 p-4">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{entry.person_count}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <CrowdBadge level={entry.crowd_level} />
                      </td>
                      <td className="text-gray-400 p-4 text-sm">
                        {formatTime(entry.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default History
