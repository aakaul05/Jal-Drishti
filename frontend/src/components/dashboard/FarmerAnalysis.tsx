import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Droplets, TrendingUp, Calendar, MapPin, Volume2 } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { useLanguage } from '@/context/LanguageContext';
import type { MessageKey } from '@/i18n/translations';

interface FarmerAnalysisModel {
  waterLevel: 'good' | 'moderate' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  recommendation: string;
  actionItems: string[];
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildAnalysis(regionId: string, t: (k: MessageKey) => string): FarmerAnalysisModel {
  const h = hashStr(regionId);
  const waterLevel = (['good', 'moderate', 'critical'] as const)[h % 3];
  const trend = (['improving', 'stable', 'declining'] as const)[(h >> 3) % 3];

  let recommendation = '';
  let actionItems: string[] = [];

  if (waterLevel === 'good') {
    recommendation = t('fa_rec_good');
    actionItems = [t('fa_act_good_1'), t('fa_act_good_2'), t('fa_act_good_3')];
  } else if (waterLevel === 'moderate') {
    recommendation = t('fa_rec_moderate');
    actionItems = [t('fa_act_mod_1'), t('fa_act_mod_2'), t('fa_act_mod_3')];
  } else {
    recommendation = t('fa_rec_critical');
    actionItems = [t('fa_act_crit_1'), t('fa_act_crit_2'), t('fa_act_crit_3'), t('fa_act_crit_4')];
  }

  return { waterLevel, trend, recommendation, actionItems };
}

export function FarmerAnalysis() {
  const { selectedRegion, selectedMonth, selectedYear } = useDashboard();
  const { t, locale } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const analysis = useMemo(
    () => (selectedRegion ? buildAnalysis(selectedRegion.id, t) : null),
    [selectedRegion, t]
  );

  const speakAnalysis = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === 'hi' ? 'hi-IN' : locale === 'mr' ? 'mr-IN' : 'en-IN';
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  const getWaterLevelColor = (level: string) => {
    switch (level) {
      case 'good': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getWaterLevelIcon = (level: string) => {
    switch (level) {
      case 'good': return <CheckCircle className="h-5 w-5" />;
      case 'moderate': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
      default: return <Droplets className="h-5 w-5" />;
    }
  };

  const getTrendIcon = (tr: string) => (
    <TrendingUp className={`h-4 w-4 ${tr === 'declining' ? 'rotate-180 text-red-500' : 'text-green-500'}`} />
  );

  const monthLabel =
    selectedMonth != null ? t(`month_${selectedMonth}` as MessageKey) : '';

  if (!selectedRegion || !analysis) {
    return (
      <Card className="glass-strong border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            {t('farmerAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-center">
            {t('pleaseSelectRegion')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            {t('farmerAnalysis')}
          </CardTitle>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? t('expandLess') : t('expandMore')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <div className="flex justify-center mb-2">
              {getWaterLevelIcon(analysis.waterLevel)}
            </div>
            <p className="text-xs text-muted-foreground">{t('waterLevelStatus')}</p>
            <Badge
              className={`${getWaterLevelColor(analysis.waterLevel)} text-white text-xs`}
            >
              {analysis.waterLevel === 'good'
                ? t('wlGood')
                : analysis.waterLevel === 'moderate'
                  ? t('wlModerate')
                  : t('wlCritical')}
            </Badge>
          </div>

          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <div className="flex justify-center mb-2">
              {getTrendIcon(analysis.trend)}
            </div>
            <p className="text-xs text-muted-foreground">{t('trendStatus')}</p>
            <Badge
              className={`${analysis.trend === 'improving' ? 'bg-green-500' :
                analysis.trend === 'stable' ? 'bg-blue-500' : 'bg-red-500'} text-white text-xs`}
            >
              {analysis.trend === 'improving'
                ? t('trImproving')
                : analysis.trend === 'stable'
                  ? t('trStable')
                  : t('trDeclining')}
            </Badge>
          </div>

          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <Calendar className="h-5 w-5 mx-auto mb-2 text-cyan-glow" />
            <p className="text-xs text-muted-foreground">{t('periodLabel')}</p>
            <p className="text-sm font-bold">
              {selectedMonth != null && selectedYear != null
                ? `${monthLabel} ${selectedYear}`
                : '—'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-secondary/30 rounded-lg border-l-4 border-cyan-glow">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                {analysis.recommendation}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedRegion.name} • {selectedRegion.district}
              </p>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 bg-secondary/30 rounded-lg">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t('actionItemsHeading')}
            </h4>

            <div className="grid grid-cols-1 gap-2">
              {analysis.actionItems.map((action, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-background/50 rounded border border-border/30"
                >
                  <span className="text-cyan-glow font-bold">{index + 1}.</span>
                  <span className="text-sm">{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center mt-4">
          <Button
            onClick={() => speakAnalysis(analysis.recommendation)}
            disabled={isSpeaking}
            className="w-full"
            variant="outline"
          >
            {isSpeaking ? (
              <Volume2 className="h-4 w-4 animate-pulse mr-2" />
            ) : (
              <Volume2 className="h-4 w-4 mr-2" />
            )}
            {isSpeaking ? t('speaking') : t('listenAnalysis')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
