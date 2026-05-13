import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | InduMex',
  description:
    'Términos y Condiciones de uso y venta de indumex.blog. Revisa el alcance del contenido, compra de equipo, devoluciones, garantías y jurisdicción.',
  alternates: {
    canonical: 'https://indumex.blog/terminos-y-condiciones',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Términos y Condiciones | InduMex',
    description:
      'Consulta los Términos y Condiciones de uso y venta de indumex.blog, incluyendo contenido, compras, garantías y devoluciones.',
    url: 'https://indumex.blog/terminos-y-condiciones',
    siteName: 'InduMex',
    locale: 'es_MX',
    type: 'website',
    images: [
      {
        url: 'https://indumex.blog/images/indumex-image.jpg',
        width: 1200,
        height: 630,
        alt: 'InduMex - Plataforma Industrial B2B',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Términos y Condiciones | InduMex',
    description:
      'Consulta los Términos y Condiciones de uso y venta de indumex.blog, incluyendo contenido, compras, garantías y devoluciones.',
    images: ['https://indumex.blog/images/indumex-image.jpg'],
  },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 mb-4 text-2xl font-black tracking-tight text-white">{children}</h2>;
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-sm leading-relaxed text-white/70">{children}</p>;
}

function Item({ children }: { children: React.ReactNode }) {
  return <li className="text-sm leading-relaxed text-white/70">{children}</li>;
}

export default function TerminosYCondicionesPage() {
  return (
    <div className="min-h-screen bg-[#021325] text-slate-200 selection:bg-[#F58634] selection:text-white">
      <section className="border-b border-white/5 pt-40 pb-16 relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #004AAD 0%, transparent 50%)' }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.3em] text-[#F58634]">
            Legal
          </span>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
            Términos y Condiciones
          </h1>
          <p className="mt-5 text-sm text-white/45 md:text-base">
            TÉRMINOS Y CONDICIONES DE USO Y VENTA DE INDUMEX.BLOG
          </p>
          <p className="mt-2 text-sm text-white/40">Fecha de la última actualización: 02 de Octubre del 2025</p>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-6 py-14">
        <SectionTitle>1. Aceptación y Generalidades</SectionTitle>
        <Paragraph>
          Al acceder y utilizar indumex.blog (en adelante, “El Sitio”), usted acepta y se obliga a
          cumplir estos Términos y Condiciones de Uso y Venta, así como la Política de Privacidad. Si
          no está de acuerdo con estos términos, le pedimos no utilizar El Sitio.
        </Paragraph>
        <Paragraph>
          INDUMEX se reserva el derecho de modificar estos T&C en cualquier momento. La versión más
          reciente estará siempre disponible en El Sitio.
        </Paragraph>

        <SectionTitle>2. Uso del Blog y Contenido</SectionTitle>
        <h3 className="mb-2 mt-6 text-lg font-bold text-[#F58634]">2.1 Naturaleza del Contenido</h3>
        <Paragraph>
          El contenido (noticias, análisis, artículos) publicado en El Sitio tiene fines
          exclusivamente informativos y editoriales. El contenido no constituye asesoría técnica, de
          ingeniería, ni legal. Usted es responsable de verificar la idoneidad de cualquier equipo o
          software para sus aplicaciones específicas.
        </Paragraph>
        <h3 className="mb-2 mt-6 text-lg font-bold text-[#F58634]">2.2 Propiedad Intelectual del Blog</h3>
        <Paragraph>
          Todos los contenidos, textos, gráficos, logotipos, íconos, imágenes, clips de audio,
          software y su compilación son propiedad de INDUMEX o de sus proveedores de contenido y están
          protegidos por las leyes de propiedad intelectual mexicanas e internacionales. El uso de
          nuestro contenido sin permiso escrito está estrictamente prohibido.
        </Paragraph>
        <h3 className="mb-2 mt-6 text-lg font-bold text-[#F58634]">2.3 Conducta del Usuario</h3>
        <Paragraph>
          Usted acepta no utilizar El Sitio para fines ilegales o para publicar contenido difamatorio,
          obsceno, amenazante o que viole la propiedad intelectual de terceros. INDUMEX se reserva el
          derecho de eliminar cualquier comentario o contenido que infrinja esta disposición.
        </Paragraph>

        <SectionTitle>3. Condiciones de Venta de Equipo de Control y Software</SectionTitle>
        <h3 className="mb-2 mt-6 text-lg font-bold text-[#F58634]">3.1 Proceso de Compra</h3>
        <Paragraph>
          Para realizar una compra, usted deberá contactar a contacto@indumex.blog para solicitar una
          cotización. La compra se considera formalizada únicamente cuando INDUMEX ha confirmado el
          pedido por escrito y se ha recibido el pago completo o el anticipo acordado.
        </Paragraph>
        <h3 className="mb-2 mt-6 text-lg font-bold text-[#F58634]">3.2 Precios y Disponibilidad</h3>
        <Paragraph>
          <strong className="text-white">Precios:</strong> Los precios de los equipos y software están
          sujetos a cambios sin previo aviso. Los precios cotizados no incluyen el Impuesto al Valor
          Agregado (IVA) ni los costos de envío, a menos que se especifique lo contrario en la
          cotización formal.
        </Paragraph>
        <Paragraph>
          <strong className="text-white">Disponibilidad:</strong> La disponibilidad de equipos de
          control físico está sujeta al inventario del momento de la cotización. INDUMEX no es
          responsable por retrasos o falta de disponibilidad causados por los fabricantes o problemas
          logísticos.
        </Paragraph>
        <h3 className="mb-2 mt-6 text-lg font-bold text-[#F58634]">3.3 Pago y Facturación (CFDI)</h3>
        <Paragraph>
          <strong className="text-white">Métodos de Pago:</strong> Aceptamos [Indicar métodos, ej:
          Transferencia bancaria, depósito]. Los pagos con tarjeta pueden estar sujetos a comisiones
          adicionales.
        </Paragraph>
        <Paragraph>
          <strong className="text-white">Facturación:</strong> Todas las ventas se facturan bajo la
          legislación mexicana vigente. Para obtener su Comprobante Fiscal Digital por Internet
          (CFDI), deberá proporcionar su RFC, Razón Social y Domicilio Fiscal al momento de confirmar
          el pedido. La factura se emitirá una vez confirmado el pago.
        </Paragraph>

        <SectionTitle>4. Entrega, Garantías y Limitación de Responsabilidad</SectionTitle>
        <h3 className="mb-2 mt-6 text-lg font-bold text-[#F58634]">4.1 Envío y Entrega (Equipo Físico)</h3>
        <Paragraph>
          <strong className="text-white">Tiempos:</strong> Los tiempos de entrega son estimados y
          pueden variar. INDUMEX no es responsable por demoras causadas por la empresa de mensajería.
        </Paragraph>
        <Paragraph>
          <strong className="text-white">Riesgo de Pérdida:</strong> El riesgo de pérdida o daño de
          los productos se transmite al cliente en el momento en que INDUMEX entrega el equipo a la
          empresa de mensajería.
        </Paragraph>
        <h3 className="mb-2 mt-6 text-lg font-bold text-[#F58634]">4.2 Entrega y Uso de Software</h3>
        <Paragraph>
          El software se entrega mediante licencia de uso no exclusiva y no transferible. La entrega se
          realiza generalmente por correo electrónico o mediante un enlace de descarga y una clave de
          licencia.
        </Paragraph>
        <Paragraph>
          <strong className="text-white">Propiedad Intelectual del Software:</strong> El software es
          y seguirá siendo propiedad intelectual del fabricante/desarrollador. Usted solo adquiere el
          derecho a usarlo bajo las condiciones de la licencia específica de ese producto.
        </Paragraph>
        <h3 className="mb-2 mt-6 text-lg font-bold text-[#F58634]">4.3 Garantías</h3>
        <Paragraph>
          <strong className="text-white">Equipo de Control:</strong> La garantía es la ofrecida por el
          fabricante. INDUMEX actuará como intermediario para gestionar la garantía durante el periodo
          estipulado (típicamente 12 meses contra defectos de fabricación) y siguiendo el proceso
          establecido por el fabricante. La garantía no aplica por mal uso, negligencia, o instalación
          inadecuada.
        </Paragraph>
        <Paragraph>
          <strong className="text-white">Software:</strong> La garantía se limita a la funcionalidad
          descrita en la documentación técnica del fabricante. No se garantiza que el software esté
          libre de errores o que satisfaga todas sus necesidades específicas.
        </Paragraph>
        <h3 className="mb-2 mt-6 text-lg font-bold text-[#F58634]">4.4 Limitación de Responsabilidad</h3>
        <Paragraph>
          INDUMEX, incluyendo sus directivos, empleados y representantes, no será responsable por
          daños indirectos, incidentales, consecuentes, o especiales derivados del uso o imposibilidad
          de uso del equipo o software adquirido, o del contenido de El Sitio, incluso si se ha
          advertido de la posibilidad de tales daños. La responsabilidad total de INDUMEX se limita,
          en todo caso, al monto pagado por el cliente por el producto o servicio específico que dio
          origen a la reclamación.
        </Paragraph>

        <SectionTitle>5. Política de Devoluciones y Cancelaciones</SectionTitle>
        <h3 className="mb-2 mt-6 text-lg font-bold text-[#F58634]">5.1 Cancelaciones de Pedidos</h3>
        <Paragraph>
          <strong className="text-white">Antes del Envío:</strong> Usted puede cancelar su pedido
          enviando un correo a contacto@indumex.blog. Si el pago ya fue procesado y el equipo no ha
          sido enviado o la licencia de software no ha sido generada, se procederá al reembolso total,
          descontando cualquier comisión bancaria o de plataforma.
        </Paragraph>
        <Paragraph>
          <strong className="text-white">Después del Envío:</strong> No se aceptan cancelaciones una
          vez que el producto físico ha sido entregado a la mensajería o que la licencia de software ha
          sido emitida o enviada.
        </Paragraph>
        <h3 className="mb-2 mt-6 text-lg font-bold text-[#F58634]">5.2 Devoluciones (Equipo Físico)</h3>
        <Paragraph>
          Se aceptan devoluciones de equipos de control únicamente dentro de los 15 días naturales
          posteriores a la recepción, y solo si el producto se encuentra en su empaque original
          sellado, sin usar y en perfectas condiciones para la reventa.
        </Paragraph>
        <Paragraph>
          Si el equipo fue abierto o usado, no se aceptará la devolución. Los costos de envío por
          devolución serán cubiertos por el cliente.
        </Paragraph>
        <h3 className="mb-2 mt-6 text-lg font-bold text-[#F58634]">5.3 Devoluciones (Software)</h3>
        <Paragraph>
          Las licencias de software son productos digitales y, por lo tanto, no son reembolsables una
          vez que han sido emitidas, instaladas o utilizadas, ya que la licencia queda asociada al
          usuario. Solo se procesarán devoluciones si se demuestra que la licencia entregada es inválida
          o el software no funciona de acuerdo a las especificaciones técnicas publicadas por el
          fabricante.
        </Paragraph>

        <SectionTitle>6. Ley Aplicable y Jurisdicción</SectionTitle>
        <Paragraph>
          Estos Términos y Condiciones se rigen e interpretan de acuerdo con las leyes y regulaciones
          de los Estados Unidos Mexicanos.
        </Paragraph>
        <Paragraph>
          Para la interpretación y cumplimiento de estos T&C, INDUMEX y el usuario se someten a la
          jurisdicción exclusiva de los tribunales competentes de la ciudad de Querétaro, Querétaro,
          México, renunciando expresamente a cualquier otro fuero que por razón de sus domicilios
          presentes o futuros pudiera corresponderles.
        </Paragraph>

        <SectionTitle>7. Contacto</SectionTitle>
        <Paragraph>
          Para cualquier pregunta sobre estos Términos y Condiciones, por favor contáctenos a:{' '}
          <a href="mailto:contacto@indumex.blog" className="text-[#F58634] hover:underline">
            contacto@indumex.blog
          </a>
          .
        </Paragraph>

        <div className="mt-12 border-t border-white/10 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 transition-colors hover:text-[#F58634]"
          >
            ← Volver al inicio
          </Link>
        </div>
      </article>
    </div>
  );
}
