/**
 * Pre-built Educational Components
 * 
 * Ready-to-use React components that don't need compilation.
 * These are used instead of AI-generated code to avoid syntax errors.
 */

'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * Technology/System Component
 */
export function TechnologyExplanation({ topic = 'this system' }: { topic?: string }) {
  const [step, setStep] = useState(0);
  
  const steps = [
    { title: "System Overview", explanation: `Understanding ${topic} starts with the overall system architecture.` },
    { title: "Data Flow", explanation: "Information flows through different processing layers." },
    { title: "Processing", explanation: "Each layer transforms the data in specific ways." },
    { title: "Output", explanation: "Finally, the system produces the desired result." }
  ];
  
  const layers = [
    { label: 'Input', color: '#6366f1', y: 100 },
    { label: 'Process', color: '#8b5cf6', y: 100 },
    { label: 'Transform', color: '#ec4899', y: 100 },
    { label: 'Output', color: '#10b981', y: 100 }
  ];
  
  return (
    <div style={{ padding: '20px', maxWidth: '600px', fontFamily: 'system-ui' }}>
      <svg width="500" height="200" style={{ marginBottom: '20px' }}>
        {layers.map((layer, i) => (
          <g key={i}>
            <motion.circle
              cx={80 + i * 120}
              cy={layer.y}
              r={35}
              fill={layer.color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: step >= i ? 1 : 0.3,
                scale: step >= i ? 1 : 0.7
              }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            />
            <text
              x={80 + i * 120}
              y={layer.y + 5}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
            >
              {layer.label}
            </text>
            
            {i < layers.length - 1 && (
              <motion.line
                x1={115 + i * 120}
                y1={layer.y}
                x2={45 + (i + 1) * 120}
                y2={layer.y}
                stroke="#94a3b8"
                strokeWidth={3}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: step > i ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </g>
        ))}
      </svg>
      
      <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#334155' }}>{steps[step].title}</h3>
        <p style={{ margin: 0, color: '#64748b', lineHeight: '1.6' }}>{steps[step].explanation}</p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button 
          onClick={() => setStep(s => Math.max(0, s - 1))} 
          disabled={step === 0}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: step === 0 ? '#e2e8f0' : '#6366f1',
            color: 'white',
            cursor: step === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Previous
        </button>
        <button 
          onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} 
          disabled={step === steps.length - 1}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: step === steps.length - 1 ? '#e2e8f0' : '#6366f1',
            color: 'white',
            cursor: step === steps.length - 1 ? 'not-allowed' : 'pointer'
          }}
        >
          Next
        </button>
        <button 
          onClick={() => setStep(0)}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: '1px solid #6366f1',
            backgroundColor: 'white',
            color: '#6366f1',
            cursor: 'pointer'
          }}
        >
          Restart
        </button>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '10px', color: '#94a3b8', fontSize: '14px' }}>
        Step {step + 1} of {steps.length}
      </div>
    </div>
  );
}

/**
 * Science/Process Component
 */
export function ScienceExplanation({ topic = 'this process' }: { topic?: string }) {
  const [step, setStep] = useState(0);
  
  const steps = [
    { title: "Stage 1", explanation: `The ${topic} begins with the first stage.`, color: '#10b981' },
    { title: "Stage 2", explanation: "In the second stage, transformation occurs.", color: '#3b82f6' },
    { title: "Stage 3", explanation: "The third stage involves key reactions.", color: '#f59e0b' },
    { title: "Stage 4", explanation: "Finally, the cycle completes and may repeat.", color: '#ef4444' }
  ];
  
  const positions = [
    { x: 100, y: 150 },
    { x: 250, y: 80 },
    { x: 400, y: 150 },
    { x: 250, y: 220 }
  ];
  
  return (
    <div style={{ padding: '20px', maxWidth: '600px', fontFamily: 'system-ui' }}>
      <svg width="500" height="300" style={{ marginBottom: '20px' }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#64748b"/>
          </marker>
        </defs>
        
        {/* Cycle arrows */}
        {positions.map((pos, i) => {
          const next = positions[(i + 1) % positions.length];
          return (
            <motion.line
              key={`arrow-${i}`}
              x1={pos.x + 35}
              y1={pos.y}
              x2={next.x - 35}
              y2={next.y}
              stroke="#64748b"
              strokeWidth={3}
              markerEnd="url(#arrowhead)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: step > i ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            />
          );
        })}
        
        {/* Stage circles */}
        {steps.map((s, i) => (
          <motion.g key={i}>
            <motion.circle
              cx={positions[i].x}
              cy={positions[i].y}
              r={40}
              fill={s.color}
              initial={{ scale: 0 }}
              animate={{ 
                scale: step >= i ? 1 : 0.6,
                opacity: step >= i ? 1 : 0.4
              }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            />
            <text
              x={positions[i].x}
              y={positions[i].y + 5}
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
            >
              {i + 1}
            </text>
          </motion.g>
        ))}
      </svg>
      
      <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#334155' }}>{steps[step].title}</h3>
        <p style={{ margin: 0, color: '#64748b', lineHeight: '1.6' }}>{steps[step].explanation}</p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>Previous</button>
        <button onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1}>Next</button>
        <button onClick={() => setStep(0)}>Restart</button>
      </div>
    </div>
  );
}

/**
 * Generic Concept Component
 */
export function GenericExplanation({ topic = 'this concept' }: { topic?: string }) {
  const [step, setStep] = useState(0);
  
  const steps = [
    { title: "Introduction", explanation: `Let's explore ${topic} step by step.` },
    { title: "Core Concept", explanation: "The main idea centers around key principles." },
    { title: "Components", explanation: "Multiple components work together in this system." },
    { title: "Relationships", explanation: "Understanding how parts connect is crucial." },
    { title: "Summary", explanation: "Putting it all together gives us the complete picture." }
  ];
  
  return (
    <div style={{ padding: '20px', maxWidth: '600px', fontFamily: 'system-ui' }}>
      <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#334155' }}>{steps[step].title}</h3>
        <p style={{ margin: 0, color: '#64748b', lineHeight: '1.6' }}>{steps[step].explanation}</p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>Previous</button>
        <button onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1}>Next</button>
        <button onClick={() => setStep(0)}>Restart</button>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '10px', color: '#94a3b8', fontSize: '14px' }}>
        Step {step + 1} of {steps.length}
      </div>
    </div>
  );
}

/**
 * Get component by topic
 */
export function getPrebuiltComponent(query: string) {
  const queryLower = query.toLowerCase();

  // Technology/AI topics
  if (
    queryLower.includes('ai') ||
    queryLower.includes('algorithm') ||
    queryLower.includes('data') ||
    queryLower.includes('network') ||
    queryLower.includes('system') ||
    queryLower.includes('engine')
  ) {
    return TechnologyExplanation;
  }

  // Science/Process topics
  if (
    queryLower.includes('process') ||
    queryLower.includes('cycle') ||
    queryLower.includes('photosynthesis') ||
    queryLower.includes('biology') ||
    queryLower.includes('chemistry')
  ) {
    return ScienceExplanation;
  }

  // Generic fallback
  return GenericExplanation;
}

