import Navbar from '../components/Navbar';
import ListingsClient from './ListingsClient';
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Anuncios' };

export default function ListingsPage() {
  return (
    <>
      <Navbar />
      <Suspense>
        <ListingsClient />
      </Suspense>
    </>
  );
}
