"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Volume2, 
  Mic, 
  Settings, 
  Globe,
  User,
  TestTube,
  Crown
} from "lucide-react";
import VoiceSelector from "@/components/voice/voice-selector";
import VoiceOutput from "@/components/voice/voice-output";
import { PREMIUM_VOICES } from "@/lib/voice/voice-types";

export function VoiceSettings() {
  // Voice settings state
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoPlayResponses, setAutoPlayResponses] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState(PREMIUM_VOICES[0].voice_id);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voiceVolume, setVoiceVolume] = useState(80);
  const [voiceStability, setVoiceStability] = useState(0.5);
  const [voiceSimilarity, setVoiceSimilarity] = useState(0.8);
  const [voiceStyle, setVoiceStyle] = useState(0.0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Speech recognition settings
  const [speechRecognitionEnabled, setSpeechRecognitionEnabled] = useState(true);
  const [autoSubmitVoice, setAutoSubmitVoice] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState("en-US");
  const [speechTimeout, setSpeechTimeout] = useState(5000);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('voice-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setVoiceEnabled(settings.voiceEnabled ?? true);
        setAutoPlayResponses(settings.autoPlayResponses ?? false);
        setSelectedVoiceId(settings.selectedVoiceId ?? PREMIUM_VOICES[0].voice_id);
        setVoiceSpeed(settings.voiceSpeed ?? 1.0);
        setVoiceVolume(settings.voiceVolume ?? 80);
        setVoiceStability(settings.voiceStability ?? 0.5);
        setVoiceSimilarity(settings.voiceSimilarity ?? 0.8);
        setVoiceStyle(settings.voiceStyle ?? 0.0);
        setSpeechRecognitionEnabled(settings.speechRecognitionEnabled ?? true);
        setAutoSubmitVoice(settings.autoSubmitVoice ?? true);
        setVoiceLanguage(settings.voiceLanguage ?? "en-US");
        setSpeechTimeout(settings.speechTimeout ?? 5000);
      }
    } catch (error) {
      console.error('Error loading voice settings:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback(() => {
    try {
      const settings = {
        voiceEnabled,
        autoPlayResponses,
        selectedVoiceId,
        voiceSpeed,
        voiceVolume,
        voiceStability,
        voiceSimilarity,
        voiceStyle,
        speechRecognitionEnabled,
        autoSubmitVoice,
        voiceLanguage,
        speechTimeout
      };
      localStorage.setItem('voice-settings', JSON.stringify(settings));
      
      // Dispatch custom event
      if (typeof window !== 'undefined') {
        interface WindowWithVoiceSettings extends Window {
          voiceSettings?: typeof settings;
        }
        (window as WindowWithVoiceSettings).voiceSettings = settings;
        window.dispatchEvent(new CustomEvent('voiceSettingsChanged', { detail: settings }));
      }
    } catch (error) {
      console.error('Error saving voice settings:', error);
    }
  }, [voiceEnabled, autoPlayResponses, selectedVoiceId, voiceSpeed, voiceVolume, voiceStability, voiceSimilarity, voiceStyle, speechRecognitionEnabled, autoSubmitVoice, voiceLanguage, speechTimeout]);

  // Auto-save settings when they change
  useEffect(() => {
    if (isLoaded) {
      saveSettings();
    }
  }, [
    voiceEnabled, autoPlayResponses, selectedVoiceId, voiceSpeed, voiceVolume,
    voiceStability, voiceSimilarity, voiceStyle, speechRecognitionEnabled,
    autoSubmitVoice, voiceLanguage, speechTimeout, saveSettings
  ]);

  const handleVoiceError = (error: string) => {
    console.error('Voice error:', error);
  };

  const resetToDefaults = useCallback(() => {
    setVoiceEnabled(true);
    setAutoPlayResponses(false);
    setSelectedVoiceId(PREMIUM_VOICES[0].voice_id);
    setVoiceSpeed(1.0);
    setVoiceVolume(80);
    setVoiceStability(0.5);
    setVoiceSimilarity(0.8);
    setVoiceStyle(0.0);
    setSpeechRecognitionEnabled(true);
    setAutoSubmitVoice(true);
    setVoiceLanguage("en-US");
    setSpeechTimeout(5000);
  }, []);

  return (
    <div className="space-y-6">
      {/* Main Voice Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5" />
            <span>Voice Assistant</span>
          </CardTitle>
          <CardDescription>
            Configure your AI voice assistant with premium voices and speech recognition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-gray-100">
            <div className="space-y-1">
              <Label className="text-base font-medium">Enable Voice Assistant</Label>
              <p className="text-sm text-gray-600">
                Turn on voice responses and speech recognition features
              </p>
            </div>
            <Switch
              checked={voiceEnabled}
              onCheckedChange={setVoiceEnabled}
            />
          </div>

          {voiceEnabled && (
            <>
              {/* Auto-play Setting */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Auto-play Responses</Label>
                  <p className="text-sm text-gray-600">
                    Automatically play AI responses with voice
                  </p>
                </div>
                <Switch
                  checked={autoPlayResponses}
                  onCheckedChange={setAutoPlayResponses}
                />
              </div>

              {/* Voice Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <Label className="text-base font-medium">AI Voice Selection</Label>
                  <Badge variant="secondary" className="ml-2">
                    <Crown className="h-3 w-3 mr-1" />
                    100+ Premium Voices
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Choose from professional voices with different accents and styles
                </p>
                <VoiceSelector
                  selectedVoiceId={selectedVoiceId}
                  onVoiceChange={setSelectedVoiceId}
                  showTestButton={true}
                />
              </div>

              {/* Voice Test */}
              <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-2">
                  <TestTube className="w-5 h-5" style={{ color: '#6366F1' }} />
                  <Label className="text-base font-medium">Test Voice Settings</Label>
                </div>
                <VoiceOutput
                  text="Hello! This is how I will sound when responding to your questions. You can adjust my voice settings below to customize how I speak to you."
                  voiceId={selectedVoiceId}
                  autoPlay={false}
                  showControls={true}
                  onError={handleVoiceError}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Advanced Voice Settings */}
      {voiceEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 w-5" />
              <span>Advanced Voice Settings</span>
            </CardTitle>
            <CardDescription>
              Fine-tune voice quality and speech parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Voice Speed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Speech Speed</Label>
                <span className="text-sm text-gray-600">{voiceSpeed}x</span>
              </div>
              <Slider
                value={[voiceSpeed]}
                onValueChange={([value]) => setVoiceSpeed(value)}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Adjust how fast the AI speaks</p>
            </div>

            {/* Voice Volume */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Volume</Label>
                <span className="text-sm text-gray-600">{voiceVolume}%</span>
              </div>
              <Slider
                value={[voiceVolume]}
                onValueChange={([value]) => setVoiceVolume(value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Control the output volume</p>
            </div>

            {/* Voice Stability */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Voice Stability</Label>
                <span className="text-sm text-gray-600">{voiceStability.toFixed(1)}</span>
              </div>
              <Slider
                value={[voiceStability]}
                onValueChange={([value]) => setVoiceStability(value)}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Higher values make voice more consistent</p>
            </div>

            {/* Voice Clarity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Voice Clarity</Label>
                <span className="text-sm text-gray-600">{voiceSimilarity.toFixed(1)}</span>
              </div>
              <Slider
                value={[voiceSimilarity]}
                onValueChange={([value]) => setVoiceSimilarity(value)}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Higher values improve voice quality</p>
            </div>

            {/* Voice Expressiveness */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Voice Expressiveness</Label>
                <span className="text-sm text-gray-600">{voiceStyle.toFixed(1)}</span>
              </div>
              <Slider
                value={[voiceStyle]}
                onValueChange={([value]) => setVoiceStyle(value)}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Higher values make voice more expressive</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Speech Recognition Settings */}
      {voiceEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mic className="w-5 h-5" />
              <span>Speech Recognition</span>
            </CardTitle>
            <CardDescription>
              Configure voice input and speech-to-text settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Speech Recognition Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-medium">Enable Voice Input</Label>
                <p className="text-sm text-gray-600">Allow speaking to the AI assistant</p>
              </div>
              <Switch
                checked={speechRecognitionEnabled}
                onCheckedChange={setSpeechRecognitionEnabled}
              />
            </div>

            {speechRecognitionEnabled && (
              <>
                {/* Auto Submit */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-medium">Auto-submit Voice Messages</Label>
                    <p className="text-sm text-gray-600">Automatically send transcribed messages</p>
                  </div>
                  <Switch
                    checked={autoSubmitVoice}
                    onCheckedChange={setAutoSubmitVoice}
                  />
                </div>

                {/* Language Selection */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <Label className="font-medium">Speech Language</Label>
                  </div>
                  <Select value={voiceLanguage} onValueChange={setVoiceLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="en-AU">English (Australia)</SelectItem>
                      <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
                      <SelectItem value="es-MX">Spanish (Mexico)</SelectItem>
                      <SelectItem value="fr-FR">French</SelectItem>
                      <SelectItem value="de-DE">German</SelectItem>
                      <SelectItem value="it-IT">Italian</SelectItem>
                      <SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
                      <SelectItem value="ru-RU">Russian</SelectItem>
                      <SelectItem value="ja-JP">Japanese</SelectItem>
                      <SelectItem value="ko-KR">Korean</SelectItem>
                      <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                      <SelectItem value="hi-IN">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Speech Timeout */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Speech Timeout</Label>
                    <span className="text-sm text-gray-600">{speechTimeout / 1000}s</span>
                  </div>
                  <Slider
                    value={[speechTimeout]}
                    onValueChange={([value]) => setSpeechTimeout(value)}
                    min={2000}
                    max={10000}
                    step={500}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">Time to wait for speech input</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Usage This Month</CardTitle>
          <CardDescription>
            Track your voice feature usage and limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Voice Generations</span>
              <span>47 / 1,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full" 
                style={{ width: '4.7%', backgroundColor: '#6366F1' }} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Voice Input Sessions</span>
              <span>23 / 500</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full" 
                style={{ width: '4.6%', backgroundColor: '#6366F1' }} 
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm font-medium">Need more voice features?</p>
              <p className="text-xs text-gray-600">Upgrade to get unlimited voice generations</p>
            </div>
            <Button 
              size="sm"
              className="text-white rounded-xl"
              style={{ backgroundColor: '#6366F1' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366F1'}
            >
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={resetToDefaults}
          className="border-gray-200 text-gray-700 hover:text-gray-900 rounded-xl"
        >
          Reset to Defaults
        </Button>
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Settings saved automatically</span>
        </div>
      </div>
    </div>
  );
}