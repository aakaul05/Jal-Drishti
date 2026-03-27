import { useDashboard } from "@/context/DashboardContext";

// Simple SVG map of India with Maharashtra highlighted
export function IndiaMap() {
  const { selectedRegion } = useDashboard();

  return (
    <div className="glass rounded-xl p-4 h-full flex flex-col">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Location</h3>
      <div className="flex-1 flex items-center justify-center relative">
        <svg viewBox="0 0 400 450" className="w-full h-full max-h-[260px]" xmlns="http://www.w3.org/2000/svg">
          {/* Simplified India outline */}
          <path
            d="M180 30 L220 25 L260 35 L290 30 L320 45 L340 40 L355 55 L360 80 L350 100 L355 120 L345 140 L350 160 L340 180 L350 200 L340 220 L330 235 L310 240 L300 260 L280 270 L270 290 L250 310 L240 340 L230 360 L220 370 L210 390 L200 400 L195 380 L185 370 L175 355 L165 340 L155 320 L140 300 L125 280 L115 260 L100 245 L90 225 L80 210 L75 190 L70 170 L65 150 L70 130 L80 115 L90 100 L100 85 L115 70 L130 55 L150 40 L165 33 Z"
            fill="hsla(222, 30%, 18%, 0.6)"
            stroke="hsla(222, 30%, 35%, 0.5)"
            strokeWidth="1.5"
          />
          {/* Kashmir region */}
          <path
            d="M180 30 L165 33 L150 25 L160 15 L175 10 L195 12 L210 15 L220 25 L180 30"
            fill="hsla(222, 30%, 18%, 0.6)"
            stroke="hsla(222, 30%, 35%, 0.5)"
            strokeWidth="1.5"
          />
          
          {/* Maharashtra highlighted */}
          <path
            d="M110 210 L130 195 L155 190 L175 195 L195 190 L215 200 L225 215 L220 235 L200 245 L180 250 L160 255 L140 250 L120 240 L105 225 Z"
            fill="hsla(170, 100%, 33%, 0.25)"
            stroke="hsl(170, 100%, 33%)"
            strokeWidth="2"
            className="transition-all duration-300"
          />
          
          {/* Maharashtra label */}
          <text x="162" y="225" textAnchor="middle" className="text-[8px] font-semibold" fill="hsl(170, 100%, 50%)">
            MAHARASHTRA
          </text>

          {/* Pulsing dot for selected location */}
          {selectedRegion && (
            <g>
              <circle cx="165" cy="218" r="6" fill="hsl(170, 100%, 33%)" opacity="0.3">
                <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="165" cy="218" r="3" fill="hsl(170, 100%, 50%)" stroke="hsl(170, 100%, 70%)" strokeWidth="1" />
            </g>
          )}

          {/* Other state labels (subtle) */}
          <text x="170" y="70" textAnchor="middle" className="text-[6px]" fill="hsla(215,20%,55%,0.4)">RAJASTHAN</text>
          <text x="260" y="120" textAnchor="middle" className="text-[6px]" fill="hsla(215,20%,55%,0.4)">UP</text>
          <text x="130" y="160" textAnchor="middle" className="text-[6px]" fill="hsla(215,20%,55%,0.4)">GUJARAT</text>
          <text x="240" y="180" textAnchor="middle" className="text-[6px]" fill="hsla(215,20%,55%,0.4)">MP</text>
          <text x="200" y="280" textAnchor="middle" className="text-[6px]" fill="hsla(215,20%,55%,0.4)">KARNATAKA</text>
          <text x="280" y="240" textAnchor="middle" className="text-[6px]" fill="hsla(215,20%,55%,0.4)">TELANGANA</text>
          <text x="230" y="340" textAnchor="middle" className="text-[6px]" fill="hsla(215,20%,55%,0.4)">KERALA</text>
          <text x="310" y="200" textAnchor="middle" className="text-[6px]" fill="hsla(215,20%,55%,0.4)">ODISHA</text>
          <text x="310" y="150" textAnchor="middle" className="text-[6px]" fill="hsla(215,20%,55%,0.4)">JHARKHAND</text>
        </svg>
      </div>

      {/* Selected region info */}
      {selectedRegion && (
        <div className="mt-2 bg-secondary/30 rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-primary font-semibold">{selectedRegion.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {selectedRegion.subDistrict} • {selectedRegion.district}
          </p>
        </div>
      )}
    </div>
  );
}
