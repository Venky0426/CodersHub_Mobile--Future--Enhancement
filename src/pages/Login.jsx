import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/home');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@cambridge\.edu\.in$/i;
    if (!email || !emailRegex.test(email)) {
      setMessage({ 
        type: 'error', 
        text: 'Please enter your valid Cambridge email address (e.g., name@cambridge.edu.in) first in the email field, then click "Forgot password?".' 
      });
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ 
        type: 'success', 
        text: `A password reset link has been successfully sent to ${email}! Please check your email inbox (and spam folder) to reset your password.` 
      });
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMsg = 'Failed to send password reset email. Please verify the email is registered.';
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'This email address is not registered in our system. Please sign up first!';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'The email address is invalid. Please double check.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const emailRegex = /^[a-zA-Z0-9._%+-]+@cambridge\.edu\.in$/i;
    if (!emailRegex.test(email)) {
      setMessage({ 
        type: 'error', 
        text: 'Please use a valid Cambridge email (e.g., name@cambridge.edu.in)' 
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (error) {
      console.error(error);
      let errorMsg = 'Invalid email or password! Please make sure your credentials are correct, or sign up if you do not have an account.';
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'This email is not registered yet. Please sign up first!';
      } else if (error.code === 'auth/wrong-password') {
        errorMsg = 'Incorrect password. Please try again.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-8 left-8">
          <div className="flex items-center gap-2 text-3xl font-bold text-linkedin-blue">
            <img src="/events/CodersHubLogo.png" className="w-10 h-10 object-contain" alt="Logo" />
            <h1>CodersHub</h1>
          </div>
          <p className="text-gray-600 mt-2 font-medium">Connect. Build. Innovate.</p>
        </div>
        <div className="z-10 max-w-lg text-center mt-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            Where Developers Meet Their Future Team.
          </h2>
          <img
            src="https://illustrations.popsy.co/amber/remote-work.svg"
            alt="Developers collaborating"
            className="w-full h-auto max-w-md mx-auto"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex flex-col items-center text-center mb-10">
            <div className="flex items-center gap-2 text-3xl font-bold text-linkedin-blue">
              <img src="/events/CodersHubLogo.png" className="w-10 h-10 object-contain" alt="Logo" />
              <h1>CodersHub</h1>
            </div>
            <p className="text-gray-600 mt-2">Connect. Build. Innovate.</p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Sign in</h2>

            {/* Premium Message Banner */}
            {message.text && (
              <div className={`p-4 mb-6 rounded-lg text-xs font-semibold border leading-relaxed animate-fade-in ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin-blue focus:border-transparent outline-none transition-all text-sm text-gray-900"
                  placeholder="name@cambridge.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-xs font-semibold text-linkedin-blue hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                  >
                    {resetLoading ? 'Sending link...' : 'Forgot password?'}
                  </button>
                </div>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin-blue focus:border-transparent outline-none transition-all text-sm text-gray-900"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-linkedin-blue text-white py-2.5 rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer text-sm"
              >
                Sign in
              </button>
            </form>

          </div>

          <p className="text-center text-sm text-gray-600 mt-8">
            New to CodersHub?{' '}
            <Link to="/setup-profile" className="font-semibold text-linkedin-blue hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
