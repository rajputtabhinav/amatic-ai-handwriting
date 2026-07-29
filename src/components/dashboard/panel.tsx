"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  PenTool, 
  BookOpen, 
  Target, 
  Lightbulb,
  Sparkles,
  FileText,
  Palette,
  Code,
  Briefcase
} from 'lucide-react';
import { ToolType } from './canvas';

interface PanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTool: ToolType;
}

const workModes = [
  {
    id: 'handwriting',
    title: 'Handwriting',
    icon: PenTool,
    description: 'Create handwritten notes and documents',
    color: 'bg-green-100 text-green-700',
    features: [
      'Alphabet Practice',
      'Cursive Letters',
      'Word Formation',
      'Document Writing'
    ]
  },
  {
    id: 'diagrams',
    title: 'Visual Diagrams',
    icon: Target,
    description: 'Create diagrams and flowcharts',
    color: 'bg-blue-100 text-blue-700',
    features: [
      'Mind Maps',
      'Flowcharts',
      'Concept Maps',
      'Timeline Diagrams'
    ]
  },
  {
    id: 'coding',
    title: 'Code & Technical',
    icon: Code,
    description: 'Technical diagrams and documentation',
    color: 'bg-purple-100 text-purple-700',
    features: [
      'Architecture Diagrams',
      'UML Diagrams',
      'API Documentation',
      'System Design'
    ]
  },
  {
    id: 'business',
    title: 'Business',
    icon: Briefcase,
    description: 'Business planning and presentations',
    color: 'bg-orange-100 text-orange-700',
    features: [
      'Strategy Maps',
      'Process Flows',
      'Org Charts',
      'Project Plans'
    ]
  }
];

const handwritingStyles = [
  { name: 'Print', sample: 'The quick brown fox' },
  { name: 'Cursive', sample: 'The quick brown fox' },
  { name: 'Calligraphy', sample: 'The quick brown fox' },
  { name: 'Technical', sample: 'The quick brown fox' }
];

export function Panel({ isOpen, onClose, selectedTool }: PanelProps) {
  const [activeMode, setActiveMode] = useState('handwriting');

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5" style={{ color: '#6366F1' }} />
          <h2 className="font-semibold text-gray-900 dark:text-white">Tools Panel</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeMode} onValueChange={setActiveMode} className="w-full">
          <TabsList className="grid w-full grid-cols-2 m-4">
            <TabsTrigger value="handwriting">Tools</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="handwriting" className="px-4 pb-4">
            <div className="space-y-4">
              {/* Current Tool Status */}
              <Card className="border-[#6366F1]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Sparkles className="h-4 w-4" style={{ color: '#6366F1' }} />
                    <span>Active Tool</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-[#6366F1] text-white">
                      {selectedTool}
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedTool === 'handwriting' ? 'AI-guided handwriting' : `${selectedTool} tool selected`}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Work Modes */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Work Modes</h3>
                {workModes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <Card key={mode.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${mode.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                              {mode.title}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                              {mode.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {mode.features.slice(0, 2).map((feature) => (
                                <Badge key={feature} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                              {mode.features.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{mode.features.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Handwriting Styles */}
              {selectedTool === 'handwriting' && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">Handwriting Styles</h3>
                  <div className="space-y-2">
                    {handwritingStyles.map((style) => (
                      <Card key={style.name} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">{style.name}</span>
                            <Button variant="outline" size="sm">
                              Try
                            </Button>
                          </div>
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-600 rounded text-sm font-handwriting">
                            {style.sample}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="px-4 pb-4">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Quick Templates</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Lined Paper', icon: FileText },
                  { name: 'Graph Paper', icon: Target },
                  { name: 'Dot Grid', icon: Palette },
                  { name: 'Blank Canvas', icon: Lightbulb }
                ].map((template) => {
                  const Icon = template.icon;
                  return (
                    <Card key={template.name} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3 text-center">
                        <Icon className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                        <span className="text-xs font-medium">{template.name}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Button className="w-full" style={{ backgroundColor: '#6366F1' }}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Template
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Keep backward compatibility alias
export { Panel as LearningPanel };

