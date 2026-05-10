"use client";

import { useEffect, useRef } from "react";

type ParticleOptions = {
  particleColor: string;
  lineColor: string;
  accentColors: string[];
  particleAmount: number;
  defaultSpeed: number;
  variantSpeed: number;
  defaultRadius: number;
  variantRadius: number;
  linkRadius: number;
};

class Particle {
  x: number;
  y: number;
  speed: number;
  directionAngle: number;
  color: string;
  radius: number;
  vector: { x: number; y: number };
  opts: ParticleOptions;
  w: number;
  h: number;

  constructor(opts: ParticleOptions, w: number, h: number) {
    this.opts = opts;
    this.w = w;
    this.h = h;

    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.speed = opts.defaultSpeed + Math.random() * opts.variantSpeed;
    this.directionAngle = Math.floor(Math.random() * 360);

    const isAccent = Math.random() > 0.9;
    this.color = isAccent
      ? opts.accentColors[Math.floor(Math.random() * opts.accentColors.length)]
      : opts.particleColor;

    this.radius = opts.defaultRadius + Math.random() * opts.variantRadius;
    this.vector = {
      x: Math.cos(this.directionAngle) * this.speed,
      y: Math.sin(this.directionAngle) * this.speed,
    };
  }

  update(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.border();
    this.x += this.vector.x;
    this.y += this.vector.y;
  }

  border() {
    if (this.x >= this.w || this.x <= 0) {
      this.vector.x *= -1;
    }
    if (this.y >= this.h || this.y <= 0) {
      this.vector.y *= -1;
    }

    if (this.x > this.w) this.x = this.w;
    if (this.y > this.h) this.y = this.h;
    if (this.x < 0) this.x = 0;
    if (this.y < 0) this.y = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

function checkDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const opts: ParticleOptions = {
      particleColor: "rgba(255, 255, 255, 0.4)",
      lineColor: "rgba(255, 255, 255, 0.1)",
      accentColors: ["#004AAD", "#F58634"],
      particleAmount: Math.floor((w * h) / 15000),
      defaultSpeed: 0.5,
      variantSpeed: 1,
      defaultRadius: 1.5,
      variantRadius: 2,
      linkRadius: 180,
    };

    let particles: Particle[] = [];
    let animationFrameId = 0;

    const setup = () => {
      particles = [];
      opts.particleAmount = Math.floor((w * h) / 15000);
      for (let i = 0; i < opts.particleAmount; i++) {
        particles.push(new Particle(opts, w, h));
      }
    };

    const linkPoints = (point: Particle, hubs: Particle[]) => {
      for (let i = 0; i < hubs.length; i++) {
        const distance = checkDistance(point.x, point.y, hubs[i].x, hubs[i].y);
        const opacity = 1 - distance / opts.linkRadius;
        if (opacity > 0) {
          ctx.lineWidth = 0.5;
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(hubs[i].x, hubs[i].y);
          ctx.closePath();
          ctx.stroke();
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update(w, h);
        particles[i].draw(ctx);
      }

      for (let i = 0; i < particles.length; i++) {
        linkPoints(particles[i], particles);
      }

      animationFrameId = window.requestAnimationFrame(draw);
    };

    setup();
    draw();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      setup();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}
