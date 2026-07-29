'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Play, 
  Pause, 
  Volume2, 
  Users, 
  Globe,
  Zap,
  Star,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Voice, PREMIUM_VOICES } from '@/lib/voice/voice-types';

interface VoiceSelectorProps {
  selectedVoiceId?: string;
  onVoiceChange: (voiceId: string) => void;
  className?: string;
  showTestButton?: boolean;
}

export default function VoiceSelector({
  selectedVoiceId,
  onVoiceChange,
  className,
  showTestButton = true
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>(PREMIUM_VOICES);
  const [filteredVoices, setFilteredVoices] = useState<Voice[]>(PREMIUM_VOICES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccent, setSelectedAccent] = useState<string>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('voice-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('voice-favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Load available voices
  useEffect(() => {
    const loadVoices = async () => {
      setIsLoading(true);
      try {
        // Use premium voices as default
        setVoices(PREMIUM_VOICES);
        setFilteredVoices(PREMIUM_VOICES);
      } catch (error) {
        console.error('Error loading voices:', error);
        // Fallback to premium voices
        setVoices(PREMIUM_VOICES);
        setFilteredVoices(PREMIUM_VOICES);
      } finally {
        setIsLoading(false);
      }
    };

    loadVoices();
  }, []);

  // Filter voices based on search and filters
  useEffect(() => {
    let filtered = voices;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(voice => 
        voice.name.toLowerCase().includes(searchLower) ||
        voice.description?.toLowerCase().includes(searchLower) ||
        voice.accent?.toLowerCase().includes(searchLower) ||
        voice.use_case?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'favorites') {
        filtered = filtered.filter(voice => favorites.includes(voice.voice_id));
      } else {
        filtered = filtered.filter(voice => voice.category === selectedCategory);
      }
    }

    // Accent filter
    if (selectedAccent !== 'all') {
      filtered = filtered.filter(voice => 
        voice.accent?.toLowerCase().includes(selectedAccent.toLowerCase())
      );
    }

    setFilteredVoices(filtered);
  }, [voices, searchTerm, selectedCategory, selectedAccent, favorites]);

  // Get selected voice info
  const selectedVoice = voices.find(voice => voice.voice_id === selectedVoiceId);

  // Get unique accents
  const accents = Array.from(new Set(voices.map(voice => voice.accent).filter(Boolean))).sort();

  // Test voice with sample text
  const testVoice = async (voiceId: string) => {
    if (playingVoiceId === voiceId) {
      // Stop if already playing
      setPlayingVoiceId(null);
      return;
    }

    setPlayingVoiceId(voiceId);

    try {
      // Voice testing disabled for now to prevent Node.js conflicts
      // Will be implemented with proper audio playback
    } catch (error) {
      console.error('Error testing voice:', error);
    } finally {
      setPlayingVoiceId(null);
    }
  };

  // Toggle favorite
  const toggleFavorite = (voiceId: string) => {
    setFavorites(prev => 
      prev.includes(voiceId)
        ? prev.filter(id => id !== voiceId)
        : [...prev, voiceId]
    );
  };

  // Handle voice selection
  const handleVoiceSelect = (voiceId: string) => {
    onVoiceChange(voiceId);
    setIsOpen(false);
  };

  // Get category icon
  const getCategoryIcon = (category: Voice['category']) => {
    switch (category) {
      case 'male': return <Users className="w-4 h-4" />;
      case 'female': return <Users className="w-4 h-4" />;
      case 'child': return <Star className="w-4 h-4" />;
      case 'elderly': return <Users className="w-4 h-4" />;
      case 'character': return <Zap className="w-4 h-4" />;
      default: return <Volume2 className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn("voice-selector", className)}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span className="truncate">
                {selectedVoice ? selectedVoice.name : 'Select Voice'}
              </span>
              {selectedVoice && (
                <Badge variant="secondary" className="text-xs">
                  {selectedVoice.accent}
                </Badge>
              )}
            </div>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-4xl max-h-[80vh] p-0" aria-describedby="voice-selector-description">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Choose Your AI Voice
              <Badge variant="outline" className="ml-2">
                {filteredVoices.length} voices
              </Badge>
            </DialogTitle>
            <div id="voice-selector-description" className="sr-only">
              Select from 100+ premium voices with different accents, ages, and use cases for your AI assistant
            </div>
          </DialogHeader>

          <div className="px-6">
            {/* Search and Filters */}
            <div className="space-y-4 mb-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search voices by name, accent, or use case..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter tabs */}
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="favorites">
                    <Heart className="w-4 h-4 mr-1" />
                    Favorites
                  </TabsTrigger>
                  <TabsTrigger value="male">Male</TabsTrigger>
                  <TabsTrigger value="female">Female</TabsTrigger>
                  <TabsTrigger value="character">Character</TabsTrigger>
                  <TabsTrigger value="child">Child</TabsTrigger>
                  <TabsTrigger value="elderly">Elderly</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Accent filter */}
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <Select value={selectedAccent} onValueChange={setSelectedAccent}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by accent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accents</SelectItem>
                    {accents.filter(accent => accent).map(accent => (
                      <SelectItem key={accent} value={accent!}>
                        {accent}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Voice Grid */}
          <ScrollArea className="flex-1 px-6 pb-6" style={{ maxHeight: '400px' }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="ml-2">Loading voices...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVoices.map((voice, index) => (
                  <div
                    key={`${voice.voice_id}-${index}`}
                    className={cn(
                      "relative p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                      selectedVoiceId === voice.voice_id && "border-primary bg-primary/5"
                    )}
                    onClick={() => handleVoiceSelect(voice.voice_id)}
                  >
                    {/* Favorite button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(voice.voice_id);
                      }}
                    >
                      <Heart 
                        className={cn(
                          "w-3 h-3",
                          favorites.includes(voice.voice_id) && "fill-red-500 text-red-500"
                        )} 
                      />
                    </Button>

                    {/* Voice info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(voice.category)}
                        <h3 className="font-medium truncate">{voice.name}</h3>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {voice.accent}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {voice.category}
                        </Badge>
                        {voice.age && (
                          <Badge variant="outline" className="text-xs">
                            {voice.age}
                          </Badge>
                        )}
                      </div>

                      {voice.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {voice.description}
                        </p>
                      )}

                      {voice.use_case && (
                        <p className="text-xs font-medium text-blue-600">
                          {voice.use_case}
                        </p>
                      )}

                      {/* Test button */}
                      {showTestButton && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            testVoice(voice.voice_id);
                          }}
                          disabled={playingVoiceId === voice.voice_id}
                        >
                          {playingVoiceId === voice.voice_id ? (
                            <>
                              <Pause className="w-3 h-3 mr-1" />
                              Playing...
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Test Voice
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Selected indicator */}
                    {selectedVoiceId === voice.voice_id && (
                      <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isLoading && filteredVoices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Volume2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No voices found matching your criteria</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Selected voice preview */}
      {selectedVoice && (
        <div className="mt-2 p-2 bg-muted rounded text-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{selectedVoice.name}</span>
              <span className="text-muted-foreground ml-2">• {selectedVoice.accent}</span>
            </div>
            {showTestButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => testVoice(selectedVoice.voice_id)}
                disabled={playingVoiceId === selectedVoice.voice_id}
                className="h-6 px-2"
              >
                {playingVoiceId === selectedVoice.voice_id ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
          {selectedVoice.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {selectedVoice.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
