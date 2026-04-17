import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '48px 0 32px', marginTop: 'auto' }}>
      <div className="container-wide">
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', marginBottom: 40, justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 320 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 12 }}>
              <span style={{ color: 'var(--accent)' }}>◆</span> Tienda
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Plataforma de compra y venta segura. Conectamos compradores y vendedores con transparencia, confianza y facilidad.
            </p>
          </div>

          <div>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
              Explorar
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/listings" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>Ver anuncios</Link>
              <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>Mi panel</Link>
              <Link href="/auth/register" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>Crear cuenta</Link>
            </nav>
          </div>

          <div>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
              Legal
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/legal/terminos" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>Términos y condiciones</Link>
              <Link href="/legal/privacidad" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>Política de privacidad</Link>
            </nav>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Tienda. Todos los derechos reservados.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/legal/terminos" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>Términos</Link>
            <Link href="/legal/privacidad" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
