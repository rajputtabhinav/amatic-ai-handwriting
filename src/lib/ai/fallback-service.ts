import { ChatMessage, AIResponse } from './config';

// Fallback responses for when AI APIs are not available
const fallbackResponses = {
  coding: [
    "I'd be happy to help with your coding question! Could you share the specific problem or code you're working on? I can assist with debugging, architecture, best practices, and more.",
    "Software development is my specialty! Whether it's frontend, backend, databases, or DevOps, I'm here to help. What are you working on?",
  ],
  business: [
    "I can help with business strategy and analysis! Whether you need help with planning, market analysis, or decision-making, let's work through it together. What's your business challenge?",
    "Business questions are welcome! I can assist with strategy, operations, marketing, and more. What would you like to explore?",
  ],
  creative: [
    "I love helping with creative projects! Whether it's writing, content creation, or brainstorming ideas, I'm here to assist. What are you working on?",
    "Creative work is exciting! I can help with writing, storytelling, content strategy, and generating fresh ideas. What's your project?",
  ],
  analysis: [
    "I can help with data analysis and research! Whether you need help understanding data, creating visualizations, or drawing insights, let's dive in. What data are you working with?",
    "Research and analysis are areas where I excel! I can help structure your approach and interpret findings. What are you analyzing?",
  ],
  general: [
    "I'm here to help with any task! I can assist with coding, business, creative projects, research, analysis, and much more. What would you like to work on today?",
    "As your AI assistant, I'm ready to help with a wide range of topics! From technical challenges to creative projects, just let me know what you need.",
    "I'm a versatile assistant ready to support you! Whether it's problem-solving, planning, or creating something new, I'm here to help. What can I do for you?",
  ],
};

export async function generateFallbackResponse(
  messages: ChatMessage[]
): Promise<AIResponse> {
  const userMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
  
  let responseCategory = 'general';
  
  if (userMessage.includes('code') || userMessage.includes('programming') || userMessage.includes('debug') || userMessage.includes('function') || userMessage.includes('api')) {
    responseCategory = 'coding';
  } else if (userMessage.includes('business') || userMessage.includes('strategy') || userMessage.includes('market') || userMessage.includes('revenue')) {
    responseCategory = 'business';
  } else if (userMessage.includes('write') || userMessage.includes('creative') || userMessage.includes('content') || userMessage.includes('story')) {
    responseCategory = 'creative';
  } else if (userMessage.includes('data') || userMessage.includes('analysis') || userMessage.includes('research') || userMessage.includes('report')) {
    responseCategory = 'analysis';
  }
  
  const responses = fallbackResponses[responseCategory as keyof typeof fallbackResponses];
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  // Add contextual tips based on the question
  let enhancedResponse = randomResponse;
  
  if (userMessage.includes('urgent') || userMessage.includes('asap')) {
    enhancedResponse += "\n\n⚡ I understand this is time-sensitive. Let's focus on the most critical aspects first!";
  }
  
  if (userMessage.includes('help') || userMessage.includes('stuck')) {
    enhancedResponse += "\n\n💡 Tip: Breaking down complex problems into smaller parts often makes them more manageable!";
  }
  
  return {
    content: enhancedResponse,
    model: 'amatic-assistant',
    provider: 'anthropic',
    tokensUsed: 0,
  };
}

export function getProductivityTips(): string[] {
  return [
    "💡 Break complex tasks into smaller, manageable steps",
    "📝 Document your work as you go for future reference", 
    "🔄 Review and iterate on your solutions regularly",
    "🎯 Set clear goals before starting any project",
    "👥 Seek feedback early and often",
    "📚 Stay current with best practices in your field",
    "🧠 Take breaks to maintain focus and creativity",
    "⏰ Use time-boxing to manage complex projects",
  ];
}
