"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, X } from "lucide-react"

const MobileSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("")
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      onClose()
    }
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 bg-[#0f0f0f] border-b border-[#272727] z-[1001] transition-transform duration-300 ${
        isOpen ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="flex items-center px-4 py-3 gap-2">
        <button onClick={onClose} className="text-gray-300 hover:text-white">
          <X size={20} />
        </button>
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
          <input
            type="text"
            placeholder="Search videos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-[#1c1c1c] text-white text-sm px-4 py-2 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="bg-[#303030] text-white px-3 py-2 rounded-lg hover:bg-[#404040] transition-colors duration-200 flex items-center justify-center"
          >
            <Search size={20} />
          </button>
        </form>
      </div>
    </div>
  )
}

export default MobileSearch
