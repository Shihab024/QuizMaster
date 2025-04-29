// src/components/Login.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await axios.post(`${process.env.REACT_APP_API_URL}/api/users/login`, {
        firebaseUID: user.uid,
        email: user.email,
        name: user.displayName || 'User'
      });

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        toast.error('User not found. Please check your email or register for a new account.');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email format. Please check your email address.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed login attempts. Please try again later.');
      } else {
        toast.error(`Login failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E2A47] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-[#1E2A47] rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-semibold text-white text-center mb-6">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-[#3B82F6] text-white py-2 px-4 rounded-md hover:bg-[#2563EB] transition duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            disabled={isLoading}
            className="w-full mt-3 text-gray-300 text-center hover:text-gray-100 transition duration-200"
          >
            Don't have an account? Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;