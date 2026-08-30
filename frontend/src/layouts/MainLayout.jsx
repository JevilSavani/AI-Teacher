import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/**
 * MainLayout — used for public-facing pages (HomePage).
 * Includes the Navbar and Footer.
 */
export default function MainLayout({ children }) {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}
