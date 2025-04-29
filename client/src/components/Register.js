// src/components/Register.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await axios.post(`${process.env.REACT_APP_API_URL}/api/users/register`, {
        firebaseUID: user.uid,
        email: user.email,
        name: name
      });

      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Please use a different email or login.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Please use a stronger password.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email format. Please check your email address.');
      } else {
        toast.error(`Registration failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E2A47] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-[#1E2A47] rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-semibold text-white text-center mb-6">Register</h2>
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>
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
            {isLoading ? 'Registering...' : 'Register'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            disabled={isLoading}
            className="w-full mt-3 text-gray-300 text-center hover:text-gray-100 transition duration-200"
          >
            Already have an account? Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;