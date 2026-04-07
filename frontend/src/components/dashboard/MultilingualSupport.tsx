import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Languages, Volume2, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { MessageKey } from '@/i18n/translations';

const RISK_KEYS: Record<'low' | 'moderate' | 'high' | 'severe', MessageKey> = {
  low: 'riskShortLow',
  moderate: 'riskShortModerate',
  high: 'riskShortHigh',
  severe: 'riskShortSevere',
};

export function MultilingualSupport() {
  const { t, locale } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakStateName = () => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(t('glossaryMaharashtra'));
    utterance.lang = locale === 'hi' ? 'hi-IN' : locale === 'mr' ? 'mr-IN' : 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
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

  const riskLevels = ['low', 'moderate', 'high', 'severe'] as const;

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Languages className="h-4 w-4" />
          {t('analysis')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">{t('location')}</p>
            <p className="text-sm font-semibold">{t('glossaryMaharashtra')}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={speakStateName}
            disabled={isSpeaking}
            className="text-xs"
            type="button"
          >
            {isSpeaking ? (
              <Volume2 className="h-3 w-3 animate-pulse" />
            ) : (
              <MessageCircle className="h-3 w-3" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-secondary/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">{t('current_year')}</p>
            <p className="text-lg font-bold text-cyan-glow">2026</p>
          </div>
          <div className="p-3 bg-secondary/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">{t('next_year')}</p>
            <p className="text-lg font-bold text-neon-green">2027</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t('riskLevelLabel')}</p>
          <div className="grid grid-cols-2 gap-2">
            {riskLevels.map((level) => (
              <Badge
                key={level}
                className={`${getRiskColor(level)} text-white text-xs justify-center py-1`}
              >
                {t(RISK_KEYS[level])}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">{t('commonTerms')}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-muted-foreground">{t('glossaryWaterLevel')}</div>
            <div className="text-muted-foreground">{t('glossaryGroundwater')}</div>
            <div className="text-muted-foreground">{t('glossaryDepth')}</div>
            <div className="text-muted-foreground">{t('glossaryPrediction')}</div>
          </div>
        </div>

        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-xs text-muted-foreground">{t('farmerSupportBlurb')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
