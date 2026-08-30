import React from 'react';
import { AppProvider } from './context/AppContext';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';

function App() {
  return (
    <AppProvider>
      <MainLayout>
        <HomePage />
      </MainLayout>
    </AppProvider>
  );
}

export default App;
