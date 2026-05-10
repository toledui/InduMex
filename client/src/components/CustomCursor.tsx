"use client";

import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Detectar si está sobre un elemento interactivo
      const target = e.target as HTMLElement;
      const isInteractive =
        target?.tagName === "A" ||
        target?.tagName === "BUTTON" ||
        target?.closest("[data-interactive]");

      setIsHovering(!!isInteractive);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className="hidden lg:flex fixed top-0 left-0 w-6 h-6 rounded-full bg-white pointer-events-none z-100 mix-blend-difference items-center justify-center"
      style={{
        transform: `translate(${mousePosition.x - 12}px, ${mousePosition.y - 12}px) scale(${isHovering ? 3 : 1})`,
        transition: "transform 200ms ease-out",
      }}
    >
      {isHovering && (
        <span className="text-[3px] text-black font-bold uppercase tracking-widest leading-none text-center whitespace-nowrap">
          Ver
          <br />
          Más
        </span>
      )}
    </div>
  );
}
