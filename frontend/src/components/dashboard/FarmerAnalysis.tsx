import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Droplets, TrendingUp, Calendar, MapPin, Volume2 } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';

interface FarmerAnalysis {
  waterLevel: 'good' | 'moderate' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  recommendation: string;
  actionItems: string[];
}

export function FarmerAnalysis() {
  const { selectedRegion, selectedMonth, selectedYear } = useDashboard();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Generate farmer-friendly analysis based on region and time
  const generateAnalysis = (): FarmerAnalysis => {
    // Simulate analysis based on water level data
    const waterLevel = Math.random() > 0.5 ? 'good' : Math.random() > 0.3 ? 'moderate' : 'critical';
    const trend = Math.random() > 0.6 ? 'improving' : Math.random() > 0.3 ? 'stable' : 'declining';
    
    let recommendation = '';
    let actionItems: string[] = [];
    
    if (waterLevel === 'good') {
      recommendation = 'पाणी पातळी चांगल आहे. वर्तमान वापरस वापरा घेता.';
      actionItems = [
        'वर्तमान वापरा घेता',
        'योग्य पाणी वापरा',
        'पिक वापरा चांगल'
      ];
    } else if (waterLevel === 'moderate') {
      recommendation = 'पाणी पातळी मध्यम आहे. जास्त वापरा करा.';
      actionItems = [
        'जास्त बचाव करा',
        'पाणी बचाव करा',
        'पाणी साचव करा'
      ];
    } else {
      recommendation = 'पाणी पातळी अत्यंत आहे. तात्काल मिळवा घेतील गरज.';
      actionItems = [
        'तात्काल मिळवा घेतील गरज',
        'डीजल पंप वापरा',
        'शासक घेतील पाणी',
        'वैज्ञानिकांचे संपर्क करा'
      ];
    }
    
    return { waterLevel, trend, recommendation, actionItems };
  };

  const analysis = generateAnalysis();

  const speakMarathi = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'mr';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
    }
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

  const getTrendIcon = (trend: string) => {
    return <TrendingUp className={`h-4 w-4 ${trend === 'declining' ? 'rotate-180 text-red-500' : 'text-green-500'}`} />;
  };

  if (!selectedRegion) {
    return (
      <Card className="glass-strong border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Farmer Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-center">
            कृपया निवडा निवडा करा
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
            Farmer Analysis
          </CardTitle>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? 'कमी करा' : 'अधिक'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Status */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <div className="flex justify-center mb-2">
              {getWaterLevelIcon(analysis.waterLevel)}
            </div>
            <p className="text-xs text-muted-foreground">पाणी स्तर</p>
            <Badge 
              className={`${getWaterLevelColor(analysis.waterLevel)} text-white text-xs`}
            >
              {analysis.waterLevel === 'good' ? 'चांगल' : 
               analysis.waterLevel === 'moderate' ? 'मध्यम' : 'अत्यंत'}
            </Badge>
          </div>
          
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <div className="flex justify-center mb-2">
              {getTrendIcon(analysis.trend)}
            </div>
            <p className="text-xs text-muted-foreground">प्रवृत्ती</p>
            <Badge 
              className={`${analysis.trend === 'improving' ? 'bg-green-500' : 
                       analysis.trend === 'stable' ? 'bg-blue-500' : 'bg-red-500'} text-white text-xs`}
            >
              {analysis.trend === 'improving' ? 'सुधारत' : 
               analysis.trend === 'stable' ? 'स्थिर' : 'घटात'}
            </Badge>
          </div>
          
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <Calendar className="h-5 w-5 mx-auto mb-2 text-cyan-glow" />
            <p className="text-xs text-muted-foreground">कालम</p>
            <p className="text-sm font-bold">{selectedMonth} {selectedYear}</p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-4 bg-secondary/30 rounded-lg border-l-4 border-cyan-glow">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                {analysis.recommendation}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedRegion?.name} • {selectedRegion?.district}
              </p>
            </div>
          </div>
        </div>

        {/* Action Items - Expandable */}
        {isExpanded && (
          <div className="p-4 bg-secondary/30 rounded-lg">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              आवश्य करण्या:
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

        {/* Speak Analysis Button */}
        <div className="flex justify-center mt-4">
          <Button
            onClick={() => speakMarathi(analysis.recommendation)}
            disabled={isSpeaking}
            className="w-full"
            variant="outline"
          >
            {isSpeaking ? (
              <Volume2 className="h-4 w-4 animate-pulse mr-2" />
            ) : (
              <Volume2 className="h-4 w-4 mr-2" />
            )}
            {isSpeaking ? 'बोलत आहे...' : 'विश्लेषण सुना'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
