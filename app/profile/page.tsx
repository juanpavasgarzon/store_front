import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = { title: 'Mi perfil' };

export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <ProfileClient />
    </>
  );
}
