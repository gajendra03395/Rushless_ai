import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Users, Clock, Upload, RefreshCw } from 'lucide-react'
import api from '../api/axios'
import Toast from '../components/Toast'

const Admin = () => {
  const [error, setError] = useState(null)
  const [locations, setLocations] = useState([])
  const [newLocation, setNewLocation] = useState({ name: '', description: '' })
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedCrowdLevel, setSelectedCrowdLevel] = useState('')
  const [systemStats, setSystemStats] = useState({})
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  console.log('Admin component rendering, locations:', locations, 'systemStats:', systemStats)

  useEffect(() => {
    fetchLocations()
    fetchSystemStats()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations')
      setLocations(response.data.locations || [])
      if (response.data.locations?.length > 0 && !selectedLocation) {
        setSelectedLocation(response.data.locations[0].name)
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
      showToast('Failed to fetch locations', 'error')
    }
  }

  const fetchSystemStats = async () => {
    try {
      const [historyResponse, locationsResponse] = await Promise.all([
        api.get('/history'),
        api.get('/locations')
      ])
      
      const history = historyResponse.data?.history || []
      const locationCounts = history.reduce((acc, item) => {
        acc[item.location] = (acc[item.location] || 0) + 1
        return acc
      }, {})
      
      const mostActiveLocation = Object.entries(locationCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
      
      const lastUpload = history.length > 0 ? 
        new Date(history[0].timestamp).toLocaleString() : 'No uploads yet'

      setSystemStats({
        totalUploads: history.length,
        mostActiveLocation,
        lastUpload
      })
    } catch (error) {
      console.error('Failed to fetch system stats:', error)
      setError('Failed to fetch system stats')
    }
  }

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAddLocation = async () => {
    if (!newLocation.name.trim()) {
      showToast('Location name is required', 'error')
      return
    }

    setLoading(true)
    try {
      await api.post('/locations', newLocation)
      setNewLocation({ name: '', description: '' })
      fetchLocations()
      showToast('Location added successfully', 'success')
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to add location', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLocation = async (locationName) => {
    if (!confirm(`Are you sure you want to delete "${locationName}"?`)) return

    try {
      await api.delete(`/locations/${locationName}`)
      fetchLocations()
      fetchSystemStats()
      showToast('Location deleted successfully', 'success')
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to delete location', 'error')
    }
  }

  const handleOverrideCrowd = async () => {
    if (!selectedLocation || !selectedCrowdLevel) {
      showToast('Please select location and crowd level', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await api.put(`/crowd/${selectedLocation}`, { crowd_level: selectedCrowdLevel })
      
      // Store last override timestamp in localStorage
      localStorage.setItem('last_override', Date.now().toString())
      
      // Show success toast with recommendation from response
      showToast(`✅ ${response.data.message}`, 'success')
      
      // Dispatch custom event for Dashboard
      window.dispatchEvent(new CustomEvent('crowdOverride', {detail: response.data}))
      
      fetchSystemStats()
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to apply crowd override', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRetrainModel = async () => {
    setLoading(true)
    try {
      const response = await api.post('/retrain')
      showToast(`✅ Model retrained with ${response.data.records_used}`, 'success')
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to retrain model', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Add error boundary at top of return
  if (error) return <div className="text-red-400 p-8">Error loading admin panel: {error}</div>

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">
          Admin Panel ⚙️
        </h1>

        {toast && <Toast message={toast.message} type={toast.type} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Manage Locations */}
          <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-6">Manage Locations</h2>
            
            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Location name"
                value={newLocation.name}
                onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-[#0a0a0f] text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Description"
                value={newLocation.description}
                onChange={(e) => setNewLocation(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-[#0a0a0f] text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddLocation}
                disabled={loading}
                className="w-full bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {locations?.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded border border-gray-700">
                  <div>
                    <div className="text-white font-medium">{location.name}</div>
                    <div className="text-gray-400 text-sm">{location.description}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteLocation(location.name)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Crowd Override */}
          <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-6">Manual Crowd Override</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-[#0a0a0f] text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                {locations?.map((location) => (
                  <option key={location.name} value={location.name}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Crowd Level</label>
              <div className="grid grid-cols-3 gap-3">
                {['low', 'medium', 'high'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedCrowdLevel(level)}
                    className={`p-3 rounded border-2 transition-all ${
                      selectedCrowdLevel === level
                        ? 'border-indigo-500 bg-indigo-600/20'
                        : 'border-gray-700 bg-[#0a0a0f] hover:border-gray-600'
                    }`}
                  >
                    <div className={`text-lg font-medium capitalize ${
                      level === 'low' ? 'text-green-400' :
                      level === 'medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {level === 'low' ? '🟢' : level === 'medium' ? '🟡' : '🔴'}
                    </div>
                    <div className="text-white text-sm capitalize mt-1">{level}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleOverrideCrowd}
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Override
            </button>
          </div>

          {/* System Stats */}
          <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-6">System Stats</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-[#0a0a0f] rounded border border-gray-700">
                <Upload className="w-5 h-5 text-indigo-500" />
                <div>
                  <div className="text-gray-400 text-sm">Total Uploads</div>
                  <div className="text-white font-medium">{systemStats.totalUploads || 0}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-[#0a0a0f] rounded border border-gray-700">
                <Users className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-gray-400 text-sm">Most Active Location</div>
                  <div className="text-white font-medium">{systemStats.mostActiveLocation || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-[#0a0a0f] rounded border border-gray-700">
                <Clock className="w-5 h-5 text-yellow-500" />
                <div>
                  <div className="text-gray-400 text-sm">Last Upload</div>
                  <div className="text-white font-medium text-sm">{systemStats.lastUpload || 'No uploads yet'}</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleRetrainModel}
              className="w-full mt-6 bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retrain Model
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin
