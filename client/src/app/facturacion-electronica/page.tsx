import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Facturación Electrónica | InduMex',
  description:
    'Consulta la política de facturación electrónica CFDI de InduMex: plazos, requisitos, proceso de emisión, correcciones y contacto.',
  alternates: {
    canonical: 'https://indumex.blog/facturacion-electronica',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Política de Facturación Electrónica | InduMex',
    description:
      'Revisa la política de facturación electrónica CFDI de indumex.blog, incluyendo requisitos, plazos y proceso de emisión.',
    url: 'https://indumex.blog/facturacion-electronica',
    siteName: 'InduMex',
    locale: 'es_MX',
    type: 'website',
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

export default function FacturacionElectronicaPage() {
  return (
    <div className="min-h-screen bg-[#021325] text-slate-200 selection:bg-[#F58634] selection:text-white">
      <section className="relative overflow-hidden border-b border-white/5 pt-40 pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #004AAD 0%, transparent 50%)' }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.3em] text-[#F58634]">
            Legal
          </span>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white md:text-5xl lg:text-6xl">
            Política de Facturación Electrónica
          </h1>
          <p className="mt-5 text-sm text-white/45 md:text-base">
            CFDI para compras de equipo de control y software en InduMex.
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-6 py-14">
        <Paragraph>
          En INDUMEX estamos comprometidos con el cumplimiento de las obligaciones fiscales en México.
          A continuación, detallamos el proceso y los requisitos para la emisión de su Comprobante
          Fiscal Digital por Internet (CFDI).
        </Paragraph>

        <SectionTitle>1. Obligación de Facturación</SectionTitle>
        <Paragraph>
          Todas las ventas de equipo de control y software realizadas a través de INDUMEX serán
          facturadas de conformidad con las leyes fiscales mexicanas vigentes, incluyendo las
          disposiciones del Código Fiscal de la Federación y las Resoluciones Misceláneas Fiscales del
          Servicio de Administración Tributario (SAT).
        </Paragraph>

        <SectionTitle>2. Plazo para la Solicitud</SectionTitle>
        <Paragraph>
          Usted deberá solicitar su CFDI y proporcionar toda la información requerida dentro de un
          plazo máximo de 5 días naturales a partir de la fecha en que se haya realizado el pago de su
          compra. Las solicitudes fuera de este plazo reglamentario podrían no ser procesadas o requerir
          un procedimiento especial.
        </Paragraph>

        <SectionTitle>3. Requisitos de Información (CFDI 4.0)</SectionTitle>
        <Paragraph>
          Para la correcta emisión de su CFDI versión 4.0, es indispensable que nos envíe la siguiente
          documentación e información al correo electrónico{' '}
          <a href="mailto:contacto@indumex.blog" className="text-[#F58634] hover:underline">
            contacto@indumex.blog
          </a>
          :
        </Paragraph>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <Item>
            <strong className="text-white">Constancia de Situación Fiscal (PDF):</strong> Documento
            vigente emitido por el SAT, el cual es necesario para verificar: Razón Social o Nombre
            Completo, RFC (Registro Federal de Contribuyentes), Régimen Fiscal y Domicilio Fiscal
            (Código Postal).
          </Item>
          <Item>
            <strong className="text-white">Uso de CFDI:</strong> Indicar la clave del uso de CFDI
            (ej. G01, I04, P01, etc.) que dará a la factura.
          </Item>
          <Item>
            <strong className="text-white">Correo Electrónico de Envío:</strong> La dirección de correo
            electrónico a la que desea recibir el archivo PDF y XML de su factura.
          </Item>
          <Item>
            <strong className="text-white">Método de Pago:</strong> Especificar el método con el que se
            liquidó la compra (ej. Transferencia electrónica de fondos, Cheque nominativo, Tarjeta de
            débito/crédito, Efectivo).
          </Item>
        </ul>

        <SectionTitle>4. Proceso y Tiempos de Entrega</SectionTitle>
        <Paragraph>
          <strong className="text-white">Recepción:</strong> Una vez recibido el comprobante de pago
          total y la información completa y correcta de facturación a contacto@indumex.blog,
          procederemos a la emisión del CFDI.
        </Paragraph>
        <Paragraph>
          <strong className="text-white">Emisión:</strong> Las facturas serán timbradas y enviadas
          dentro de un plazo de 48 horas hábiles después de haber validado la documentación.
        </Paragraph>
        <Paragraph>
          <strong className="text-white">Confirmación:</strong> La factura se considerará correctamente
          entregada una vez enviada al correo electrónico proporcionado por el cliente. Es
          responsabilidad del cliente revisar su bandeja de entrada y spam.
        </Paragraph>

        <SectionTitle>5. Reglas de Emisión</SectionTitle>
        <Paragraph>
          <strong className="text-white">Factura Global (Venta al Público General):</strong> Si un
          cliente no solicita su factura dentro del plazo establecido o no proporciona la información
          completa, su compra se incluirá en la factura global de ventas al público en general. Una vez
          emitida la factura global, no será posible refacturar individualmente.
        </Paragraph>
        <Paragraph>
          <strong className="text-white">Corrección de Datos:</strong> Si requiere una corrección o
          refacturación debido a un error en la información proporcionada por usted, la solicitud deberá
          realizarse a través de una nota de crédito y la emisión de un nuevo CFDI siguiendo los
          lineamientos del SAT. Esto puede incurrir en tiempos de procesamiento adicionales.
        </Paragraph>
        <Paragraph>
          <strong className="text-white">Moneda y Forma de Pago:</strong> Todas las facturas se
          emitirán en Pesos Mexicanos (MXN). La forma de pago registrada en el CFDI será la
          especificada por usted en el requisito 4.
        </Paragraph>

        <SectionTitle>6. Contacto para Facturación</SectionTitle>
        <Paragraph>
          Para cualquier duda o solicitud referente a su CFDI, por favor dirija un correo electrónico a:{' '}
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
