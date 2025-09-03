import React from 'react';

interface GPTfyLogoProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  showTagline?: boolean;
}

export function GPTfyLogo({
  width = 200,
  height = 60,
  className = "",
  style,
  showTagline = true,
}: GPTfyLogoProps) {
  // Calcular proporciones basadas en el diseño original
  const logoHeight = height * 0.7;
  const taglineHeight = height * 0.3;
  
  return (
    <div className={`flex flex-col items-center ${className}`} style={style}>
      {/* Logo principal - reproduciendo exactamente el diseño de la imagen */}
      <div className="relative" style={{ width, height: logoHeight }}>
        <svg
          width={width}
          height={logoHeight}
          viewBox="0 0 400 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Gradiente azul moderno como en la imagen */}
          <defs>
            <linearGradient id="gptfyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
              <stop offset="30%" style={{ stopColor: '#2563EB', stopOpacity: 1 }} />
              <stop offset="60%" style={{ stopColor: '#1D4ED8', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#1E40AF', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          
          {/* Letra "G" - diseño elegante y moderno */}
          <path
            d="M40 60C40 55 43 52 47 52C51 52 54 55 54 60C54 65 51 68 47 68C43 68 40 65 40 60ZM47 50C41 50 36 55 36 60C36 65 41 70 47 70C53 70 58 65 58 60C58 55 53 50 47 50Z"
            fill="url(#gptfyGradient)"
            stroke="url(#gptfyGradient)"
            strokeWidth="0.5"
          />
          
          {/* Letra "P" - diseño moderno y limpio */}
          <path
            d="M70 50V70H67V50H70ZM70 52C70 55 72 57 75 57C78 57 80 55 80 52C80 49 78 47 75 47C72 47 70 49 70 52Z"
            fill="url(#gptfyGradient)"
          />
          
          {/* Letra "T" - diseño elegante */}
          <path
            d="M90 50V70H87V50H90ZM85 53H92V56H85V53Z"
            fill="url(#gptfyGradient)"
          />
          
          {/* Letra "F" - diseño moderno con detalles */}
          <path
            d="M100 50V70H97V50H100ZM95 53H102V56H95V53ZM95 60H102V63H95V60Z"
            fill="url(#gptfyGradient)"
          />
          
          {/* Letra "Y" - diseño elegante y dinámico */}
          <path
            d="M110 50L113 60L116 50H119L114 65L110 75H107L111 65L107 50H110Z"
            fill="url(#gptfyGradient)"
          />
          
          {/* Elementos decorativos sutiles */}
          <circle cx="35" cy="55" r="2" fill="none" stroke="#60A5FA" strokeWidth="0.5" opacity="0.3"/>
          <circle cx="35" cy="65" r="2" fill="none" stroke="#60A5FA" strokeWidth="0.5" opacity="0.3"/>
        </svg>
      </div>
      
      {/* Tagline - exactamente como en la imagen */}
      {showTagline && (
        <div className="text-center" style={{ height: taglineHeight }}>
          <p className="text-muted-foreground text-sm font-medium leading-tight">
            AI-Powered Software Engineering Assistant
          </p>
          <p className="text-muted-foreground/70 text-xs mt-1 leading-tight">
            Powered by Educastle
          </p>
        </div>
      )}
    </div>
  );
}

// Mantener compatibilidad con el nombre anterior
export function GPTfyLogoSVG(props: any) {
  return <GPTfyLogo {...props} />;
}

export function OpenSWELogoSVG(props: any) {
  return <GPTfyLogo {...props} />;
}
