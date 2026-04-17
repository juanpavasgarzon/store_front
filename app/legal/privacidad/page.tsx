import type { Metadata } from 'next';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata: Metadata = { title: 'Política de privacidad' };

export default function PrivacidadPage() {
  return (
    <>
      <Navbar />
      <main className="container-wide py-16 px-6 flex-1">
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">
            Legal
          </p>
          <h1
            className="font-light mb-2"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)' }}
          >
            Política de privacidad
          </h1>
          <p className="text-muted-foreground text-[13px] mb-12">
            Última actualización: abril de 2025
          </p>

          <div className="legal-body">

            <section>
              <h2>1. Responsable del tratamiento</h2>
              <p>
                <strong>Pavas Marketplace</strong> es responsable del tratamiento de los datos personales que los usuarios proporcionan al utilizar la Plataforma. Nos comprometemos a proteger tu privacidad y a tratar tus datos conforme a la <strong>Ley 1581 de 2012</strong> (Ley de Protección de Datos Personales de Colombia) y sus decretos reglamentarios.
              </p>
            </section>

            <section>
              <h2>2. Datos que recopilamos</h2>
              <p>Recopilamos los siguientes tipos de información:</p>
              <ul>
                <li><strong>Datos de registro:</strong> nombre completo, correo electrónico y contraseña (almacenada de forma cifrada).</li>
                <li><strong>Datos de perfil:</strong> número de teléfono y ciudad, proporcionados de forma opcional.</li>
                <li><strong>Contenido publicado:</strong> anuncios, fotos, descripciones, atributos, precios y categorías.</li>
                <li><strong>Datos de uso:</strong> páginas visitadas, búsquedas realizadas, anuncios vistos y marcados como favoritos.</li>
                <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo y datos de sesión necesarios para el funcionamiento seguro del servicio.</li>
              </ul>
            </section>

            <section>
              <h2>3. Finalidades del tratamiento</h2>
              <p>Utilizamos tus datos para:</p>
              <ul>
                <li>Gestionar tu cuenta y autenticar tu acceso de forma segura.</li>
                <li>Publicar y mostrar tus anuncios a otros usuarios.</li>
                <li>Facilitar el contacto entre compradores y vendedores.</li>
                <li>Personalizar tu experiencia y mostrarte contenido relevante.</li>
                <li>Enviarte notificaciones relacionadas con tu actividad en la Plataforma (cambios en anuncios, favoritos, etc.).</li>
                <li>Detectar y prevenir actividades fraudulentas o que infrinjan nuestros términos.</li>
                <li>Cumplir con obligaciones legales y responder a requerimientos de autoridades competentes.</li>
                <li>Mejorar la Plataforma mediante análisis agregados y anónimos de uso.</li>
              </ul>
            </section>

            <section>
              <h2>4. Base legal del tratamiento</h2>
              <p>El tratamiento de tus datos personales se realiza sobre la base de:</p>
              <ul>
                <li><strong>Consentimiento:</strong> otorgado al registrarte y aceptar esta política.</li>
                <li><strong>Ejecución del contrato:</strong> necesario para prestarte el servicio.</li>
                <li><strong>Interés legítimo:</strong> prevención del fraude y mejora de la seguridad de la Plataforma.</li>
                <li><strong>Obligación legal:</strong> cuando la ley colombiana así lo exija.</li>
              </ul>
            </section>

            <section>
              <h2>5. Compartición de datos</h2>
              <p>
                No vendemos ni alquilamos tus datos personales a terceros. Podemos compartirlos únicamente en los siguientes supuestos:
              </p>
              <ul>
                <li><strong>Con otros usuarios:</strong> tu nombre y, si lo has proporcionado, tu número de teléfono se muestran en tus anuncios públicos para facilitar el contacto.</li>
                <li><strong>Con proveedores de servicios:</strong> empresas que nos prestan servicios de hosting, almacenamiento de imágenes, análisis o comunicaciones, bajo acuerdos de confidencialidad y con acceso restringido a lo estrictamente necesario.</li>
                <li><strong>Por obligación legal:</strong> cuando una autoridad judicial o administrativa competente lo requiera.</li>
              </ul>
            </section>

            <section>
              <h2>6. Transferencias internacionales</h2>
              <p>
                Algunos de nuestros proveedores de servicios pueden estar ubicados fuera de Colombia. En esos casos nos aseguramos de que existan garantías adecuadas (como cláusulas contractuales estándar) para proteger tus datos conforme a la normativa colombiana.
              </p>
            </section>

            <section>
              <h2>7. Conservación de datos</h2>
              <p>
                Conservamos tus datos personales mientras tu cuenta esté activa y durante el tiempo necesario para cumplir las finalidades descritas en esta política. Cuando solicites la eliminación de tu cuenta, procederemos a borrar o anonimizar tus datos en un plazo máximo de 30 días, salvo que la ley exija su conservación por un período mayor.
              </p>
            </section>

            <section>
              <h2>8. Cookies y tecnologías similares</h2>
              <p>
                La Plataforma utiliza cookies de sesión estrictamente necesarias para mantener tu sesión autenticada y garantizar el funcionamiento seguro del servicio. No utilizamos cookies de rastreo publicitario de terceros. Puedes configurar tu navegador para bloquear o eliminar cookies, aunque esto puede afectar algunas funcionalidades del sitio.
              </p>
            </section>

            <section>
              <h2>9. Tus derechos (ARCO)</h2>
              <p>
                De conformidad con la Ley 1581 de 2012, tienes derecho a:
              </p>
              <ul>
                <li><strong>Acceso:</strong> conocer los datos personales que tenemos sobre ti.</li>
                <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
                <li><strong>Cancelación (supresión):</strong> solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
                <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos para determinadas finalidades.</li>
              </ul>
              <p>
                Puedes ejercer estos derechos directamente desde tu perfil en la Plataforma o enviando una solicitud al correo de contacto indicado en el sitio. Responderemos en un plazo máximo de 15 días hábiles.
              </p>
            </section>

            <section>
              <h2>10. Seguridad</h2>
              <p>
                Implementamos medidas técnicas y organizativas para proteger tus datos contra accesos no autorizados, pérdida, alteración o divulgación. Entre ellas: cifrado de contraseñas, autenticación mediante tokens JWT, comunicaciones cifradas por HTTPS y control de acceso por roles. Sin embargo, ningún sistema es completamente infalible, por lo que te recomendamos mantener segura tu contraseña y cerrar sesión en dispositivos compartidos.
              </p>
            </section>

            <section>
              <h2>11. Menores de edad</h2>
              <p>
                Pavas Marketplace no está dirigida a menores de 18 años. Si detectamos que un menor ha proporcionado datos sin el consentimiento de sus tutores legales, procederemos a eliminar dicha información de forma inmediata.
              </p>
            </section>

            <section>
              <h2>12. Cambios en esta política</h2>
              <p>
                Podemos actualizar esta Política de privacidad periódicamente. Te notificaremos los cambios sustanciales mediante un aviso visible en la Plataforma o por correo electrónico. El uso continuado del servicio tras la publicación de los cambios implica la aceptación de la nueva política.
              </p>
            </section>

            <section>
              <h2>13. Contacto y reclamos</h2>
              <p>
                Si tienes preguntas sobre esta política o deseas ejercer tus derechos, puedes contactarnos a través del correo de atención al usuario disponible en la Plataforma. Si consideras que tu derecho a la protección de datos ha sido vulnerado, puedes presentar una reclamación ante la <strong>Superintendencia de Industria y Comercio (SIC)</strong> de Colombia.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
