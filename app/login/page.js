'use client';
// app/login/page.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  // Don't access localStorage at the top level
  const [role, setRole] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');

  // Access localStorage safely in useEffect
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check if already logged in
    const storedUserData = localStorage.getItem('userData');
    const storedRole = localStorage.getItem('role');
    
    if (storedUserData) {
      // User is already logged in, redirect based on role
      if (storedRole === 'vendor') {
        router.push('/dashboard');
      } else {
        router.push('/search');
      }
    }
    
    // Set role state if it exists
    if (storedRole) {
      setRole(storedRole);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store both user data and phone number separately
      localStorage.setItem('userData', JSON.stringify(data.user));
      localStorage.setItem('userPhoneNumber', phoneNumber); // Store phone number separately
      localStorage.setItem('role', data.user.role); // Store role separately
      localStorage.setItem('isLoggedIn', 'true'); // Set login state for global usage
      
      // Create a properly structured address object for use in ServiceGrid
      // This matches the format expected in ServiceGrid.js
      const addressObject = {
        location: data.user.address || '',
        landmark: data.user.landmark || '',
        // Add any other address fields you have
        houseNumber: data.user.houseNumber || '',
        street: data.user.street || ''
      };
      
      // Store the properly formatted address object
      localStorage.setItem('userAddress', JSON.stringify(addressObject));
      
      // Store individual address components if needed
      if (data.user.address) localStorage.setItem('address', data.user.address);
      if (data.user.landmark) localStorage.setItem('landmark', data.user.landmark);
      
      // Redirect based on role from the API response
      if (data.user.role === "vendor") {
        router.push("/dashboard");
      } else {
        router.push("/search");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-gray-600">Login with your phone number</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="text-center mt-4">
            <span className="text-gray-600">Don&apos;t have an account? </span>
            <Link href="/signup" className="text-black font-semibold hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

