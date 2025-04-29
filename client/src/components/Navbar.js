"use client"

import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { signOut, onAuthStateChanged } from "firebase/auth"
import { Menu, X, User, LogOut, Brain, Plus, LayoutDashboard, ChevronDown, LogIn, UserPlus } from "lucide-react"

const Navbar = () => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsAuthenticated(!!currentUser)
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Handle click outside to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    setIsDropdownOpen(false)
    navigate("/")
  }

  // Get display name or fall back to email or 'User'
  const displayName = user?.displayName || user?.email?.split("@")[0] || "User"

  return (
    <nav className="bg-blue-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="flex-shrink-0 flex items-center">
              <span className="text-white text-xl font-bold">
                Quiz<span className="text-red-500">Master</span>
              </span>
            </a>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <a
              href="/create-quiz"
              className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Quiz
            </a>
            <a
              href="/ai-quiz"
              className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200"
            >
              <Brain className="h-4 w-4 mr-1" />
              AI Quiz
            </a>

            {isAuthenticated ? (
              <>
                <a
                  href="/dashboard"
                  className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200"
                >
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Dashboard
                </a>

                {/* Profile dropdown */}
                <div className="relative ml-3" ref={dropdownRef}>
                  <button
                    type="button"
                    className="flex items-center text-sm text-white hover:bg-blue-700 px-3 py-2 rounded-md font-medium transition-colors duration-200"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <User className="h-4 w-4 mr-1" />
                    {displayName}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>

                  {isDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 divide-y divide-gray-100">
                      <div className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">Welcome!</p>
                        <p className="text-sm text-gray-500 truncate">{user?.email || "No email"}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <LogOut className="h-4 w-4 mr-2 text-gray-500" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Login/Signup dropdown */}
                <div className="relative ml-3" ref={dropdownRef}>
                  <button
                    type="button"
                    className="flex items-center text-sm text-white hover:bg-blue-700 px-3 py-2 rounded-md font-medium transition-colors duration-200"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <User className="h-4 w-4 mr-1" />
                    Account
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>

                  {isDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        <a
                          href="/login"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <LogIn className="h-4 w-4 mr-2 text-gray-500" />
                          Login
                        </a>
                        <a
                          href="/register"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <UserPlus className="h-4 w-4 mr-2 text-gray-500" />
                          Signup
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a
              href="/create-quiz"
              className="text-white hover:bg-blue-700 no-underline block px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2no-underline" />
              Create Quiz
            </a>
            <a
              href="/ai-quiz"
              className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors duration-200"
            >
              <Brain className="h-5 w-5 mr-2 no-underline" />
              AI Quiz
            </a>

            {isAuthenticated ? (
              <>
                <a
                  href="/dashboard"
                  className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors duration-200"
                >
                  <LayoutDashboard className="h-5 w-5 mr-2 no-underline" />
                  Dashboard
                </a>
                <div className="border-t border-blue-700 my-2"></div>
                <div className="px-3 py-2 text-white">
                  <p className="text-sm">Signed in as:</p>
                  <p className="font-medium">{user?.email || "No email"}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-white hover:bg-blue-700 w-fullno-underline text-left block px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="text-white hover:bg-blue-700 block no-underline px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors duration-200"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Login
                </a>
                <a
                  href="/register"
                  className="text-white hover:bg-blue-700 block no-underline px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors duration-200"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Signup
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
