export function GPTfyLogoSVG({
  className,
  width = 130,
  height = 40,
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
      {/* Main "gptfy" text with gradient */}
      <defs>
        <linearGradient id="gptfyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
          <stop offset="25%" style={{ stopColor: '#2563EB', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#1D4ED8', stopOpacity: 1 }} />
          <stop offset="75%" style={{ stopColor: '#1E40AF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#1E3A8A', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Letter "g" */}
      <path
        d="M15 25C15 20 18 17 22 17C26 17 29 20 29 25C29 30 26 33 22 33C18 33 15 30 15 25ZM22 15C16 15 11 20 11 25C11 30 16 35 22 35C28 35 33 30 33 25C33 20 28 15 22 15Z"
        fill="url(#gptfyGradient)"
      />
      {/* Connected circles for "g" */}
      <circle cx="35" cy="20" r="3" fill="none" stroke="#60A5FA" strokeWidth="1.5"/>
      <circle cx="35" cy="30" r="3" fill="none" stroke="#60A5FA" strokeWidth="1.5"/>
      <line x1="33" y1="22" x2="32" y2="28" stroke="#1D4ED8" strokeWidth="1"/>
      
      {/* Letter "p" */}
      <path
        d="M45 15V45H42V15H45ZM45 17C45 20 47 22 50 22C53 22 55 20 55 17C55 14 53 12 50 12C47 12 45 14 45 17Z"
        fill="url(#gptfyGradient)"
      />
      {/* Connected circle for "p" */}
      <circle cx="58" cy="15" r="3" fill="none" stroke="#60A5FA" strokeWidth="1.5"/>
      <line x1="55" y1="15" x2="55" y2="12" stroke="#1D4ED8" strokeWidth="1"/>
      
      {/* Letter "t" */}
      <path
        d="M65 15V45H62V15H65ZM60 18H68V21H60V18Z"
        fill="url(#gptfyGradient)"
      />
      
      {/* Letter "f" */}
      <path
        d="M75 15V45H72V15H75ZM70 18H77V21H70V18ZM70 25H77V28H70V25Z"
        fill="url(#gptfyGradient)"
      />
      
      {/* Letter "y" */}
      <path
        d="M85 15L88 25L91 15H94L89 30L85 40H82L86 30L82 15H85Z"
        fill="url(#gptfyGradient)"
      />
      
      {/* Tagline "Powered by Educastle" */}
      <text
        x="100"
        y="50"
        textAnchor="middle"
        fontSize="8"
        fill="#1E3A8A"
        fontFamily="Arial, sans-serif"
        fontWeight="normal"
      >
        Powered by Educastle
      </text>
    </svg>
  );
}

// Keep the old function name for backward compatibility
export function OpenSWELogoSVG(props: any) {
  return <GPTfyLogoSVG {...props} />;
}
