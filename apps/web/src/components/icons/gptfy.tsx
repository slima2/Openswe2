export function GPTfyLogoSVG({
  className,
  width = 200,
  height = 60,
  style,
}: {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Gradiente que coincide con el sitio web original */}
      <defs>
        <linearGradient id="gptfyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#1D4ED8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#1E40AF', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Letra "g" - diseño limpio y moderno */}
      <path
        d="M25 35C25 30 28 27 32 27C36 27 39 30 39 35C39 40 36 43 32 43C28 43 25 40 25 35ZM32 25C26 25 21 30 21 35C21 40 26 45 32 45C38 45 43 40 43 35C43 30 38 25 32 25Z"
        fill="url(#gptfyGradient)"
      />
      
      {/* Letra "p" - diseño limpio y moderno */}
      <path
        d="M55 25V45H52V25H55ZM55 27C55 30 57 32 60 32C63 32 65 30 65 27C65 24 63 22 60 22C57 22 55 24 55 27Z"
        fill="url(#gptfyGradient)"
      />
      
      {/* Letra "t" - diseño limpio y moderno */}
      <path
        d="M75 25V45H72V25H75ZM70 28H77V31H70V28Z"
        fill="url(#gptfyGradient)"
      />
      
      {/* Letra "f" - diseño limpio y moderno */}
      <path
        d="M85 25V45H82V25H85ZM80 28H87V31H80V28ZM80 35H87V38H80V35Z"
        fill="url(#gptfyGradient)"
      />
      
      {/* Letra "y" - diseño limpio y moderno */}
      <path
        d="M95 25L98 35L101 25H104L99 40L95 50H92L96 40L92 25H95Z"
        fill="url(#gptfyGradient)"
      />
      
      {/* Tagline "Powered by Educastle" - discreto y profesional */}
      <text
        x="100"
        y="55"
        textAnchor="middle"
        fontSize="9"
        fill="#6B7280"
        fontFamily="Arial, sans-serif"
        fontWeight="normal"
      >
        Powered by Educastle
      </text>
    </svg>
  );
}

// Mantener compatibilidad con el nombre anterior
export function OpenSWELogoSVG(props: any) {
  return <GPTfyLogoSVG {...props} />;
}
