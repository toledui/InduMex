"use client";

import React from "react";

interface TickerItem {
  label: string;
  trend: "up" | "down" | "neutral";
  value: string;
}

interface TickerNewsProps {
  items?: TickerItem[];
}

export default function TickerNews({
  items = [
    {
      label: "ACERO INOX 316L",
      trend: "up",
      value: "+2.4%",
    },
    {
      label: "NEARSHORING: IED MTY",
      trend: "up",
      value: "$4.2B",
    },
    {
      label: "USD/MXN",
      trend: "down",
      value: "18.12",
    },
    {
      label: "LITIO SONORA",
      trend: "neutral",
      value: "FASE 2 INICIA",
    },
  ],
}: TickerNewsProps) {
  // Expandir items para efecto de loop infinito
  const expandedItems = [...items, ...items, ...items];

  return (
    <div className="py-4 bg-white text-black overflow-hidden flex whitespace-nowrap border-y border-white">
      <div className="animate-marquee flex items-center gap-12 font-['Space_Grotesk'] font-bold text-sm uppercase tracking-widest">
        {expandedItems.map((item, idx) => (
          <React.Fragment key={idx}>
            <span
              className={
                item.trend === "up"
                  ? "text-emerald-600"
                  : item.trend === "down"
                    ? "text-red-600"
                    : ""
              }
            >
              {item.label}{" "}
              {item.trend === "up" ? "▲" : item.trend === "down" ? "▼" : ""}
              {item.value && ` ${item.value}`}
            </span>
            <span className="text-gray-300">/</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
