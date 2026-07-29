/**
 * Query Analyzer Service
 * 
 * Auto-detects audience, emotion, topic, and style from user queries.
 * No manual input needed - AI adapts to each user automatically.
 */

import { createAnthropicClient, QueryAnalysis } from '../api/anthropic-client';

export interface DetailedQueryAnalysis extends QueryAnalysis {
  confidence: number;
  keywords: string[];
  suggestedPhysicsPreset: string;
  voiceSettings: VoiceSettings;
}

export interface VoiceSettings {
  speed: number;
  pitch: number;
  emotion: string;
  voiceId?: string;
}

/**
 * Vocabulary patterns for quick local analysis
 */
const VOCABULARY_PATTERNS = {
  kid: /\b(how|why|what's|whats|cool|fun|please|mommy|daddy|can you|show me)\b/i,
  teen: /\b(yo|like|basically|literally|bruh|dude|idk|tbh|fr|lowkey)\b/i,
  professional: /\b(mechanism|implementation|architecture|optimize|paradigm|methodology|stakeholder)\b/i,
  technical: /\b(algorithm|function|API|database|server|client|protocol|encryption)\b/i
};

/**
 * Emotion detection patterns
 */
const EMOTION_PATTERNS = {
  confused: /\b(confused|don't understand|can't get|what does|what is|help me)\b/i,
  curious: /\b(how does|why does|what happens|curious|wonder|interested)\b/i,
  excited: /\b(amazing|awesome|cool|love|wow|excited|can't wait)\b/i,
  serious: /\b(important|critical|must|urgent|need to|essential)\b/i,
  frustrated: /\b(doesn't work|can't|won't|frustrated|annoyed|why won't)\b/i
};

/**
 * Topic categories and keywords
 */
const TOPIC_KEYWORDS = {
  science: ['photosynthesis', 'gravity', 'atom', 'molecule', 'energy', 'physics', 'chemistry', 'biology', 'ecosystem'],
  space: ['planet', 'sun', 'moon', 'star', 'orbit', 'solar', 'galaxy', 'universe', 'space', 'rocket'],
  anatomy: ['bone', 'muscle', 'heart', 'brain', 'organ', 'cell', 'blood', 'body', 'skeleton', 'anatomy'],
  technology: ['computer', 'code', 'program', 'software', 'hardware', 'algorithm', 'data', 'internet', 'AI'],
  math: ['equation', 'formula', 'calculate', 'number', 'graph', 'geometry', 'algebra', 'fraction', 'percent'],
  history: ['war', 'king', 'queen', 'empire', 'century', 'ancient', 'civilization', 'revolution', 'historical'],
  business: ['market', 'profit', 'strategy', 'company', 'invest', 'stock', 'economy', 'finance', 'business'],
  art: ['paint', 'draw', 'color', 'design', 'creative', 'artist', 'sculpture', 'music', 'aesthetic']
};

/**
 * Physics presets based on topic
 */
const TOPIC_PHYSICS_PRESETS: Record<string, string> = {
  science: 'gravity-particles',
  space: 'zero-gravity-orbit',
  anatomy: 'organic-pulse',
  technology: 'data-flow',
  math: 'precise-springs',
  history: 'timeline-domino',
  business: 'magnetic-floating',
  art: 'fluid-organic',
  general: 'balanced'
};

/**
 * Analyze query using AI for accurate detection
 */
export async function analyzeQueryWithAI(query: string): Promise<DetailedQueryAnalysis> {
  const client = createAnthropicClient();
  
  try {
    const aiAnalysis = await client.analyzeQuery(query);
    
    // Enhance with local analysis
    const localAnalysis = analyzeQueryLocally(query);
    
    return {
      ...aiAnalysis,
      confidence: 0.9,
      keywords: localAnalysis.keywords,
      suggestedPhysicsPreset: TOPIC_PHYSICS_PRESETS[aiAnalysis.topic] || 'balanced',
      voiceSettings: getVoiceSettings(aiAnalysis.audience, aiAnalysis.emotion)
    };
  } catch {
    // Fallback to local analysis
    return analyzeQueryLocally(query);
  }
}

/**
 * Quick local analysis without AI (for speed or fallback)
 */
export function analyzeQueryLocally(query: string): DetailedQueryAnalysis {
  const audience = detectAudience(query);
  const emotion = detectEmotion(query);
  const topic = detectTopic(query);
  const keywords = extractKeywords(query);

  return {
    audience,
    emotion,
    topic,
    visualStyle: getVisualStyle(audience, query),
    voiceTone: getVoiceTone(audience, emotion),
    confidence: 0.7,
    keywords,
    suggestedPhysicsPreset: TOPIC_PHYSICS_PRESETS[topic] || 'balanced',
    voiceSettings: getVoiceSettings(audience, emotion)
  };
}

/**
 * Detect audience from query text
 */
function detectAudience(query: string): QueryAnalysis['audience'] {
  const lower = query.toLowerCase();
  
  // Check vocabulary patterns
  if (VOCABULARY_PATTERNS.kid.test(lower)) return 'kid';
  if (VOCABULARY_PATTERNS.teen.test(lower)) return 'teen';
  if (VOCABULARY_PATTERNS.professional.test(lower)) return 'professional';
  if (VOCABULARY_PATTERNS.technical.test(lower)) return 'professional';

  // Check sentence complexity
  const words = query.split(/\s+/);
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  
  if (avgWordLength < 4) return 'kid';
  if (avgWordLength < 5) return 'teen';
  if (avgWordLength > 6) return 'professional';

  return 'adult';
}

/**
 * Detect emotion from query
 */
function detectEmotion(query: string): QueryAnalysis['emotion'] {
  const lower = query.toLowerCase();

  if (EMOTION_PATTERNS.confused.test(lower)) return 'confused';
  if (EMOTION_PATTERNS.curious.test(lower)) return 'curious';
  if (EMOTION_PATTERNS.excited.test(lower)) return 'excited';
  if (EMOTION_PATTERNS.serious.test(lower)) return 'serious';
  if (EMOTION_PATTERNS.frustrated.test(lower)) return 'confused';

  // Check punctuation for emotion hints
  if (query.includes('!')) return 'excited';
  if (query.includes('?') && query.length < 30) return 'curious';

  return 'neutral';
}

/**
 * Detect topic from query
 */
function detectTopic(query: string): string {
  const lower = query.toLowerCase();

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return topic;
      }
    }
  }

  return 'general';
}

/**
 * Extract key words from query
 */
function extractKeywords(query: string): string[] {
  // Remove common words and extract meaningful terms
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'shall',
    'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in',
    'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about',
    'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'each', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 's', 't', 'just', 'don', 'now',
    'what', 'me', 'my', 'i', 'you', 'your', 'we', 'they', 'it'
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 10);
}

/**
 * Style detection keywords for professional styles
 */
const STYLE_DETECTION = {
  isometric: [
    'system', 'architecture', 'flow', 'process', 'workflow', 
    'infrastructure', 'network', 'building', 'city', 'factory',
    'pipeline', 'stack', 'layers', 'hierarchy', 'structure'
  ],
  scientific: [
    'cell', 'atom', 'molecule', 'organ', 'anatomy', 'biology',
    'chemistry', 'physics', 'diagram', 'structure', 'dna', 'brain',
    'heart', 'body', 'organism', 'tissue', 'protein', 'enzyme'
  ],
  gradientMesh: [
    'abstract', 'concept', 'idea', 'creative', 'modern',
    'futuristic', 'technology', 'ai', 'digital', 'space',
    'energy', 'wave', 'quantum', 'virtual', 'cyber'
  ],
  flat2: [
    'simple', 'basic', 'introduction', 'overview', 'general',
    'everyday', 'common', 'explain', 'what is', 'how to'
  ]
};

/**
 * Detect optimal style based on query content
 */
function detectOptimalStyle(query: string): string {
  const lower = query.toLowerCase();
  
  // Check each professional style
  for (const [style, keywords] of Object.entries(STYLE_DETECTION)) {
    if (keywords.some(k => lower.includes(k))) {
      return style;
    }
  }
  
  // Fallback to audience-based style
  return 'modern';
}

/**
 * Get visual style based on audience and query content
 */
function getVisualStyle(audience: QueryAnalysis['audience'], query?: string): QueryAnalysis['visualStyle'] {
  // First try to detect optimal style from query content
  if (query) {
    const detectedStyle = detectOptimalStyle(query);
    if (detectedStyle !== 'modern') {
      return detectedStyle as QueryAnalysis['visualStyle'];
    }
  }
  
  // Fallback to audience-based style
  const styleMap: Record<string, QueryAnalysis['visualStyle']> = {
    kid: 'cartoon',
    teen: 'modern',
    adult: 'modern',
    professional: 'professional'
  };
  return styleMap[audience] || 'modern';
}

/**
 * Get voice tone based on audience and emotion
 */
function getVoiceTone(
  audience: QueryAnalysis['audience'],
  emotion: QueryAnalysis['emotion']
): QueryAnalysis['voiceTone'] {
  if (emotion === 'excited') return 'enthusiastic';
  if (audience === 'kid') return 'warm';
  if (audience === 'teen') return 'casual';
  if (audience === 'professional') return 'professional';
  return 'professional';
}

/**
 * Get voice settings for ElevenLabs
 */
function getVoiceSettings(
  audience: QueryAnalysis['audience'],
  emotion: QueryAnalysis['emotion']
): VoiceSettings {
  const baseSettings: Record<string, VoiceSettings> = {
    kid: { speed: 0.9, pitch: 1.1, emotion: 'friendly' },
    teen: { speed: 1.0, pitch: 1.0, emotion: 'casual' },
    adult: { speed: 1.0, pitch: 1.0, emotion: 'clear' },
    professional: { speed: 0.95, pitch: 0.95, emotion: 'authoritative' }
  };

  const settings = { ...baseSettings[audience] || baseSettings.adult };

  // Adjust for emotion
  if (emotion === 'excited') {
    settings.speed *= 1.1;
    settings.emotion = 'enthusiastic';
  } else if (emotion === 'confused') {
    settings.speed *= 0.9;
    settings.emotion = 'patient';
  } else if (emotion === 'curious') {
    settings.emotion = 'engaging';
  }

  return settings;
}

/**
 * Get recommended ElevenLabs voice ID based on analysis
 */
export function getRecommendedVoiceId(analysis: DetailedQueryAnalysis): string {
  // Voice IDs from ElevenLabs
  const voices = {
    friendly: 'EXAVITQu4vr4xnSDxMaL', // Bella - friendly female
    casual: 'TxGEqnHWrfWFTfGW9XjX', // Josh - young male
    professional: 'JBFqnCBsd6RMkjVDRZzb', // Rachel - professional female
    authoritative: 'pNInz6obpgDQGcFmaJgB' // Adam - deep male
  };

  if (analysis.audience === 'kid') return voices.friendly;
  if (analysis.audience === 'teen') return voices.casual;
  if (analysis.audience === 'professional') return voices.authoritative;
  return voices.professional;
}

// Default export
export default {
  analyzeQueryWithAI,
  analyzeQueryLocally,
  getRecommendedVoiceId,
  TOPIC_KEYWORDS,
  TOPIC_PHYSICS_PRESETS
};

