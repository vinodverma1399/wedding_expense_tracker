import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-xl w-1/3 min-w-[300px]">
        <h3 className="text-2xl font-bold text-center text-primary">Create an account</h3>
        {error && <div className="text-red-500 text-sm mt-2 text-center">{error}</div>}
        <form onSubmit={submitHandler}>
          <div className="mt-4">
            <div>
              <label className="block" htmlFor="name">Name</label>
              <input type="text" placeholder="Name"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="mt-4">
              <label className="block" htmlFor="email">Email</label>
              <input type="email" placeholder="Email"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="mt-4">
              <label className="block">Password</label>
              <input type="password" placeholder="Password"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="flex items-baseline justify-between">
              <button className="px-6 py-2 mt-4 text-white bg-primary rounded-lg hover:bg-purple-800 w-full transition-colors font-medium">Register</button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account? <Link to="/login" className="text-secondary hover:underline">Login</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
