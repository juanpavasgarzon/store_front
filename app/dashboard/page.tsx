import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = { title: 'Panel' };

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <DashboardClient />
      <Footer />
    </>
  );
}
