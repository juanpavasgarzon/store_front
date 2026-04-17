import { notFound } from 'next/navigation';
import { listings } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import EditListingForm from './EditListingForm';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const listing = await listings.get(id);
    return { title: `Editar: ${listing.title}` };
  } catch {
    return { title: 'Editar anuncio' };
  }
}

export default async function EditListingPage({ params }: PageProps) {
  const { id } = await params;

  let listing;
  try {
    listing = await listings.get(id);
  } catch {
    notFound();
  }

  return (
    <>
      <Navbar />

      <div className="container-narrow py-12 px-6 pb-20 flex-1">
        <div className="mb-8">
          <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">
            ANUNCIOS
          </p>
          <h1
            className="font-light"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
            }}
          >
            Editar{' '}
            <em className="italic" style={{ color: 'var(--accent-light)' }}>
              anuncio
            </em>
          </h1>
        </div>

        <EditListingForm listing={listing} />
      </div>
    </>
  );
}
