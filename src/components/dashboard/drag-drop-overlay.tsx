"use client";

import { useState } from 'react';
import { Upload, FileImage, File } from 'lucide-react';

interface DragDropOverlayProps {
  onFilesDrop: (files: File[]) => void;
  children: React.ReactNode;
}

export function DragDropOverlay({ onFilesDrop, children }: DragDropOverlayProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || 
      file.type === 'application/pdf' ||
      file.name.endsWith('.svg')
    );

    if (validFiles.length > 0) {
      onFilesDrop(validFiles);
    }
  };

  return (
    <div
      className="relative w-full h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-[#6366F1] bg-opacity-20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl border-2 border-dashed border-[#6366F1]">
            <div className="text-center space-y-4">
              <Upload className="h-12 w-12 mx-auto text-[#6366F1]" />
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  Drop Files Here
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Supports: Images (PNG, JPG, SVG), PDFs
                </p>
              </div>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <FileImage className="h-3 w-3" />
                  <span>Images</span>
                </div>
                <div className="flex items-center space-x-1">
                  <File className="h-3 w-3" />
                  <span>PDFs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
