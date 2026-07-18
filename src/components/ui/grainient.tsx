"use client";

import React from "react";

interface GrainientProps {
  colors?: string[];
  className?: string;
}

export const Grainient: React.FC<GrainientProps> = ({
  colors = ["#2D3A6E", "#EFC94B", "#394887", "#1E2749"],
  className = "",
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Noise filter SVG */}
      <svg className="hidden">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" stitchTiles="stitch" />
        </filter>
      </svg>
      
      {/* Noise overlay */}
      <div 
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay z-0"
        style={{ filter: 'url(#noiseFilter)' }}
      ></div>

      {/* Animated Gradient Orbs */}
      <div 
        className="absolute -inset-[50%] opacity-60 mix-blend-screen z-0"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, ${colors[0]} 0%, transparent 50%), 
            radial-gradient(circle at 80% 20%, ${colors[1]} 0%, transparent 40%),
            radial-gradient(circle at 20% 80%, ${colors[2]} 0%, transparent 50%)
          `,
          filter: 'blur(60px)',
          animation: 'grainient-move 15s infinite alternate ease-in-out'
        }}
      ></div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes grainient-move {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          50% { transform: translate(5%, -5%) scale(1.05) rotate(5deg); }
          100% { transform: translate(-5%, 5%) scale(0.95) rotate(-5deg); }
        }
      `}} />
    </div>
  );
};
