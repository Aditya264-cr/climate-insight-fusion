import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Image as ImageIcon, Scan, AlertTriangle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface ImageAnalyzerProps {
  indicator: string;
  region: string;
  isLoading: boolean;
}

interface ImageAnalysis {
  imageUrl: string;
  title: string;
  source: string;
  analysis: {
    anomalies: string[];
    patterns: string[];
    correlations: string[];
    confidence: number;
  };
  metadata: {
    location: string;
    date: string;
    satellite: string;
    resolution: string;
  };
}

const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ indicator, region, isLoading }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [imageAnalyses, setImageAnalyses] = useState<ImageAnalysis[]>([]);

  // Generate mock satellite/climate images based on indicator
  const generateMockAnalyses = async () => {
    setAnalyzing(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockAnalyses: ImageAnalysis[] = [
      {
        imageUrl: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=600&h=400&fit=crop",
        title: `${indicator === 'co2' ? 'Industrial Emissions' : 'Climate Change Impact'} - ${region}`,
        source: "NASA Earth Observatory",
        analysis: {
          anomalies: getAnomalies(indicator),
          patterns: getPatterns(indicator),
          correlations: getCorrelations(indicator),
          confidence: 0.89
        },
        metadata: {
          location: region,
          date: new Date().toISOString().split('T')[0],
          satellite: "Landsat 9",
          resolution: "30m"
        }
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1569163139394-de4e4eb7a9b8?w=600&h=400&fit=crop",
        title: `Secondary Analysis - ${getSecondaryTitle(indicator)}`,
        source: "NOAA Climate Data",
        analysis: {
          anomalies: getSecondaryAnomalies(indicator),
          patterns: getSecondaryPatterns(indicator),
          correlations: getSecondaryCorrelations(indicator),
          confidence: 0.82
        },
        metadata: {
          location: region,
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
          satellite: "MODIS Terra",
          resolution: "250m"
        }
      }
    ];
    
    setImageAnalyses(mockAnalyses);
    setAnalyzing(false);
  };

  const getAnomalies = (indicator: string): string[] => {
    const anomalies = {
      co2: [
        "High concentration zones detected in industrial areas",
        "Unusual emission patterns near power plants",
        "Elevated levels compared to seasonal baseline"
      ],
      avg_temperature: [
        "Temperature anomalies 2.3°C above historical average",
        "Heat island effects in urban regions",
        "Irregular warming patterns in coastal areas"
      ],
      gdp: [
        "Increased infrastructure development visible",
        "New commercial construction detected",
        "Urban expansion patterns identified"
      ],
      renewable_adoption: [
        "New solar installations detected",
        "Wind farm expansion in progress",
        "Grid infrastructure improvements visible"
      ]
    };
    return anomalies[indicator as keyof typeof anomalies] || ["No significant anomalies detected"];
  };

  const getPatterns = (indicator: string): string[] => {
    const patterns = {
      co2: [
        "Consistent emission corridors along major highways",
        "Seasonal variation patterns matching industrial cycles",
        "Concentration gradients following wind patterns"
      ],
      avg_temperature: [
        "Urban heat island formation clearly visible",
        "Temperature gradients correlating with land use",
        "Diurnal variation patterns within expected ranges"
      ],
      gdp: [
        "Economic activity clusters around transport hubs",
        "Development patterns following zoning regulations",
        "Infrastructure density matching population centers"
      ],
      renewable_adoption: [
        "Solar installations following optimal exposure patterns",
        "Wind turbine placement optimized for wind corridors",
        "Grid connections following transmission lines"
      ]
    };
    return patterns[indicator as keyof typeof patterns] || ["Regular patterns observed"];
  };

  const getCorrelations = (indicator: string): string[] => {
    const correlations = {
      co2: [
        "Strong correlation with traffic density (r=0.87)",
        "Industrial activity correlation (r=0.92)",
        "Population density correlation (r=0.76)"
      ],
      avg_temperature: [
        "Land use correlation with temperature (r=0.84)",
        "Vegetation coverage negative correlation (r=-0.78)",
        "Altitude correlation with cooling (r=-0.69)"
      ],
      gdp: [
        "Infrastructure investment correlation (r=0.91)",
        "Employment center correlation (r=0.85)",
        "Transportation access correlation (r=0.79)"
      ],
      renewable_adoption: [
        "Solar irradiance correlation (r=0.93)",
        "Wind speed correlation (r=0.88)",
        "Policy incentive correlation (r=0.82)"
      ]
    };
    return correlations[indicator as keyof typeof correlations] || ["Standard correlations observed"];
  };

  const getSecondaryTitle = (indicator: string): string => {
    const titles = {
      co2: "Atmospheric Composition Analysis",
      avg_temperature: "Surface Temperature Mapping",
      gdp: "Economic Infrastructure Assessment",
      renewable_adoption: "Renewable Energy Infrastructure"
    };
    return titles[indicator as keyof typeof titles] || "Environmental Analysis";
  };

  const getSecondaryAnomalies = (indicator: string): string[] => {
    return getAnomalies(indicator).map(anomaly => 
      anomaly.replace("High", "Moderate").replace("Unusual", "Notable")
    );
  };

  const getSecondaryPatterns = (indicator: string): string[] => {
    return getPatterns(indicator).slice(0, 2); // Fewer patterns for secondary analysis
  };

  const getSecondaryCorrelations = (indicator: string): string[] => {
    return getCorrelations(indicator).slice(0, 2); // Fewer correlations for secondary analysis
  };

  useEffect(() => {
    generateMockAnalyses();
  }, [indicator, region]);

  if (isLoading || analyzing) {
    return (
      <div className="space-y-6">
        <Card className="data-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <CardTitle>AI Image Analysis</CardTitle>
              <Badge variant="outline">MULTIMODAL AI</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <Card className="data-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <CardTitle>Multimodal Climate Image Analysis</CardTitle>
              <Badge variant="outline">AI Vision + ObjectRef</Badge>
            </div>
            <Button 
              onClick={generateMockAnalyses} 
              disabled={analyzing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
              Refresh Analysis
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Image Analyses */}
      {imageAnalyses.map((analysis, index) => (
        <Card key={index} className="data-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{analysis.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Scan className="h-3 w-3" />
                  {Math.round(analysis.analysis.confidence * 100)}% Confidence
                </Badge>
                <Badge variant="secondary">
                  {analysis.source}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Display */}
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={analysis.imageUrl} 
                alt={analysis.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 left-2">
                <Badge className="bg-black/70 text-white border-0">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  {analysis.metadata.satellite}
                </Badge>
              </div>
              <div className="absolute top-2 right-2">
                <Badge className="bg-black/70 text-white border-0">
                  {analysis.metadata.resolution}
                </Badge>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{analysis.metadata.location}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{analysis.metadata.date}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Satellite</p>
                <p className="font-medium">{analysis.metadata.satellite}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Resolution</p>
                <p className="font-medium">{analysis.metadata.resolution}</p>
              </div>
            </div>

            {/* Analysis Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Anomalies */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Detected Anomalies
                </h4>
                <ul className="space-y-2">
                  {analysis.analysis.anomalies.map((anomaly, i) => (
                    <li key={i} className="text-sm p-2 rounded bg-warning/10 border-l-2 border-warning">
                      {anomaly}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Patterns */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Identified Patterns
                </h4>
                <ul className="space-y-2">
                  {analysis.analysis.patterns.map((pattern, i) => (
                    <li key={i} className="text-sm p-2 rounded bg-primary/10 border-l-2 border-primary">
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Correlations */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-secondary" />
                  Key Correlations
                </h4>
                <ul className="space-y-2">
                  {analysis.analysis.correlations.map((correlation, i) => (
                    <li key={i} className="text-sm p-2 rounded bg-secondary/10 border-l-2 border-secondary">
                      {correlation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Generated Summary */}
            <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-accent">
              <h4 className="font-semibold mb-2">AI Analysis Summary</h4>
              <p className="text-sm leading-relaxed">
                The multimodal AI analysis of this {indicator.replace('_', ' ')} related imagery for {region} 
                reveals significant environmental patterns with {Math.round(analysis.analysis.confidence * 100)}% confidence. 
                Key findings include {analysis.analysis.anomalies.length} anomalies, 
                {analysis.analysis.patterns.length} distinct patterns, and 
                {analysis.analysis.correlations.length} strong correlations with external factors. 
                This analysis supports the overall climate-economy trend assessment for the region.
              </p>
            </div>

            {/* Source Link */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Data Source: {analysis.source}
              </p>
              <Button variant="ghost" size="sm" className="gap-2">
                <ExternalLink className="h-3 w-3" />
                View Original
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export { ImageAnalyzer };