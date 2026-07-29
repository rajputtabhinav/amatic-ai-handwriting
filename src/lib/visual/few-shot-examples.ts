/**
 * Few-Shot Learning Examples for Illustration Generation
 * 
 * Perfect Undraw-quality examples that teach the AI the exact style.
 * These are injected into prompts for few-shot learning.
 */

export const PERFECT_CHARACTER_SCENE = `<motion.div className="relative w-[480px] h-[360px]">
  {/* Background circle - soft, large */}
  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-[#48bb78]/15 blur-2xl -z-10" />
  
  {/* Central Character - Person reading/studying */}
  <motion.svg 
    viewBox="0 0 200 280" 
    width="200" 
    height="280"
    className="absolute left-[140px] top-[40px]"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
  >
    {/* Head */}
    <circle cx="100" cy="60" r="35" fill="#2d3748"/>
    
    {/* Hair */}
    <path d="M70,35 Q85,25 100,23 Q115,25 130,35" fill="#2d3748"/>
    
    {/* Eyes */}
    <circle cx="90" cy="55" r="3" fill="#fff"/>
    <circle cx="110" cy="55" r="3" fill="#fff"/>
    
    {/* Smile */}
    <path d="M85,70 Q100,76 115,70" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/>
    
    {/* Neck */}
    <rect x="88" y="90" width="24" height="15" fill="#2d3748" rx="4"/>
    
    {/* Body/Torso */}
    <rect x="70" y="105" width="60" height="80" rx="8" fill="#2d3748"/>
    
    {/* Left arm */}
    <path d="M72,115 L50,148 L45,153" stroke="#2d3748" strokeWidth="6" strokeLinecap="round" fill="none"/>
    
    {/* Right arm */}
    <path d="M128,115 L150,148 L145,158" stroke="#2d3748" strokeWidth="6" strokeLinecap="round" fill="none"/>
    
    {/* Left hand */}
    <ellipse cx="45" cy="158" rx="8" ry="10" fill="#2d3748"/>
    
    {/* Right hand */}
    <ellipse cx="150" cy="163" rx="8" ry="10" fill="#2d3748"/>
    
    {/* Book being held */}
    <rect x="50" y="148" width="95" height="65" rx="4" fill="#48bb78" stroke="#2d3748" strokeWidth="2"/>
    <rect x="55" y="153" width="85" height="55" rx="2" fill="#fff" opacity="0.9"/>
    <line x1="97" y1="153" x2="97" y2="208" stroke="#48bb78" strokeWidth="2"/>
    
    {/* Legs */}
    <rect x="75" y="185" width="20" height="70" rx="10" fill="#2d3748"/>
    <rect x="105" y="185" width="20" height="70" rx="10" fill="#2d3748"/>
    
    {/* Feet */}
    <ellipse cx="85" cy="260" rx="12" ry="8" fill="#2d3748"/>
    <ellipse cx="115" cy="260" rx="12" ry="8" fill="#2d3748"/>
  </motion.svg>
  
  {/* 18 Floating Icons - Educational symbols */}
  {Array.from({ length: 18 }).map((_, i) => {
    const angle = (i / 18) * Math.PI * 2;
    const radiusVariation = Math.sin(i * 0.5) * 30;
    const radius = 160 + radiusVariation;
    const x = 240 + Math.cos(angle) * radius;
    const y = 180 + Math.sin(angle) * radius * 0.6;
    
    return (
      <motion.svg
        key={i}
        width="40"
        height="40"
        viewBox="0 0 40 40"
        className="absolute"
        style={{ left: \`\${x}px\`, top: \`\${y}px\` }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          y: [0, -8, 0]
        }}
        transition={{ 
          delay: i * 0.05,
          duration: 0.6,
          y: { 
            repeat: Infinity, 
            duration: 2.5 + i * 0.2,
            ease: "easeInOut"
          }
        }}
      >
        {i === 0 && ( // DNA Helix
          <g>
            <path d="M10,5 Q15,15 10,25 Q5,35 10,45" stroke="#2d3748" strokeWidth="2" fill="none"/>
            <path d="M30,5 Q25,15 30,25 Q35,35 30,45" stroke="#2d3748" strokeWidth="2" fill="none"/>
            <line x1="10" y1="10" x2="30" y2="10" stroke="#2d3748" strokeWidth="1"/>
            <line x1="10" y1="25" x2="30" y2="25" stroke="#2d3748" strokeWidth="1"/>
            <line x1="10" y1="40" x2="30" y2="40" stroke="#2d3748" strokeWidth="1"/>
          </g>
        )}
        {i === 1 && ( // Planet with ring
          <g>
            <circle cx="20" cy="20" r="12" stroke="#2d3748" strokeWidth="2" fill="none"/>
            <ellipse cx="20" cy="20" rx="18" ry="6" stroke="#2d3748" strokeWidth="2" fill="none"/>
          </g>
        )}
        {i === 2 && ( // Atom
          <g>
            <circle cx="20" cy="20" r="3" fill="#2d3748"/>
            <ellipse cx="20" cy="20" rx="15" ry="8" stroke="#2d3748" strokeWidth="1.5" fill="none"/>
            <ellipse cx="20" cy="20" rx="8" ry="15" stroke="#2d3748" strokeWidth="1.5" fill="none"/>
          </g>
        )}
        {i === 3 && ( // Book
          <g>
            <rect x="8" y="10" width="24" height="20" rx="2" stroke="#2d3748" strokeWidth="2" fill="none"/>
            <line x1="20" y1="10" x2="20" y2="30" stroke="#2d3748" strokeWidth="1.5"/>
          </g>
        )}
        {i === 4 && ( // Lightbulb
          <g>
            <circle cx="20" cy="15" r="9" stroke="#2d3748" strokeWidth="2" fill="none"/>
            <rect x="17" y="24" width="6" height="8" stroke="#2d3748" strokeWidth="2" fill="none" rx="1"/>
            <line x1="12" y1="32" x2="28" y2="32" stroke="#2d3748" strokeWidth="2"/>
          </g>
        )}
        {i === 5 && ( // Gear
          <g>
            <circle cx="20" cy="20" r="8" stroke="#2d3748" strokeWidth="2" fill="none"/>
            <circle cx="20" cy="5" r="3" fill="#2d3748"/>
            <circle cx="35" cy="20" r="3" fill="#2d3748"/>
            <circle cx="20" cy="35" r="3" fill="#2d3748"/>
            <circle cx="5" cy="20" r="3" fill="#2d3748"/>
          </g>
        )}
        {i === 6 && ( // Molecule
          <g>
            <circle cx="10" cy="20" r="6" fill="#2d3748"/>
            <circle cx="30" cy="20" r="6" fill="#2d3748"/>
            <line x1="16" y1="20" x2="24" y2="20" stroke="#2d3748" strokeWidth="3"/>
          </g>
        )}
        {i === 7 && ( // Star
          <path d="M20,5 L23,15 L33,15 L25,22 L28,32 L20,25 L12,32 L15,22 L7,15 L17,15 Z" 
                stroke="#2d3748" strokeWidth="2" fill="none"/>
        )}
        {i === 8 && ( // Leaf
          <path d="M20,5 Q30,20 20,35 Q10,20 20,5" stroke="#2d3748" strokeWidth="2" fill="none"/>
        )}
        {i === 9 && ( // Cube
          <g>
            <path d="M10,15 L20,10 L30,15 L20,20 Z" stroke="#2d3748" strokeWidth="1.5" fill="none"/>
            <line x1="10" y1="15" x2="10" y2="30" stroke="#2d3748" strokeWidth="1.5"/>
            <line x1="30" y1="15" x2="30" y2="30" stroke="#2d3748" strokeWidth="1.5"/>
            <line x1="10" y1="30" x2="20" y2="35" stroke="#2d3748" strokeWidth="1.5"/>
            <line x1="30" y1="30" x2="20" y2="35" stroke="#2d3748" strokeWidth="1.5"/>
          </g>
        )}
        {i === 10 && ( // Flask
          <g>
            <rect x="15" y="8" width="10" height="5" stroke="#2d3748" strokeWidth="1.5" fill="none"/>
            <path d="M16,13 L12,28 Q12,32 20,32 Q28,32 28,28 L24,13" stroke="#2d3748" strokeWidth="2" fill="none"/>
          </g>
        )}
        {i === 11 && ( // Graph
          <g>
            <line x1="5" y1="35" x2="35" y2="35" stroke="#2d3748" strokeWidth="2"/>
            <line x1="5" y1="5" x2="5" y2="35" stroke="#2d3748" strokeWidth="2"/>
            <path d="M8,30 L15,20 L22,25 L32,10" stroke="#2d3748" strokeWidth="2" fill="none"/>
          </g>
        )}
        {i === 12 && ( // Magnet
          <g>
            <path d="M10,10 L10,25 Q10,30 15,30 Q20,30 20,25 L20,10" stroke="#2d3748" strokeWidth="2" fill="none"/>
            <path d="M20,10 L20,25 Q20,30 25,30 Q30,30 30,25 L30,10" stroke="#2d3748" strokeWidth="2" fill="none"/>
          </g>
        )}
        {i === 13 && ( // Telescope
          <g>
            <line x1="5" y1="25" x2="25" y2="10" stroke="#2d3748" strokeWidth="3"/>
            <circle cx="27" cy="8" r="4" stroke="#2d3748" strokeWidth="2" fill="none"/>
            <line x1="15" y1="17" x2="12" y2="25" stroke="#2d3748" strokeWidth="2"/>
          </g>
        )}
        {i === 14 && ( // Rocket
          <g>
            <path d="M20,5 L25,25 L20,30 L15,25 Z" stroke="#2d3748" strokeWidth="2" fill="none"/>
            <circle cx="20" cy="18" r="3" fill="#2d3748"/>
          </g>
        )}
        {i === 15 && ( // Microscope
          <g>
            <line x1="20" y1="5" x2="20" y2="20" stroke="#2d3748" strokeWidth="2"/>
            <circle cx="20" cy="22" r="5" stroke="#2d3748" strokeWidth="2" fill="none"/>
            <rect x="10" y="27" width="20" height="3" fill="#2d3748"/>
          </g>
        )}
        {i === 16 && ( // Beaker
          <g>
            <path d="M12,8 L12,18 L8,28 Q8,32 20,32 Q32,32 32,28 L28,18 L28,8" stroke="#2d3748" strokeWidth="2" fill="none"/>
            <line x1="10" y1="8" x2="30" y2="8" stroke="#2d3748" strokeWidth="2"/>
          </g>
        )}
        {i === 17 && ( // Formula
          <text x="8" y="26" fill="#2d3748" fontFamily="serif" fontSize="20" fontStyle="italic">f(x)</text>
        )}
      </motion.svg>
    );
  })}
</motion.div>`;

