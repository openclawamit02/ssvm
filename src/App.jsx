import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directory';
import { Fees, Attendance, Classes } from './pages/Placeholders';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="directory" element={<Directory />} />
          <Route path="fees" element={<Fees />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="classes" element={<Classes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
