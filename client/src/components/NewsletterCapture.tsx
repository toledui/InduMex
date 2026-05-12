"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { subscribeNewsletter } from "@/lib/api";

export default function NewsletterCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      await subscribeNewsletter({
        email,
        origen: "newsletter_footer",
        metadata: {
          source: "premium_footer_newsletter_capture",
          timestamp: new Date().toISOString(),
        },
      });
      setStatus("success");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo registrar tu correo. Intenta nuevamente."
      );
    }
  };

  return (
    <section id="newsletter" className="bg-[#F58634] py-16 md:py-20 overflow-hidden relative">
      {/* Textura de fondo técnica */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Círculo decorativo */}
      <div className="absolute -right-32 -top-32 w-96 h-96 bg-[#E07B2A] rounded-full opacity-40 pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-[#E07B2A] rounded-full opacity-30 pointer-events-none" />

      <div className="max-w-400 mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Eyebrow */}
          <motion.p
            className="text-xs font-bold uppercase tracking-[0.25em] text-black/60 mb-4"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            +12,000 Líderes Industriales Suscritos
          </motion.p>

          {/* Headline */}
          <motion.h3
            className="font-['Space_Grotesk'] text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-black leading-tight mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Únete a la{" "}
            <span className="text-white">Inteligencia</span>{" "}
            Industrial
          </motion.h3>

          {/* Subtítulo */}
          <motion.p
            className="text-sm sm:text-base text-black/70 font-light mb-10 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Análisis sectoriales, reportes de mercado y oportunidades B2B
            directamente en tu bandeja de entrada. Sin spam. Solo inteligencia.
          </motion.p>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {status === "success" ? (
              <div className="flex items-center justify-center gap-3 text-black font-bold text-lg">
                <CheckCircle className="h-6 w-6" />
                ¡Bienvenido al ecosistema InduMex!
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com.mx"
                  required
                  aria-label="Correo electrónico empresarial"
                  className="flex-1 bg-black/15 border border-black/20 text-black placeholder-black/40 text-sm font-medium px-5 py-3.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/30 transition-all"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="shrink-0 inline-flex items-center justify-center gap-2 bg-black text-white text-xs font-bold uppercase tracking-widest px-7 py-3.5 rounded-lg hover:bg-[#021325] transition-colors disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Suscribirse
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {status === "error" && (
              <p className="mt-4 text-sm text-black font-semibold">{errorMessage}</p>
            )}

            {/* Disclaimer */}
            <p className="mt-4 text-[11px] text-black/50 uppercase tracking-widest">
              Sin spam · Cancelación inmediata · Datos protegidos por LFPDPPP
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
