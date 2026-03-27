import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

export function MaharashtraMap() {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Simulate loading and then show the map
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleImageError = () => {
    console.log('Image not found at /maharashtra-map.png');
    setImageError(true);
  };

  if (isLoading) {
    return (
      <Card className="glass-strong border-border/30 h-[300px]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            LOCATION
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[220px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-glow mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-strong border-border/30 h-[300px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          LOCATION
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[220px] bg-[#111520] flex items-center justify-center overflow-hidden">
          {imageError ? (
            // Show error message if image not found
            <div className="text-center p-4">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-2">Map image not found</p>
              <p className="text-xs text-muted-foreground/60">
                Place your image as: <code className="bg-secondary/50 px-1 rounded">public/maharashtra-map.png</code>
              </p>
            </div>
          ) : (
            // Try to load your uploaded Maharashtra map image
            <img 
              src="/location/maharashtra-map.png.jpg" 
              alt="Maharashtra Map" 
              className="w-full h-full object-contain"
              onError={handleImageError}
              onLoad={() => console.log('Image loaded successfully')}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
