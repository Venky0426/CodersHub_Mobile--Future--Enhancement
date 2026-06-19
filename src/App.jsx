import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import CreateProfile from './pages/CreateProfile';
import Feed from './pages/Feed';
import ConnectStudents from './pages/ConnectStudents';
import Projects from './pages/Projects';
import StartupHub from './pages/StartupHub';
import Messages from './pages/Messages';
import ProfileDashboard from './pages/ProfileDashboard';
import Workshops from './pages/Workshops';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/setup-profile" element={<CreateProfile />} />
        
        <Route element={<Layout />}>
          <Route path="/home" element={<Feed />} />
          <Route path="/connect" element={<ConnectStudents />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/startup-hub" element={<StartupHub />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/workshops" element={<Workshops />} />
          <Route path="/profile" element={<ProfileDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
