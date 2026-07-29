"use client";

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  X, 
  Palette, 
  Grid3X3, 
  FileImage,
  Trash2,
  Upload
} from 'lucide-react';

interface BackgroundPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  currentImage: string | null;
  onColorChange: (color: string) => void;
  onImageChange: (imageUrl: string | null) => void;
  onPatternChange: (pattern: string) => void;
  currentPattern?: string;
}

const colors = [
  '#ffffff', '#000000', '#f8fafc', '#1e293b', '#f1f5f9', '#0f172a',
  '#fef3c7', '#92400e', '#ddd6fe', '#5b21b6', '#fce7f3', '#be185d',
  '#d1fae5', '#166534', '#cffafe', '#155e75', '#fed7d7', '#c53030',
  '#6366F1', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'
];

const patterns = [
  { name: 'Grid', value: 'grid', icon: Grid3X3 },
  { name: 'Dots', value: 'dots', icon: Palette },
  { name: 'Lines', value: 'lines', icon: FileImage },
  { name: 'None', value: 'none', icon: Trash2 }
];

export function BackgroundPicker({
  isOpen,
  onClose,
  currentColor,
  currentImage,
  onColorChange,
  onImageChange,
  onPatternChange,
  currentPattern = 'grid'
}: BackgroundPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Background Picker Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <Card className="w-96 max-h-[80vh] overflow-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" style={{ color: '#6366F1' }} />
                <span>Background Settings</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Solid Colors */}
            <div>
              <h3 className="font-medium text-sm mb-3">Solid Colors</h3>
              <div className="grid grid-cols-6 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      onColorChange(color);
                      onImageChange(null); // Clear image when color selected
                    }}
                    className={`w-10 h-10 rounded-lg border-2 hover:scale-110 transition-transform ${
                      currentColor === color && !currentImage 
                        ? 'border-[#6366F1] scale-110' 
                        : 'border-gray-300'
                    } ${color === '#ffffff' ? 'border-gray-400' : ''}`}
                    style={{ backgroundColor: color }}
                    title={`Background: ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Background Image */}
            <div>
              <h3 className="font-medium text-sm mb-3">Background Image</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleImageUpload}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Background Image
                  <span className="ml-auto text-xs text-gray-500">JPG, PNG</span>
                </Button>
                
                {currentImage && (
                  <div className="relative">
                    <img
                      src={currentImage}
                      alt="Background preview"
                      className="w-full h-20 object-cover rounded border"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onImageChange(null)}
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-white hover:bg-gray-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Patterns */}
            <div>
              <h3 className="font-medium text-sm mb-3">Patterns</h3>
              <div className="grid grid-cols-2 gap-2">
                {patterns.map((pattern) => {
                  const Icon = pattern.icon;
                  return (
                    <Button
                      key={pattern.value}
                      onClick={() => {
                        onPatternChange(pattern.value);
                      }}
                      variant={currentPattern === pattern.value ? "default" : "outline"}
                      className={`h-12 flex-col ${
                        currentPattern === pattern.value 
                          ? 'bg-[#6366F1] text-white border-[#6366F1]' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs">{pattern.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-2 pt-4 border-t">
              <Button
                onClick={() => {
                  onColorChange('#ffffff');
                  onImageChange(null);
                  onPatternChange('none');
                }}
                variant="outline"
                className="flex-1"
              >
                Reset to White
              </Button>
              <Button
                onClick={() => {
                  // Force canvas re-render when applying
                  setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                  }, 50);
                  onClose();
                }}
                className="flex-1"
                style={{ backgroundColor: '#6366F1' }}
              >
                Apply Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
