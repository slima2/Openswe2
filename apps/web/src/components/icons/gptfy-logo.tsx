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
  return (
    <div className={`flex flex-col items-center ${className}`} style={style}>
      {/* Logo principal - texto simple en Arial */}
      <div 
        className="font-bold text-blue-600 drop-shadow-lg" 
        style={{ 
          fontFamily: 'Arial, sans-serif',
          fontSize: `${height * 0.4}px`,
          lineHeight: '1',
          letterSpacing: '-0.02em'
        }}
      >
        GPTfy Software Automation
      </div>
      
      {/* Tagline solo si se solicita */}
      {showTagline && (
        <div className="text-center mt-2">
          <p className="text-gray-500 text-xs font-normal leading-tight">
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