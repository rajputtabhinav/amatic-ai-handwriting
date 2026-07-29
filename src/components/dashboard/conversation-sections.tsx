'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Conversation Sections Renderer
 * Displays AI-generated conversation with visuals in notebook style
 */

export interface ConversationSection {
  id: string;
  userMessage?: string;
  aiText: string;
  image?: string;
  formulas?: string[];
  timestamp: Date;
}

interface ConversationSectionsProps {
  sections: ConversationSection[];
  className?: string;
}

export function ConversationSections({ sections, className = '' }: ConversationSectionsProps) {
  return (
    <div className={`conversation-flow space-y-6 p-4 ${className}`}>
      <AnimatePresence>
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="conversation-turn"
          >
            {/* User question */}
            {section.userMessage && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="user-bubble mb-4 flex items-start gap-2"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  👤
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 max-w-2xl">
                  <p className="text-gray-800 dark:text-gray-200 text-sm">
                    {section.userMessage}
                  </p>
                </div>
              </motion.div>
            )}

            {/* AI response with visuals */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="ai-response ml-0"
            >
              <div className="flex items-start gap-2 mb-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                  🤖
                </div>
                <div className="flex-1">
                  {/* AI Text (handwriting style) */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="ai-text font-handwriting text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm mb-4"
                    style={{ fontFamily: 'Kalam, cursive', fontSize: '1.1rem', lineHeight: '1.8' }}
                  >
                    <TypewriterText text={section.aiText} />
                  </motion.div>

                  {/* Generated Image */}
                  {section.image && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="ai-generated-image mb-4"
                    >
                      <img
                        src={section.image}
                        alt="AI generated diagram"
                        className="rounded-lg shadow-md max-w-full h-auto border-2 border-gray-200 dark:border-gray-700"
                        loading="lazy"
                      />
                    </motion.div>
                  )}

                  {/* Formulas */}
                  {section.formulas && section.formulas.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="formulas-container space-y-2"
                    >
                      {section.formulas.map((formula, idx) => (
                        <div
                          key={idx}
                          className="formula-box bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-3 text-center font-mono text-lg"
                        >
                          {formula}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Typewriter effect for AI text
 */
function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 30); // 30ms per character for smooth typewriter effect

      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [currentIndex, text]);

  return <p className="whitespace-pre-wrap">{displayedText}</p>;
}

