import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Languages, Globe, Volume2, MessageCircle } from 'lucide-react';

// Marathi translations for farmers
const marathiTranslations = {
  // Water level terms
  'water_level': 'पाणी पातळी',
  'groundwater': 'भूजल पाणी',
  'depth': 'खोल',
  'feet': 'फूट',
  'year': 'वर्ष',
  'month': 'महिना',
  'prediction': 'अंदाज',
  'analysis': 'विश्लेषण',
  'risk': 'जोखीम',
  'advisory': 'सल्ला',
  'location': 'ठीकाण',
  'level': 'स्तर',
  
  // Time periods
  'january': 'जानेवारी',
  'february': 'फेब्रुवारी', 
  'march': 'मार्च',
  'april': 'एप्रिल',
  'may': 'मे',
  'june': 'जून',
  'july': 'जुलै',
  'august': 'ऑगस्ट',
  'september': 'सप्टेंबर',
  'october': 'ऑक्टोबर',
  'november': 'नोव्हेंबर',
  'december': 'डिसेंबर',
  
  // Regions
  'maharashtra': 'महाराष्ट्र',
  'district': 'जिल्हा',
  'village': 'गाव',
  
  // Actions
  'select_region': 'क्षेत्र निवडा',
  'view_details': 'तपशील पहा',
  'get_advisory': 'सल्ला मिळवा',
  'current_year': 'चालू वर्ष',
  'next_year': 'पुढीला वर्ष',
  
  // Risk levels
  'low': 'कमी',
  'moderate': 'मध्यम',
  'high': 'जास्त',
  'severe': 'अत्यंत'
};

// English for reference
const englishTranslations = {
  'water_level': 'Water Level',
  'groundwater': 'Groundwater',
  'depth': 'Depth',
  'feet': 'feet',
  'year': 'Year',
  'month': 'Month',
  'prediction': 'Prediction',
  'analysis': 'Analysis',
  'risk': 'Risk',
  'advisory': 'Advisory',
  'select_region': 'Select Region',
  'view_details': 'View Details',
  'get_advisory': 'Get Advisory',
  'current_year': 'Current Year',
  'next_year': 'Next Year',
  'low': 'Low',
  'moderate': 'Moderate', 
  'high': 'High',
  'severe': 'Severe'
};

export function MultilingualSupport() {
  const [language, setLanguage] = useState<'en' | 'mr'>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const translations = language === 'mr' ? marathiTranslations : englishTranslations;
  
  // Text-to-speech for Marathi
  const speakText = (text: string) => {
    if ('speechSynthesis' in window && language === 'mr') {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'mr';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
    }
  };
  
  const translateMonth = (month: string) => {
    const monthKey = month.toLowerCase();
    return translations[monthKey as keyof typeof translations] || month;
  };
  
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'severe': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Languages className="h-4 w-4" />
            {translations.analysis}
          </CardTitle>
          
          {/* Language Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="text-xs"
            >
              English
            </Button>
            <Button
              variant={language === 'mr' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('mr')}
              className="text-xs"
            >
              मराठठी
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Location Info */}
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">{translations.location}</p>
            <p className="text-sm font-semibold">{marathiTranslations.maharashtra}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => speakText(marathiTranslations.maharashtra)}
            disabled={isSpeaking || language === 'en'}
            className="text-xs"
          >
            {isSpeaking ? (
              <Volume2 className="h-3 w-3 animate-pulse" />
            ) : (
              <MessageCircle className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-secondary/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">{translations.current_year}</p>
            <p className="text-lg font-bold text-cyan-glow">2026</p>
          </div>
          <div className="p-3 bg-secondary/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">{translations.next_year}</p>
            <p className="text-lg font-bold text-neon-green">2027</p>
          </div>
        </div>

        {/* Risk Levels */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{translations.risk} {marathiTranslations.level}</p>
          <div className="grid grid-cols-2 gap-2">
            {(['low', 'moderate', 'high', 'severe'] as const).map((level) => (
              <Badge 
                key={level}
                className={`${getRiskColor(level)} text-white text-xs justify-center py-1`}
              >
                {translations[level]}
              </Badge>
            ))}
          </div>
        </div>

        {/* Common Terms */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">Common Terms:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>{translations.water_level}:</span>
              <span className="font-mono">{translations.water_level}</span>
            </div>
            <div className="flex justify-between">
              <span>{translations.groundwater}:</span>
              <span className="font-mono">{translations.groundwater}</span>
            </div>
            <div className="flex justify-between">
              <span>{translations.depth}:</span>
              <span className="font-mono">{translations.depth}</span>
            </div>
            <div className="flex justify-between">
              <span>{translations.prediction}:</span>
              <span className="font-mono">{translations.prediction}</span>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-xs text-muted-foreground">
            {language === 'mr' 
              ? '🌾 महाराष्ट्रातील शेतकऱ्यांसाठी वापरा सोपा देत आहे. मराठठीमध्यम भाषेत समजून घेतल्या जाई.'
              : '🌾 Maharashtra farmer support with Marathi language assistance.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
