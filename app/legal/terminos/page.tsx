import type { Metadata } from 'next';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata: Metadata = { title: 'Términos y condiciones' };

export default function TerminosPage() {
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
            Términos y condiciones
          </h1>
          <p className="text-muted-foreground text-[13px] mb-12">
            Última actualización: abril de 2025
          </p>

          <div className="legal-body">

            <section>
              <h2>1. Aceptación de los términos</h2>
              <p>
                Al acceder y utilizar la plataforma <strong>Tienda</strong> (en adelante, "la Plataforma"), aceptas quedar vinculado por estos Términos y condiciones. Si no estás de acuerdo con alguna de las disposiciones aquí contenidas, debes abstenerte de usar la Plataforma.
              </p>
            </section>

            <section>
              <h2>2. Descripción del servicio</h2>
              <p>
                Tienda es una plataforma de clasificados en línea que permite a usuarios registrados publicar anuncios de compra y venta de bienes y servicios, así como contactar a otros usuarios interesados. La Plataforma actúa únicamente como intermediaria y no es parte de las transacciones que se realicen entre compradores y vendedores.
              </p>
            </section>

            <section>
              <h2>3. Registro y cuenta de usuario</h2>
              <p>
                Para publicar anuncios o contactar vendedores debes crear una cuenta proporcionando información veraz, actualizada y completa. Eres responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las actividades realizadas bajo tu cuenta. Notifica de inmediato a Tienda ante cualquier uso no autorizado.
              </p>
            </section>

            <section>
              <h2>4. Publicación de anuncios</h2>
              <p>
                Al publicar un anuncio declaras que:</p>
              <ul>
                <li>Eres el propietario del bien o tienes autorización para ofrecerlo.</li>
                <li>La información, fotos y precio son verídicos y no inducen a error.</li>
                <li>El artículo o servicio no infringe derechos de terceros ni normativas vigentes.</li>
              </ul>
              <p>
                Queda <strong>expresamente prohibida</strong> la publicación de anuncios que contengan o promuevan: artículos ilegales, sustancias controladas, armas, material para adultos, piratería, estafas o cualquier actividad que contravenga la ley colombiana o los presentes términos.
              </p>
              <p>
                Tienda se reserva el derecho de eliminar cualquier anuncio que incumpla estas condiciones sin previo aviso ni reembolso.
              </p>
            </section>

            <section>
              <h2>5. Transacciones y pagos</h2>
              <p>
                Tienda no procesa pagos ni garantiza el cumplimiento de las transacciones entre usuarios. El precio, forma de pago y entrega son acordados directamente entre comprador y vendedor. Recomendamos utilizar métodos de pago seguros y verificar la identidad de la contraparte antes de efectuar cualquier transacción.
              </p>
            </section>

            <section>
              <h2>6. Conducta del usuario</h2>
              <p>Los usuarios se comprometen a:</p>
              <ul>
                <li>No usar la Plataforma con fines fraudulentos o ilegales.</li>
                <li>No acosar, amenazar ni discriminar a otros usuarios.</li>
                <li>No enviar spam, mensajes masivos no solicitados ni contenido malicioso.</li>
                <li>No intentar vulnerar la seguridad de la Plataforma o acceder a datos de terceros sin autorización.</li>
              </ul>
            </section>

            <section>
              <h2>7. Propiedad intelectual</h2>
              <p>
                Todo el contenido de la Plataforma (diseño, código, marca, textos e imágenes propias de Tienda) es propiedad exclusiva de Tienda y está protegido por las leyes de propiedad intelectual aplicables. Los usuarios conservan los derechos sobre el contenido que publican, pero otorgan a Tienda una licencia no exclusiva para mostrarlo, indexarlo y distribuirlo dentro de la Plataforma.
              </p>
            </section>

            <section>
              <h2>8. Limitación de responsabilidad</h2>
              <p>
                Tienda no se hace responsable de:</p>
              <ul>
                <li>La veracidad del contenido publicado por los usuarios.</li>
                <li>El resultado de las transacciones realizadas entre usuarios.</li>
                <li>Daños directos, indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso de la Plataforma.</li>
                <li>Interrupciones del servicio por mantenimiento, fallos técnicos o causas de fuerza mayor.</li>
              </ul>
            </section>

            <section>
              <h2>9. Suspensión y cancelación de cuentas</h2>
              <p>
                Tienda podrá suspender o cancelar una cuenta, de forma temporal o definitiva, si detecta incumplimiento de estos términos, actividad fraudulenta o cualquier conducta que ponga en riesgo la integridad de la Plataforma o de otros usuarios.
              </p>
            </section>

            <section>
              <h2>10. Modificaciones</h2>
              <p>
                Tienda se reserva el derecho de actualizar estos Términos en cualquier momento. Los cambios sustanciales serán notificados a los usuarios registrados. El uso continuado de la Plataforma tras la publicación de los cambios constituye aceptación de los nuevos términos.
              </p>
            </section>

            <section>
              <h2>11. Ley aplicable y jurisdicción</h2>
              <p>
                Estos Términos se rigen por las leyes de la República de Colombia. Cualquier controversia que no pueda resolverse de forma amistosa será sometida a los jueces competentes de la ciudad de Bogotá, Colombia, renunciando las partes a cualquier otro fuero que pudiera corresponderles.
              </p>
            </section>

            <section>
              <h2>12. Contacto</h2>
              <p>
                Para cualquier consulta relacionada con estos Términos puedes escribirnos a través del formulario de contacto disponible en la Plataforma o al correo electrónico indicado en el sitio.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
