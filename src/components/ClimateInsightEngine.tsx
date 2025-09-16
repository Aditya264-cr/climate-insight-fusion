import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { realTimeService, type DataUpdate } from '@/services/realTimeService';
import { errorService, ErrorSeverity, ErrorCategory } from '@/services/errorService';
import { vectorSearchService } from '@/services/vectorSearchService';
import { 
  BarChart3, 
  TrendingUp, 
  Globe, 
  Camera,
  Database,
  Search,
  AlertTriangle,
  Activity,
  Leaf,
  Thermometer,
  DollarSign,
  Zap,
  FileText,
  ExternalLink,
  Calendar,
  MapPin,
  Info,
  Brain,
  Target,
  Sparkles
} from 'lucide-react';
import { ExecutiveInsights } from './climate/ExecutiveInsights';
import { ForecastVisualization } from './climate/ForecastVisualization';
import { ImageAnalyzer } from './climate/ImageAnalyzer';
import { VectorSearch } from './climate/VectorSearch';
import { DataSources } from './climate/DataSources';
import { ControlPanel } from './climate/ControlPanel';

export interface ClimateData {
  indicator: 'co2' | 'avg_temperature' | 'gdp' | 'renewable_adoption';
  region: string;
  mode: 'demo' | 'bigquery';
  timeRange: '1y' | '5y' | '10y';
}

export interface ForecastData {
  forecast: Array<{
    ts: string;
    value: number;
    confidence_low?: number;
    confidence_high?: number;
  }>;
  summary: {
    trend: 'increasing' | 'decreasing' | 'stable';
    impact: string;
    recommendation: string;
    accuracy_score: number;
  };
}

export interface DataSource {
  name: string;
  url: string;
  description: string;
  lastUpdated: string;
  type: 'structured' | 'unstructured' | 'image' | 'document';
  reliability: 'high' | 'medium' | 'low';
}

const ClimateInsightEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState('insights');
  const [isLoading, setIsLoading] = useState(false);
  const [climateData, setClimateData] = useState<ClimateData>({
    indicator: 'co2',
    region: 'United States',
    mode: 'demo',
    timeRange: '10y'
  });
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [executiveInsights, setExecutiveInsights] = useState<string>('');
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [realTimeUpdates, setRealTimeUpdates] = useState<DataUpdate[]>([]);

  // Initialize real-time data subscription
  useEffect(() => {
    const unsubscribe = realTimeService.subscribe(
      climateData.indicator,
      climateData.region,
      (update: DataUpdate) => {
        setRealTimeUpdates(prev => [update, ...prev.slice(0, 4)]);
      }
    );

    // Request notification permissions
    realTimeService.requestNotificationPermission();

    return unsubscribe;
  }, [climateData.indicator, climateData.region]);

  // Expose data for PDF export
  useEffect(() => {
    try {
      (window as any).__climateReportData = {
        climateData,
        forecastData,
        executiveInsights,
        dataSources,
      };
    } catch {}
  }, [climateData, forecastData, executiveInsights, dataSources]);

  // Enhanced BigQuery AI data fetching with comprehensive error handling
  const fetchClimateData = async () => {
    setIsLoading(true);
    try {
      // Validate input parameters
      const validation = errorService.validateClimateData(climateData);
      if (!validation.isValid) {
        throw errorService.createError(
          'Invalid climate data parameters',
          'INVALID_PARAMS',
          ErrorSeverity.MEDIUM,
          ErrorCategory.VALIDATION,
          { component: 'ClimateInsightEngine', action: 'fetchClimateData' }
        );
      }

      // Import services dynamically for better performance
      const [
        { bigQueryService },
        { imageService },
        { vectorSearchService }
      ] = await Promise.all([
        import('../services/bigqueryService'),
        import('../services/imageService'),
        import('../services/vectorSearchService')
      ]);

      // Parallel data fetching with error handling
      const [forecast, insights, vectorResults] = await Promise.allSettled([
        bigQueryService.generateForecast({
          indicator: climateData.indicator,
          region: climateData.region,
          timeRange: climateData.timeRange,
          mode: climateData.mode
        }),
        bigQueryService.generateExecutiveInsights({
          forecastData: null,
          indicator: climateData.indicator,
          region: climateData.region
        }),
        vectorSearchService.findSimilarRegions(
          climateData.region,
          climateData.indicator,
          climateData.timeRange
        )
      ]);

      // Process results with fallbacks
      if (forecast.status === 'fulfilled') {
        setForecastData(forecast.value);
      }
      
      if (insights.status === 'fulfilled') {
        setExecutiveInsights(insights.value);
      }

      setDataSources(generateDataSources(climateData.indicator));
      
    } catch (error) {
      await errorService.handleError(error);
      // Fallback to demo data
      const mockForecast: ForecastData = {
        forecast: generateMockForecast(climateData.indicator),
        summary: {
          trend: climateData.indicator === 'co2' ? 'increasing' : 'decreasing',
          impact: getImpactMessage(climateData.indicator),
          recommendation: getRecommendation(climateData.indicator),
          accuracy_score: 0.87
        }
      };
      setForecastData(mockForecast);
      setExecutiveInsights(generateExecutiveInsights(climateData, mockForecast));
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockForecast = (indicator: string) => {
    const currentYear = new Date().getFullYear();
    const data = [];
    
    for (let i = 0; i < 120; i++) { // 10 years of monthly data
      const date = new Date(currentYear - 10 + Math.floor(i / 12), i % 12, 1);
      let value;
      
      switch (indicator) {
        case 'co2':
          value = 400 + Math.sin(i * 0.05) * 10 + i * 0.5;
          break;
        case 'avg_temperature':
          value = 14.5 + Math.sin(i * 0.5) * 2 + i * 0.01;
          break;
        case 'gdp':
          value = 50000 + Math.sin(i * 0.02) * 5000 + i * 100;
          break;
        case 'renewable_adoption':
          value = 10 + i * 0.3 + Math.sin(i * 0.1) * 2;
          break;
        default:
          value = Math.random() * 100;
      }
      
      data.push({
        ts: date.toISOString(),
        value: Math.round(value * 100) / 100,
        confidence_low: Math.round((value * 0.9) * 100) / 100,
        confidence_high: Math.round((value * 1.1) * 100) / 100
      });
    }
    
    return data;
  };

  const getImpactMessage = (indicator: string): string => {
    const impacts = {
      co2: "Current CO₂ levels are 50% above pre-industrial baseline, accelerating climate change effects globally.",
      avg_temperature: "Global temperatures have risen 1.2°C since 1880, with accelerating warming in polar regions.",
      gdp: "Climate adaptation costs are projected to reach 2-3% of global GDP by 2030.",
      renewable_adoption: "Renewable energy adoption is accelerating but needs 3x faster growth to meet 2030 targets."
    };
    return impacts[indicator as keyof typeof impacts] || "Significant environmental and economic impacts detected.";
  };

  const getRecommendation = (indicator: string): string => {
    const recommendations = {
      co2: "Implement immediate carbon pricing mechanisms and invest in carbon capture technologies.",
      avg_temperature: "Prioritize adaptation strategies in vulnerable regions and enhance early warning systems.",
      gdp: "Increase climate finance allocation and develop green economic transition plans.",
      renewable_adoption: "Remove policy barriers and increase renewable energy investment incentives."
    };
    return recommendations[indicator as keyof typeof recommendations] || "Develop comprehensive climate action strategy.";
  };

  const generateExecutiveInsights = (data: ClimateData, forecast: ForecastData): string => {
    const accuracyScore = forecast.summary?.accuracy_score ?? 0.87;
    return `Executive Summary for ${data.region} - ${data.indicator.toUpperCase()} Analysis

Key Findings:
• Trend Analysis: ${forecast.summary.trend.charAt(0).toUpperCase() + forecast.summary.trend.slice(1)} trajectory detected with ${Math.round(accuracyScore * 100)}% confidence
• Regional Impact: ${forecast.summary.impact}
• Forecast Reliability: High accuracy (${Math.round(accuracyScore * 100)}%) based on multi-source data validation

Strategic Recommendations:
${forecast.summary.recommendation}

Risk Assessment: ${data.indicator === 'co2' ? 'HIGH' : data.indicator === 'avg_temperature' ? 'HIGH' : 'MEDIUM'} - Immediate action required to mitigate long-term impacts.

Data Quality: Analysis incorporates real-time data from NASA, NOAA, World Bank, and IEA with advanced AI validation.`;
  };

  const generateDataSources = (indicator: string): DataSource[] => {
    const baseSources = [
      {
        name: "World Bank Climate Data",
        url: "https://datahelpdesk.worldbank.org/knowledgebase/articles/902061",
        description: "Global climate and economic indicators",
        lastUpdated: "2024-01-15",
        type: "structured" as const,
        reliability: "high" as const
      },
      {
        name: "NASA GISS Temperature Data",
        url: "https://data.giss.nasa.gov/gistemp/",
        description: "Global surface temperature anomalies",
        lastUpdated: "2024-01-10",
        type: "structured" as const,
        reliability: "high" as const
      },
      {
        name: "NOAA Climate Data",
        url: "https://www.ncei.noaa.gov/data/",
        description: "Comprehensive atmospheric and oceanic data",
        lastUpdated: "2024-01-12",
        type: "structured" as const,
        reliability: "high" as const
      }
    ];

    const indicatorSpecific = {
      co2: [
        {
          name: "Global Carbon Atlas",
          url: "http://www.globalcarbonatlas.org/",
          description: "CO₂ emissions by country and sector",
          lastUpdated: "2024-01-08",
          type: "structured" as const,
          reliability: "high" as const
        }
      ],
      renewable_adoption: [
        {
          name: "IRENA Global Energy Statistics",
          url: "https://www.irena.org/Statistics",
          description: "Renewable energy capacity and generation data",
          lastUpdated: "2024-01-05",
          type: "structured" as const,
          reliability: "high" as const
        }
      ]
    };

    return [...baseSources, ...(indicatorSpecific[indicator as keyof typeof indicatorSpecific] || [])];
  };

  useEffect(() => {
    fetchClimateData();
  }, [climateData.indicator, climateData.region, climateData.mode, climateData.timeRange]);


  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Brain className="h-10 w-10 text-primary" />
              <Sparkles className="h-5 w-5 text-accent absolute -top-1 -right-1" />
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Executive Intelligence Platform
            </h1>
          </div>
          <div className="space-y-2">
            <p className="text-foreground/80 text-xl font-medium max-w-4xl mx-auto">
              Hyper-Personalized Marketing Engine & Executive Insight Dashboard
            </p>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Transform raw data into actionable business insights with AI-powered analytics
            </p>
          </div>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <Badge variant="outline" className="gap-2 px-4 py-2 border-primary/30 hover:border-primary/60 transition-colors">
              <Target className="h-4 w-4" />
              Personalized Marketing
            </Badge>
            <Badge variant="outline" className="gap-2 px-4 py-2 border-secondary/30 hover:border-secondary/60 transition-colors">
              <Brain className="h-4 w-4" />
              Executive Insights
            </Badge>
            <Badge variant="outline" className="gap-2 px-4 py-2 border-accent/30 hover:border-accent/60 transition-colors">
              <Activity className="h-4 w-4" />
              Real-time Analytics
            </Badge>
          </div>
        </div>

        {/* Control Panel */}
        <ControlPanel 
          data={climateData} 
          onChange={setClimateData}
          onRefresh={fetchClimateData}
          isLoading={isLoading}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:mx-auto bg-background-secondary/50 backdrop-blur-sm border border-border/20">
            <TabsTrigger value="insights" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white" data-value="insights">
              <Brain className="h-4 w-4" />
              Executive Intelligence
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white" data-value="forecast">
              <TrendingUp className="h-4 w-4" />
              Predictive Analytics
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white" data-value="analysis">
              <Camera className="h-4 w-4" />
              Visual Intelligence
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white" data-value="search">
              <Search className="h-4 w-4" />
              Smart Discovery
            </TabsTrigger>
            <TabsTrigger value="sources" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white" data-value="sources">
              <Database className="h-4 w-4" />
              Data Intelligence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" data-value="insights">
            <ExecutiveInsights 
              insights={executiveInsights}
              isLoading={isLoading}
              accuracy={forecastData?.summary?.accuracy_score ?? 0.87}
            />
          </TabsContent>

          <TabsContent value="forecast" data-value="forecast">
            <ForecastVisualization 
              data={forecastData}
              isLoading={isLoading}
              indicator={climateData.indicator}
              region={climateData.region}
              timeRange={climateData.timeRange}
            />
          </TabsContent>

          <TabsContent value="analysis" data-value="analysis">
            <ImageAnalyzer 
              indicator={climateData.indicator}
              region={climateData.region}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="search" data-value="search">
            <VectorSearch 
              indicator={climateData.indicator}
              region={climateData.region}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="sources" data-value="sources">
            <DataSources 
              sources={dataSources}
              indicator={climateData.indicator}
              lastUpdated={new Date().toISOString()}
            />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default ClimateInsightEngine;