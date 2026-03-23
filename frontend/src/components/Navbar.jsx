import { Link, useLocation } from 'react-router-dom'
import { Brain } from 'lucide-react'

const Navbar = () => {
  const location = useLocation()
  
  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Heatmap', path: '/heatmap' },
    { name: 'History', path: '/history' },
    { name: 'Weekly Report', path: '/weekly-report' },
    { name: 'Admin', path: '/admin' }
  ]

  return (
    <nav className="bg-[#0a0a0f] border-b border-[#1f1f2e] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-white font-bold text-xl">
          <Brain className="w-6 h-6 text-indigo-500" />
          <span>Rushless AI</span>
        </Link>
        
        <div className="flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors duration-200 ${
                location.pathname === item.path
                  ? 'text-indigo-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
