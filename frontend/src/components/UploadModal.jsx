import React, { useState } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import api from '../api/axios'

const UploadModal = ({ isOpen, onClose, location, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await api.post(`/upload/${location}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setResult(response.data)
      if (onUploadComplete) {
        onUploadComplete(response.data)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      setResult({ error: 'Upload failed. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#13131a] rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Upload Photo - {location}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!result ? (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer"
            >
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded mb-4" />
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">Drag & drop an image here</p>
                  <p className="text-gray-500 text-sm mb-4">or</p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded cursor-pointer hover:bg-indigo-700 transition-colors"
              >
                {preview ? 'Choose Different Image' : 'Browse Files'}
              </label>
            </div>

            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            {result.error ? (
              <div className="text-red-400 mb-4">{result.error}</div>
            ) : (
              <>
                <div className="text-green-400 mb-4">✅ Upload Successful!</div>
                <div className="text-white mb-2">
                  <span className="font-semibold">People detected:</span> {result.person_count}
                </div>
                <div className="text-white mb-2">
                  <span className="font-semibold">Crowd level:</span> <CrowdBadge level={result.crowd_level} />
                </div>
                {result.recommendation && (
                  <div className="text-indigo-300 mb-2">
                    <span className="font-semibold">Recommendation:</span> {result.recommendation}
                  </div>
                )}
                {result.best_time_to_visit && (
                  <div className="text-gray-300 mb-4">
                    <span className="font-semibold">Best time to visit:</span> {result.best_time_to_visit}
                  </div>
                )}
              </>
            )}
            <button
              onClick={handleClose}
              className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadModal
