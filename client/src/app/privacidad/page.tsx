import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidad | InduMex',
  description:
    'Aviso de Privacidad de indumex.blog. Conoce cómo tratamos tus datos personales, tus derechos ARCO y el uso de cookies conforme a la LFPDPPP.',
  openGraph: {
    title: 'Política de Privacidad | InduMex',
    description: 'Aviso de Privacidad de indumex.blog conforme a la legislación mexicana.',
    url: 'https://indumex.blog/privacidad',
    siteName: 'InduMex',
    locale: 'es_MX',
    type: 'website',
  },
  alternates: { canonical: 'https://indumex.blog/privacidad' },
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl font-bold text-white mt-10 mb-4 pb-2 border-b border-white/10">
    {children}
  </h2>
);

const SubTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-base font-semibold text-[#F58634] mt-6 mb-3">{children}</h3>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-white/60 text-sm leading-relaxed mb-4">{children}</p>
);

const Li = ({ children }: { children: React.ReactNode }) => (
  <li className="text-white/60 text-sm leading-relaxed">{children}</li>
);

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-900">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-12">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#F58634] mb-4">
            <span className="w-6 h-px bg-[#F58634]" />
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3">
            Política de Privacidad
          </h1>
          <p className="text-sm text-white/40">Última actualización: 02 de Octubre del 2025</p>
        </div>
      </section>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-6 py-14">
        {/* 1 */}
        <SectionTitle>1. Identidad y Domicilio del Responsable</SectionTitle>
        <P>
          <strong className="text-white">INDUMEX</strong> (en adelante &quot;El Responsable&quot; o
          &quot;nosotros&quot;) es el responsable del tratamiento y protección de sus datos personales.
        </P>
        <P>
          <strong className="text-white">Domicilio:</strong> El Marqués, Querétaro, México.{' '}
          <strong className="text-white">Correo de Contacto:</strong>{' '}
          <a href="mailto:contacto@indumex.blog" className="text-[#F58634] hover:underline">
            contacto@indumex.blog
          </a>{' '}
          (Este es el medio exclusivo para cualquier duda o solicitud relacionada con esta Política).
        </P>

        {/* 2 */}
        <SectionTitle>2. Datos Personales que Recabamos</SectionTitle>
        <P>
          Para los fines establecidos en esta Política, podemos recabar los siguientes datos
          personales:
        </P>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white/50 font-semibold uppercase tracking-widest text-xs">
                  Categoría de Datos
                </th>
                <th className="text-left py-3 px-4 text-white/50 font-semibold uppercase tracking-widest text-xs">
                  Ejemplos
                </th>
                <th className="text-left py-3 px-4 text-white/50 font-semibold uppercase tracking-widest text-xs">
                  Fines Asociados
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                ['Identificación y Contacto', 'Nombre completo, correo electrónico.', 'Suscripción al blog, respuesta a consultas.'],
                ['Ventas y Negocio', 'Nombre de la empresa, cargo, teléfono.', 'Cotizaciones, seguimiento de ventas, atención a distribuidores.'],
                ['Facturación y Transacción', 'Domicilio fiscal, RFC.', 'Procesamiento de pedidos de software y equipo, emisión de facturas (CFDI).'],
                ['Navegación y Uso', 'Dirección IP, tipo de navegador, sistema operativo, páginas visitadas, tiempo de permanencia.', 'Análisis y mejora de la web (a través de cookies).'],
              ].map(([cat, ejemplos, fines]) => (
                <tr key={cat}>
                  <td className="py-3 px-4 text-white font-medium">{cat}</td>
                  <td className="py-3 px-4 text-white/60">{ejemplos}</td>
                  <td className="py-3 px-4 text-white/60">{fines}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[#004AAD]/5 border border-[#004AAD]/20 rounded-xl px-5 py-4 mb-6">
          <P>
            <strong className="text-white">Nota Importante:</strong> No recabamos datos personales
            sensibles (como origen racial o étnico, estado de salud, creencias religiosas, etc.). En
            el caso de transacciones de pago, la información sensible de tarjetas es procesada
            directamente por plataformas de pago seguras y no es almacenada por indumex.blog.
          </P>
        </div>

        {/* 3 */}
        <SectionTitle>3. Fines del Tratamiento de los Datos Personales</SectionTitle>
        <P>Sus datos personales serán utilizados para las siguientes finalidades:</P>

        <SubTitle>A. Finalidades Primarias (Necesarias para la operación y servicio)</SubTitle>
        <ul className="list-disc list-inside space-y-2 mb-6 pl-1">
          <Li><strong className="text-white">Venta y Entrega:</strong> Procesar, completar y dar seguimiento a sus pedidos de equipo de control y software industrial.</Li>
          <Li><strong className="text-white">Facturación:</strong> Emitir las facturas electrónicas (CFDI) correspondientes a sus compras, conforme a la legislación fiscal mexicana.</Li>
          <Li><strong className="text-white">Soporte:</strong> Atender y gestionar sus solicitudes de cotización, soporte técnico, garantías o información sobre los productos.</Li>
          <Li><strong className="text-white">Comunicaciones Esenciales:</strong> Enviarle notificaciones relacionadas con su compra, el estado de su pedido o cambios en los términos y condiciones.</Li>
        </ul>

        <SubTitle>B. Finalidades Secundarias (No necesarias, pero que permiten ofrecerle un mejor servicio)</SubTitle>
        <ul className="list-disc list-inside space-y-2 mb-4 pl-1">
          <Li><strong className="text-white">Marketing y Promoción:</strong> Enviarle noticias, promociones o información sobre nuevos equipos, software o servicios de INDUMEX.</Li>
          <Li><strong className="text-white">Encuestas y Calidad:</strong> Realizar encuestas de satisfacción para evaluar la calidad del blog y los productos vendidos.</Li>
          <Li><strong className="text-white">Análisis:</strong> Utilizar los datos de navegación para mejorar el diseño, la usabilidad y los contenidos de indumex.blog.</Li>
        </ul>
        <P>
          Si no desea que sus datos personales sean tratados para una o más de las Finalidades
          Secundarias, puede comunicárnoslo en cualquier momento enviando un correo a{' '}
          <a href="mailto:contacto@indumex.blog" className="text-[#F58634] hover:underline">
            contacto@indumex.blog
          </a>{' '}
          indicando la finalidad que desea rechazar.
        </P>

        {/* 4 */}
        <SectionTitle>4. Uso de Cookies y Tecnologías de Rastreo</SectionTitle>
        <P>
          indumex.blog utiliza cookies, web beacons y otras tecnologías similares para monitorear su
          comportamiento como usuario de internet, brindarle un mejor servicio y experiencia de
          navegación, así como para mejorar la oferta de productos.
        </P>
        <P>Los datos recabados mediante estas tecnologías son principalmente de navegación (IP, dispositivo, páginas visitadas) y se utilizan para:</P>
        <ul className="list-disc list-inside space-y-2 mb-4 pl-1">
          <Li>Medir la audiencia y analizar patrones de uso del sitio.</Li>
          <Li>Recordar sus preferencias y personalizaciones.</Li>
          <Li>Ofrecer publicidad relevante dentro y fuera del blog.</Li>
        </ul>
        <P>
          Usted puede deshabilitar el uso de cookies en la configuración de su navegador web. Sin
          embargo, esto podría afectar algunas funcionalidades del sitio.
        </P>

        {/* 5 */}
        <SectionTitle>5. Transferencia de Datos Personales</SectionTitle>
        <P>
          Sus datos personales pueden ser transferidos dentro de México a las siguientes personas o
          entidades, sin que sea necesario obtener su consentimiento, en virtud del Artículo 37 de la
          LFPDPPP:
        </P>
        <ul className="list-disc list-inside space-y-2 mb-4 pl-1">
          <Li>
            <strong className="text-white">Proveedores de Servicios (Terceros) Indispensables:</strong> Para cumplir con la venta (ej. empresas de mensajería para la entrega de equipos, procesadores de pagos, proveedores de software de facturación).
          </Li>
          <Li>
            <strong className="text-white">Autoridades Competentes:</strong> En casos legalmente previstos o por requerimiento oficial (ej. SAT para temas de facturación).
          </Li>
        </ul>
        <P>Cualquier otra transferencia requerirá de su consentimiento expreso, el cual será solicitado oportunamente.</P>

        {/* 6 */}
        <SectionTitle>6. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)</SectionTitle>
        <P>
          Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos
          y las condiciones del uso que les damos (<strong className="text-white">Acceso</strong>).
          Asimismo, es su derecho solicitar la corrección de su información personal en caso de que
          esté desactualizada, sea inexacta o incompleta (<strong className="text-white">Rectificación</strong>);
          que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no
          está siendo utilizada adecuadamente (<strong className="text-white">Cancelación</strong>);
          así como oponerse al uso de sus datos personales para fines específicos (<strong className="text-white">Oposición</strong>).
        </P>
        <P>Para ejercer cualquiera de sus Derechos ARCO, envíe su solicitud a:</P>
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl px-6 py-5 mb-6">
          <p className="text-[#F58634] font-bold text-sm mb-3">contacto@indumex.blog</p>
          <p className="text-white/50 text-xs mb-2">La solicitud debe contener al menos:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <Li>Nombre completo y correo electrónico para comunicarle la respuesta.</Li>
            <Li>Documentos que acrediten su identidad (copia de identificación oficial vigente).</Li>
            <Li>La descripción clara y precisa del Derecho ARCO que desea ejercer.</Li>
            <Li>Cualquier otro elemento que facilite la localización de sus datos personales.</Li>
          </ul>
          <p className="text-white/40 text-xs mt-4">El Responsable responderá en un plazo máximo de <strong className="text-white">20 días hábiles</strong> a partir de la recepción.</p>
        </div>

        {/* 7 */}
        <SectionTitle>7. Revocación del Consentimiento y Limitación del Uso</SectionTitle>
        <P>
          Usted puede revocar el consentimiento que, en su caso, nos haya otorgado para el tratamiento
          de sus datos personales, o limitar su uso y divulgación, enviando una solicitud a{' '}
          <a href="mailto:contacto@indumex.blog" className="text-[#F58634] hover:underline">
            contacto@indumex.blog
          </a>
          , siguiendo el mismo procedimiento y requisitos establecidos para los Derechos ARCO.
        </P>

        {/* 8 */}
        <SectionTitle>8. Cambios a la Política de Privacidad</SectionTitle>
        <P>
          La presente Política de Privacidad puede sufrir modificaciones, cambios o actualizaciones
          derivadas de nuevos requerimientos legales, de nuestras propias necesidades por los productos
          o servicios que ofrecemos, de nuestras prácticas de privacidad o por otras causas.
        </P>
        <P>
          Nos comprometemos a mantenerlo informado sobre los cambios que pueda sufrir el presente aviso
          de privacidad, a través de una notificación en la página de inicio de indumex.blog y/o al
          correo electrónico que nos haya proporcionado.
        </P>

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-[#F58634] transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </article>
    </div>
  );
}