export const PERFECT_SCIENTIFIC_DIAGRAM = `<motion.div className="relative w-[480px] h-[360px]">
  {/* Main subject - Cell structure */}
  <motion.svg 
    viewBox="0 0 200 200" 
    width="200" 
    height="200"
    className="absolute left-[140px] top-[80px]"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    {/* Cell membrane */}
    <ellipse cx="100" cy="100" rx="90" ry="85" stroke="#003049" strokeWidth="3" fill="#eae2b7" opacity="0.3"/>
    
    {/* Nucleus */}
    <circle cx="100" cy="100" r="35" fill="#d62828" opacity="0.4" stroke="#d62828" strokeWidth="2"/>
    
    {/* Mitochondria */}
    <ellipse cx="60" cy="70" rx="20" ry="12" fill="#f77f00" opacity="0.5" stroke="#f77f00" strokeWidth="1.5"/>
    <ellipse cx="140" cy="130" rx="18" ry="10" fill="#f77f00" opacity="0.5" stroke="#f77f00" strokeWidth="1.5"/>
    
    {/* Ribosomes */}
    <circle cx="50" cy="120" r="4" fill="#023047"/>
    <circle cx="150" cy="80" r="4" fill="#023047"/>
    <circle cx="80" cy="140" r="4" fill="#023047"/>
  </motion.svg>
  
  {/* Annotations with leader lines */}
  <g className="absolute">
    {/* Nucleus annotation */}
    <line x1="240" y1="180" x2="320" y2="140" stroke="#666" strokeWidth="1" strokeDasharray="4,2" className="absolute"/>
    <circle cx="240" cy="180" r="3" fill="#d62828" className="absolute" style={{ left: '240px', top: '180px' }}/>
    <div className="absolute left-[325px] top-[135px] text-xs text-gray-700 bg-white/90 px-2 py-1 rounded shadow-sm">
      Nucleus
    </div>
    
    {/* Mitochondria annotation */}
    <line x1="200" y1="150" x2="280" y2="200" stroke="#666" strokeWidth="1" strokeDasharray="4,2" className="absolute"/>
    <circle cx="200" cy="150" r="3" fill="#f77f00" className="absolute" style={{ left: '200px', top: '150px' }}/>
    <div className="absolute left-[285px] top-[195px] text-xs text-gray-700 bg-white/90 px-2 py-1 rounded shadow-sm">
      Mitochondria
    </div>
    
    {/* Cell membrane annotation */}
    <line x1="330" y1="180" x2="400" y2="160" stroke="#666" strokeWidth="1" strokeDasharray="4,2" className="absolute"/>
    <circle cx="330" cy="180" r="3" fill="#003049" className="absolute" style={{ left: '330px', top: '180px' }}/>
    <div className="absolute left-[405px] top-[155px] text-xs text-gray-700 bg-white/90 px-2 py-1 rounded shadow-sm">
      Cell Membrane
    </div>
  </g>
</motion.div>`;

