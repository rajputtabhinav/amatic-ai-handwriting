"use client";

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Copy, 
  Trash2, 
  Image, 
  Download, 
  Edit, 
  Palette,
  Square,
  Type
} from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  isVisible: boolean;
  selectedElements: string[];
  hasTextSelected: boolean;
  onClose: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onImportImage: (file: File) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onChangeBackground: () => void;
  onExportPDF: () => void;
  onExportImage: () => void;
}

export function ContextMenu({
  x,
  y,
  isVisible,
  selectedElements,
  hasTextSelected,
  onClose,
  onCopy,
  onDelete,
  onImportImage,
  onEdit,
  onDuplicate,
  onChangeBackground,
  onExportPDF,
  onExportImage
}: ContextMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isVisible) return null;

  const handleImageImport = () => {
    fileInputRef.current?.click();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.endsWith('.svg')) {
        onImportImage(file);
      }
    });
    // Reset input
    e.target.value = '';
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.svg"
        onChange={handleFileChange}
        className="hidden"
        multiple
      />
      
      {/* Context Menu */}
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-48"
        style={{
          left: x,
          top: y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Text-specific options */}
        {hasTextSelected && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onCopy(); onClose(); }}
              className="w-full justify-start px-3 py-2 h-auto text-sm"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Text
              <span className="ml-auto text-xs text-gray-500">Ctrl+C</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onEdit(); onClose(); }}
              className="w-full justify-start px-3 py-2 h-auto text-sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Text
            </Button>
            
            <div className="border-b border-gray-200 dark:border-gray-700 my-2" />
          </>
        )}

        {/* General selection options */}
        {selectedElements.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onDuplicate(); onClose(); }}
              className="w-full justify-start px-3 py-2 h-auto text-sm"
            >
              <Square className="h-4 w-4 mr-2" />
              Duplicate
              <span className="ml-auto text-xs text-gray-500">Ctrl+D</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onDelete(); onClose(); }}
              className="w-full justify-start px-3 py-2 h-auto text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
              <span className="ml-auto text-xs text-gray-500">Del</span>
            </Button>
            
            <div className="border-b border-gray-200 dark:border-gray-700 my-2" />
          </>
        )}

        {/* Canvas options */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleImageImport}
          className="w-full justify-start px-3 py-2 h-auto text-sm"
        >
          <Image className="h-4 w-4 mr-2" />
          Import File
          <span className="ml-auto text-xs text-gray-500">IMG, PDF</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { onClose(); }}
          className="w-full justify-start px-3 py-2 h-auto text-sm"
        >
          <Type className="h-4 w-4 mr-2" />
          Add Text Here
        </Button>
        
        <div className="border-b border-gray-200 dark:border-gray-700 my-2" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { 
            onChangeBackground(); 
            onClose(); 
          }}
          className="w-full justify-start px-3 py-2 h-auto text-sm"
        >
          <Palette className="h-4 w-4 mr-2" />
          Change Background
        </Button>
        
        <div className="border-b border-gray-200 dark:border-gray-700 my-2" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { onExportPDF(); onClose(); }}
          className="w-full justify-start px-3 py-2 h-auto text-sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Export as PDF
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { onExportImage(); onClose(); }}
          className="w-full justify-start px-3 py-2 h-auto text-sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Export as Image
        </Button>
      </div>
      
      {/* Backdrop to close menu */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
    </>
  );
}
