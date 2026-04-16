import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import FavoritesClient from './FavoritesClient';

export const metadata: Metadata = { title: 'Mis favoritos' };

export default function FavoritesPage() {
  return (
    <>
      <Navbar />
      <FavoritesClient />
    </>
  );
}