export const PERFECT_ISOMETRIC_SCENE = `<motion.div className="relative w-[480px] h-[360px]">
  {/* Isometric 3D building/system */}
  <motion.g 
    className="absolute left-[100px] top-[80px]"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
  >
    {/* Base platform */}
    <motion.div 
      className="absolute w-32 h-32"
      style={{ transform: 'rotateX(60deg) rotateZ(45deg)', transformStyle: 'preserve-3d' }}
    >
      <div className="absolute w-full h-full bg-[#e9c46a] ${config.shadows}" />
    </motion.div>
    
    {/* Cube 1 - Top face */}
    <motion.div
      className="absolute left-[50px] top-[30px]"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <svg width="60" height="80" viewBox="0 0 60 80">
        <path d="M30,0 L60,15 L30,30 L0,15 Z" fill="#2a9d8f"/>
        <path d="M0,15 L30,30 L30,80 L0,65 Z" fill="#21867a"/>
        <path d="M30,30 L60,15 L60,65 L30,80 Z" fill="#1d7a6f"/>
      </svg>
    </motion.div>
    
    {/* Additional isometric elements... */}
  </motion.g>
</motion.div>`;

/**
 * Get appropriate example based on style
 */
export function getFewShotExample(style: string): string {
  switch (style) {
    case 'isometric':
      return PERFECT_ISOMETRIC_SCENE;
    case 'scientific':
      return PERFECT_SCIENTIFIC_DIAGRAM;
    case 'flat2':
    case 'gradientMesh':
    default:
      return PERFECT_CHARACTER_SCENE;
  }
}

/**
 * Build few-shot learning prefix for prompts
 */
export function buildFewShotPrefix(style: string): string {
  const example = getFewShotExample(style);
  
  return `STUDY THIS PERFECT EXAMPLE FIRST (95/100 quality):

${example}

ANALYSIS OF WHY THIS IS PERFECT:
- 22 total elements (1 character + 18 icons + 3 accents)
- Character has 10+ body parts (head, eyes, mouth, body, arms, hands, legs, feet)
- Icons are simple, recognizable line art
- 2-color palette only (accent + charcoal #2d3748)
- Smooth staggered animations
- Circular orbit layout for icons
- Large soft background circle

NOW: Create in this EXACT style and quality for the user's query.
Match the element count, composition, detail level, and structure.

`;
}

