import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import LocationCard from '../components/LocationCard'
import PredictionChart from '../components/PredictionChart'
import AlertBanner from '../components/AlertBanner'

const Dashboard = () => {
  const [locations, setLocations] = useState([])
  const [locationData, setLocationData] = useState({})
  const [selectedLocation, setSelectedLocation] = useState('')
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [lastKnownUpdate, setLastKnownUpdate] = useState(null)

  const triggerRefresh = () => setLastUpdate(Date.now())

  const handleUploadComplete = async (locationName, result) => {
    // Update specific location data immediately
    setLocationData(prev => ({
      ...prev,
      [locationName]: {
        currentLevel: result.crowd_level,
        personCount: result.person_count,
        bestTime: result.best_time_to_visit,
        worstTime: null,
        recommendation: result.recommendation,
        goNow: result.go_now
      }
    }))
    
    // Refresh all data to get latest
    await fetchLocationData()
  }

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations')
      setLocations(response.data.locations)
      if (response.data.locations.length > 0 && !selectedLocation) {
        setSelectedLocation(response.data.locations[0].name)
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  }

  const fetchLocationData = async () => {
    try {
      // Use /crowd/all to fetch all locations in one call
      const response = await api.get('/crowd/all')
      const data = {}
      const newAlerts = []

      for (const location of response.data.locations) {
        data[location.name] = {
          currentLevel: location.crowd_level,
          personCount: location.person_count,
          bestTime: location.best_time,
          worstTime: null,
          recommendation: location.recommendation,
          goNow: location.go_now
        }

        if (location.crowd_level === 'high') {
          newAlerts.push(`⚠️ ${location.name} is currently experiencing high crowd levels`)
        }
      }

      setLocationData(data)
      setAlerts(newAlerts)
    } catch (error) {
      console.error('Failed to fetch location data:', error)
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      await fetchLocations()
      setLoading(false)
    }
    initializeData()
  }, [])

  useEffect(() => {
    if (locations.length > 0) {
      fetchLocationData()
      
      const interval = setInterval(fetchLocationData, 30000)
      return () => clearInterval(interval)
    }
  }, [locations])

  // Polling mechanism for real-time updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/status')
        if (res.data.last_update !== lastKnownUpdate) {
          triggerRefresh()
          setLastKnownUpdate(res.data.last_update)
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [lastKnownUpdate])

  // Listen for crowd override events from Admin
  useEffect(() => {
    const handleCrowdOverride = (e) => {
      triggerRefresh()
    }
    
    window.addEventListener('crowdOverride', handleCrowdOverride)
    return () => window.removeEventListener('crowdOverride', handleCrowdOverride)
  }, [])

  const SkeletonCard = () => (
    <div className="bg-[#13131a] rounded-lg p-6 border border-gray-800 animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
      <div className="space-y-3 mb-6">
        <div className="h-4 bg-gray-700 rounded w-48"></div>
        <div className="h-4 bg-gray-700 rounded w-40"></div>
      </div>
      <div className="flex space-x-3">
        <div className="h-10 bg-gray-700 rounded flex-1"></div>
        <div className="h-10 bg-gray-700 rounded w-24"></div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Rushless AI 🧠
          </h1>
          <p className="text-gray-400 text-lg">
            Smart Campus Crowd Intelligence
          </p>
        </div>

        {alerts.length > 0 && <AlertBanner alerts={alerts} />}

        <div className="mb-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {locations.map((location) => (
                <LocationCard
                  key={location.name}
                  name={location.name}
                  currentLevel={locationData[location.name]?.currentLevel || 'unknown'}
                  personCount={locationData[location.name]?.personCount || 0}
                  bestTime={locationData[location.name]?.bestTime || 'Unknown'}
                  worstTime={locationData[location.name]?.worstTime || null}
                  recommendation={locationData[location.name]?.recommendation || null}
                  goNow={locationData[location.name]?.goNow || false}
                  onUploadComplete={handleUploadComplete}
                  onRefresh={triggerRefresh}
                />
              ))}
            </div>
          )}
        </div>

        {selectedLocation && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white">
                Predictions for {selectedLocation}
              </h2>
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
            <PredictionChart location={selectedLocation} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
