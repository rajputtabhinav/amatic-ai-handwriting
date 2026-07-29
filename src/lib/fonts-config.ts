// Comprehensive Font Configuration for 50+ Countries/Languages
export const FONT_CATEGORIES = {
  handwriting: {
    name: 'Handwriting',
    icon: '✍️',
    fonts: [
      // English/Latin Handwriting
      { name: 'Kalam', value: 'Kalam, cursive', language: 'English', country: '🇺🇸 USA/UK', script: 'Latin' },
      { name: 'Caveat', value: 'Caveat, cursive', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Patrick Hand', value: 'Patrick Hand, cursive', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Shadows Into Light', value: 'Shadows Into Light, cursive', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Dancing Script', value: 'Dancing Script, cursive', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Pacifico', value: 'Pacifico, cursive', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      
      // Arabic Handwriting
      { name: 'Amiri', value: 'Amiri, serif', language: 'Arabic', country: '🇸🇦 Saudi Arabia', script: 'Arabic' },
      { name: 'Cairo', value: 'Cairo, sans-serif', language: 'Arabic', country: '🇪🇬 Egypt', script: 'Arabic' },
      { name: 'Lalezar', value: 'Lalezar, cursive', language: 'Arabic', country: '🇮🇷 Iran', script: 'Arabic' },
      { name: 'Aref Ruqaa', value: 'Aref Ruqaa, serif', language: 'Arabic', country: '🇪🇬 Egypt', script: 'Arabic' },
      
      // Chinese Handwriting
      { name: 'Ma Shan Zheng', value: 'Ma Shan Zheng, cursive', language: 'Chinese', country: '🇨🇳 China', script: 'Han' },
      { name: 'ZCOOL XiaoWei', value: 'ZCOOL XiaoWei, serif', language: 'Chinese', country: '🇨🇳 China', script: 'Han' },
      { name: 'Liu Jian Mao Cao', value: 'Liu Jian Mao Cao, cursive', language: 'Chinese', country: '🇨🇳 China', script: 'Han' },
      { name: 'Long Cang', value: 'Long Cang, cursive', language: 'Chinese', country: '🇨🇳 China', script: 'Han' },
      
      // Japanese Handwriting
      { name: 'Yuji Syuku', value: 'Yuji Syuku, serif', language: 'Japanese', country: '🇯🇵 Japan', script: 'Japanese' },
      { name: 'Klee One', value: 'Klee One, cursive', language: 'Japanese', country: '🇯🇵 Japan', script: 'Japanese' },
      { name: 'Yuji Boku', value: 'Yuji Boku, serif', language: 'Japanese', country: '🇯🇵 Japan', script: 'Japanese' },
      
      // Korean Handwriting
      { name: 'Gamja Flower', value: 'Gamja Flower, cursive', language: 'Korean', country: '🇰🇷 Korea', script: 'Hangul' },
      { name: 'Gugi', value: 'Gugi, cursive', language: 'Korean', country: '🇰🇷 Korea', script: 'Hangul' },
      { name: 'Jua', value: 'Jua, sans-serif', language: 'Korean', country: '🇰🇷 Korea', script: 'Hangul' },
      
      // Indian Scripts Handwriting
      { name: 'Tillana', value: 'Tillana, cursive', language: 'Hindi', country: '🇮🇳 India', script: 'Devanagari' },
      { name: 'Hind', value: 'Hind, sans-serif', language: 'Hindi', country: '🇮🇳 India', script: 'Devanagari' },
      { name: 'Mukta', value: 'Mukta, sans-serif', language: 'Hindi', country: '🇮🇳 India', script: 'Devanagari' },
      
      // Thai Handwriting
      { name: 'Sriracha', value: 'Sriracha, cursive', language: 'Thai', country: '🇹🇭 Thailand', script: 'Thai' },
      { name: 'Mali', value: 'Mali, cursive', language: 'Thai', country: '🇹🇭 Thailand', script: 'Thai' },
      
      // Hebrew Handwriting
      { name: 'Secular One', value: 'Secular One, sans-serif', language: 'Hebrew', country: '🇮🇱 Israel', script: 'Hebrew' },
      { name: 'Rubik', value: 'Rubik, sans-serif', language: 'Hebrew', country: '🇮🇱 Israel', script: 'Hebrew' },
    ]
  },
  
  normal: {
    name: 'Normal/Print',
    icon: '📝',
    fonts: [
      // English/Latin
      { name: 'Inter', value: 'Inter, sans-serif', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Roboto', value: 'Roboto, sans-serif', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Open Sans', value: 'Open Sans, sans-serif', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Lato', value: 'Lato, sans-serif', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Montserrat', value: 'Montserrat, sans-serif', language: 'English', country: '🇦🇷 Argentina', script: 'Latin' },
      { name: 'Poppins', value: 'Poppins, sans-serif', language: 'English', country: '🇮🇳 India', script: 'Latin' },
      
      // Arabic
      { name: 'Noto Sans Arabic', value: 'Noto Sans Arabic, sans-serif', language: 'Arabic', country: '🇸🇦 Saudi Arabia', script: 'Arabic' },
      { name: 'Tajawal', value: 'Tajawal, sans-serif', language: 'Arabic', country: '🇦🇪 UAE', script: 'Arabic' },
      { name: 'Almarai', value: 'Almarai, sans-serif', language: 'Arabic', country: '🇸🇦 Saudi Arabia', script: 'Arabic' },
      { name: 'IBM Plex Sans Arabic', value: 'IBM Plex Sans Arabic, sans-serif', language: 'Arabic', country: '🇪🇬 Egypt', script: 'Arabic' },
      
      // Chinese (Simplified & Traditional)
      { name: 'Noto Sans SC', value: 'Noto Sans SC, sans-serif', language: 'Chinese Simplified', country: '🇨🇳 China', script: 'Han' },
      { name: 'Noto Sans TC', value: 'Noto Sans TC, sans-serif', language: 'Chinese Traditional', country: '🇹🇼 Taiwan', script: 'Han' },
      { name: 'Noto Sans HK', value: 'Noto Sans HK, sans-serif', language: 'Chinese Traditional', country: '🇭🇰 Hong Kong', script: 'Han' },
      { name: 'Source Han Sans', value: 'Source Han Sans, sans-serif', language: 'Chinese', country: '🇨🇳 China', script: 'Han' },
      
      // Japanese
      { name: 'Noto Sans JP', value: 'Noto Sans JP, sans-serif', language: 'Japanese', country: '🇯🇵 Japan', script: 'Japanese' },
      { name: 'M PLUS Rounded', value: 'M PLUS Rounded 1c, sans-serif', language: 'Japanese', country: '🇯🇵 Japan', script: 'Japanese' },
      { name: 'Zen Kaku Gothic', value: 'Zen Kaku Gothic New, sans-serif', language: 'Japanese', country: '🇯🇵 Japan', script: 'Japanese' },
      
      // Korean
      { name: 'Noto Sans KR', value: 'Noto Sans KR, sans-serif', language: 'Korean', country: '🇰🇷 Korea', script: 'Hangul' },
      { name: 'Nanum Gothic', value: 'Nanum Gothic, sans-serif', language: 'Korean', country: '🇰🇷 Korea', script: 'Hangul' },
      { name: 'Black Han Sans', value: 'Black Han Sans, sans-serif', language: 'Korean', country: '🇰🇷 Korea', script: 'Hangul' },
      
      // Indian Languages
      { name: 'Noto Sans Devanagari', value: 'Noto Sans Devanagari, sans-serif', language: 'Hindi', country: '🇮🇳 India', script: 'Devanagari' },
      { name: 'Poppins', value: 'Poppins, sans-serif', language: 'Hindi/English', country: '🇮🇳 India', script: 'Latin' },
      { name: 'Noto Sans Bengali', value: 'Noto Sans Bengali, sans-serif', language: 'Bengali', country: '🇧🇩 Bangladesh', script: 'Bengali' },
      { name: 'Noto Sans Tamil', value: 'Noto Sans Tamil, sans-serif', language: 'Tamil', country: '🇮🇳 India', script: 'Tamil' },
      { name: 'Noto Sans Telugu', value: 'Noto Sans Telugu, sans-serif', language: 'Telugu', country: '🇮🇳 India', script: 'Telugu' },
      
      // Thai
      { name: 'Noto Sans Thai', value: 'Noto Sans Thai, sans-serif', language: 'Thai', country: '🇹🇭 Thailand', script: 'Thai' },
      { name: 'Sarabun', value: 'Sarabun, sans-serif', language: 'Thai', country: '🇹🇭 Thailand', script: 'Thai' },
      { name: 'Prompt', value: 'Prompt, sans-serif', language: 'Thai', country: '🇹🇭 Thailand', script: 'Thai' },
      
      // Vietnamese
      { name: 'Roboto', value: 'Roboto, sans-serif', language: 'Vietnamese', country: '🇻🇳 Vietnam', script: 'Latin' },
      { name: 'Quicksand', value: 'Quicksand, sans-serif', language: 'Vietnamese', country: '🇻🇳 Vietnam', script: 'Latin' },
      
      // Hebrew
      { name: 'Noto Sans Hebrew', value: 'Noto Sans Hebrew, sans-serif', language: 'Hebrew', country: '🇮🇱 Israel', script: 'Hebrew' },
      { name: 'Assistant', value: 'Assistant, sans-serif', language: 'Hebrew', country: '🇮🇱 Israel', script: 'Hebrew' },
      
      // Russian/Cyrillic
      { name: 'Roboto', value: 'Roboto, sans-serif', language: 'Russian', country: '🇷🇺 Russia', script: 'Cyrillic' },
      { name: 'Open Sans', value: 'Open Sans, sans-serif', language: 'Russian', country: '🇷🇺 Russia', script: 'Cyrillic' },
      { name: 'Montserrat', value: 'Montserrat, sans-serif', language: 'Russian', country: '🇷🇺 Russia', script: 'Cyrillic' },
      
      // Greek
      { name: 'Roboto', value: 'Roboto, sans-serif', language: 'Greek', country: '🇬🇷 Greece', script: 'Greek' },
      { name: 'Open Sans', value: 'Open Sans, sans-serif', language: 'Greek', country: '🇬🇷 Greece', script: 'Greek' },
      
      // European Languages (Latin Extended)
      { name: 'Lato', value: 'Lato, sans-serif', language: 'Polish', country: '🇵🇱 Poland', script: 'Latin' },
      { name: 'Raleway', value: 'Raleway, sans-serif', language: 'French', country: '🇫🇷 France', script: 'Latin' },
      { name: 'Nunito', value: 'Nunito, sans-serif', language: 'Spanish', country: '🇪🇸 Spain', script: 'Latin' },
      { name: 'Ubuntu', value: 'Ubuntu, sans-serif', language: 'German', country: '🇩🇪 Germany', script: 'Latin' },
      { name: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif', language: 'Italian', country: '🇮🇹 Italy', script: 'Latin' },
      { name: 'PT Sans', value: 'PT Sans, sans-serif', language: 'Portuguese', country: '🇧🇷 Brazil', script: 'Latin' },
      
      // Southeast Asian
      { name: 'Noto Sans Khmer', value: 'Noto Sans Khmer, sans-serif', language: 'Khmer', country: '🇰🇭 Cambodia', script: 'Khmer' },
      { name: 'Noto Sans Lao', value: 'Noto Sans Lao, sans-serif', language: 'Lao', country: '🇱🇦 Laos', script: 'Lao' },
      { name: 'Noto Sans Myanmar', value: 'Noto Sans Myanmar, sans-serif', language: 'Burmese', country: '🇲🇲 Myanmar', script: 'Myanmar' },
      
      // African Languages
      { name: 'Noto Sans Ethiopic', value: 'Noto Sans Ethiopic, sans-serif', language: 'Amharic', country: '🇪🇹 Ethiopia', script: 'Ethiopic' },
      { name: 'Lato', value: 'Lato, sans-serif', language: 'Swahili', country: '🇰🇪 Kenya', script: 'Latin' },
      
      // Persian/Farsi
      { name: 'Vazirmatn', value: 'Vazirmatn, sans-serif', language: 'Persian', country: '🇮🇷 Iran', script: 'Arabic' },
      { name: 'Yekan', value: 'Yekan, sans-serif', language: 'Persian', country: '🇮🇷 Iran', script: 'Arabic' },
      
      // Turkish
      { name: 'Quicksand', value: 'Quicksand, sans-serif', language: 'Turkish', country: '🇹🇷 Turkey', script: 'Latin' },
      
      // Georgian
      { name: 'Noto Sans Georgian', value: 'Noto Sans Georgian, sans-serif', language: 'Georgian', country: '🇬🇪 Georgia', script: 'Georgian' },
      
      // Armenian
      { name: 'Noto Sans Armenian', value: 'Noto Sans Armenian, sans-serif', language: 'Armenian', country: '🇦🇲 Armenia', script: 'Armenian' },
    ]
  },
  
  serif: {
    name: 'Serif (Formal)',
    icon: '📖',
    fonts: [
      { name: 'Merriweather', value: 'Merriweather, serif', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Playfair Display', value: 'Playfair Display, serif', language: 'English', country: '🇬🇧 UK', script: 'Latin' },
      { name: 'Lora', value: 'Lora, serif', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'PT Serif', value: 'PT Serif, serif', language: 'Russian', country: '🇷🇺 Russia', script: 'Cyrillic' },
      { name: 'Crimson Text', value: 'Crimson Text, serif', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Noto Serif', value: 'Noto Serif, serif', language: 'Multi', country: '🌍 Global', script: 'Multi' },
      { name: 'Noto Serif JP', value: 'Noto Serif JP, serif', language: 'Japanese', country: '🇯🇵 Japan', script: 'Japanese' },
      { name: 'Noto Serif KR', value: 'Noto Serif KR, serif', language: 'Korean', country: '🇰🇷 Korea', script: 'Hangul' },
      { name: 'Noto Serif SC', value: 'Noto Serif SC, serif', language: 'Chinese', country: '🇨🇳 China', script: 'Han' },
    ]
  },
  
  monospace: {
    name: 'Monospace (Code)',
    icon: '💻',
    fonts: [
      { name: 'Fira Code', value: 'Fira Code, monospace', language: 'English', country: '🌍 Global', script: 'Latin' },
      { name: 'JetBrains Mono', value: 'JetBrains Mono, monospace', language: 'English', country: '🌍 Global', script: 'Latin' },
      { name: 'Source Code Pro', value: 'Source Code Pro, monospace', language: 'English', country: '🌍 Global', script: 'Latin' },
      { name: 'IBM Plex Mono', value: 'IBM Plex Mono, monospace', language: 'English', country: '🌍 Global', script: 'Latin' },
      { name: 'Courier Prime', value: 'Courier Prime, monospace', language: 'English', country: '🌍 Global', script: 'Latin' },
    ]
  },
  
  decorative: {
    name: 'Decorative',
    icon: '✨',
    fonts: [
      { name: 'Fredoka One', value: 'Fredoka One, cursive', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Righteous', value: 'Righteous, cursive', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Bebas Neue', value: 'Bebas Neue, cursive', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Satisfy', value: 'Satisfy, cursive', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Permanent Marker', value: 'Permanent Marker, cursive', language: 'English', country: '🇺🇸 USA', script: 'Latin' },
      { name: 'Pacifico', value: 'Pacifico, cursive', language: 'Spanish', country: '🇲🇽 Mexico', script: 'Latin' },
    ]
  }
} as const;

// Country/Language specific recommendations
export const COUNTRY_FONTS = {
  'USA': { handwriting: 'Kalam', normal: 'Inter' },
  'UK': { handwriting: 'Caveat', normal: 'Open Sans' },
  'India': { handwriting: 'Tillana', normal: 'Poppins' },
  'China': { handwriting: 'Ma Shan Zheng', normal: 'Noto Sans SC' },
  'Japan': { handwriting: 'Klee One', normal: 'Noto Sans JP' },
  'Korea': { handwriting: 'Gamja Flower', normal: 'Noto Sans KR' },
  'Saudi Arabia': { handwriting: 'Aref Ruqaa', normal: 'Noto Sans Arabic' },
  'Egypt': { handwriting: 'Cairo', normal: 'Tajawal' },
  'Russia': { handwriting: 'Caveat', normal: 'Roboto' },
  'Germany': { handwriting: 'Patrick Hand', normal: 'Ubuntu' },
  'France': { handwriting: 'Dancing Script', normal: 'Raleway' },
  'Spain': { handwriting: 'Dancing Script', normal: 'Nunito' },
  'Brazil': { handwriting: 'Pacifico', normal: 'PT Sans' },
  'Thailand': { handwriting: 'Mali', normal: 'Sarabun' },
  'Vietnam': { handwriting: 'Quicksand', normal: 'Roboto' },
  'Israel': { handwriting: 'Secular One', normal: 'Assistant' },
  'Iran': { handwriting: 'Lalezar', normal: 'Vazirmatn' },
  'Turkey': { handwriting: 'Quicksand', normal: 'Montserrat' },
  'Poland': { handwriting: 'Shadows Into Light', normal: 'Lato' },
  'Italy': { handwriting: 'Dancing Script', normal: 'Source Sans Pro' },
};

export type FontCategory = keyof typeof FONT_CATEGORIES;
export type FontInfo = typeof FONT_CATEGORIES[FontCategory]['fonts'][number];

// Helper to get all unique countries covered
export function getCoveredCountries(): string[] {
  const countries = new Set<string>();
  Object.values(FONT_CATEGORIES).forEach(category => {
    category.fonts.forEach(font => {
      countries.add(font.country);
    });
  });
  return Array.from(countries);
}

// Total fonts available
export function getTotalFonts(): number {
  return Object.values(FONT_CATEGORIES).reduce((acc, cat) => acc + cat.fonts.length, 0);
}

