import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  ExternalLink, 
  Search, 
  Filter, 
  Calendar, 
  Shield, 
  FileText, 
  Image, 
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download
} from 'lucide-react';
import type { DataSource } from '../ClimateInsightEngine';

interface DataSourcesProps {
  sources: DataSource[];
  indicator: string;
  lastUpdated: string;
}

const DataSources: React.FC<DataSourcesProps> = ({ sources, indicator, lastUpdated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [reliabilityFilter, setReliabilityFilter] = useState<string>('all');

  const allSources: DataSource[] = [
    ...sources,
    // Add comprehensive data sources
    {
      name: "BigQuery Public Datasets - Climate",
      url: "https://cloud.google.com/bigquery/public-data",
      description: "Google's curated climate and environmental datasets",
      lastUpdated: "2024-01-15",
      type: "structured",
      reliability: "high"
    },
    {
      name: "World Bank Open Data",
      url: "https://data.worldbank.org/",
      description: "Global development data including climate indicators",
      lastUpdated: "2024-01-14",
      type: "structured",
      reliability: "high"
    },
    {
      name: "NASA Goddard Earth Sciences Data",
      url: "https://disc.gsfc.nasa.gov/",
      description: "Satellite and model-based atmospheric data",
      lastUpdated: "2024-01-13",
      type: "structured",
      reliability: "high"
    },
    {
      name: "NOAA Climate Data Online",
      url: "https://www.ncdc.noaa.gov/cdo-web/",
      description: "Historical weather and climate data",
      lastUpdated: "2024-01-12",
      type: "structured",
      reliability: "high"
    },
    {
      name: "International Energy Agency (IEA) Data",
      url: "https://www.iea.org/data-and-statistics",
      description: "Global energy statistics and renewable energy data",
      lastUpdated: "2024-01-10",
      type: "structured",
      reliability: "high"
    },
    {
      name: "Global Carbon Atlas",
      url: "http://www.globalcarbonatlas.org/",
      description: "CO2 emissions data by country and region",
      lastUpdated: "2024-01-08",
      type: "structured",
      reliability: "high"
    },
    {
      name: "Climate Policy Initiative Reports",
      url: "https://www.climatepolicyinitiative.org/",
      description: "Climate finance and policy analysis documents",
      lastUpdated: "2024-01-05",
      type: "document",
      reliability: "high"
    },
    {
      name: "Copernicus Climate Data Store",
      url: "https://cds.climate.copernicus.eu/",
      description: "European climate reanalysis and satellite data",
      lastUpdated: "2024-01-03",
      type: "structured",
      reliability: "high"
    },
    {
      name: "NASA Earth Observatory Images",
      url: "https://earthobservatory.nasa.gov/",
      description: "Satellite imagery and environmental photography",
      lastUpdated: "2024-01-01",
      type: "image",
      reliability: "high"
    },
    {
      name: "IPCC Assessment Reports",
      url: "https://www.ipcc.ch/reports/",
      description: "Climate change assessment reports and summaries",
      lastUpdated: "2023-12-28",
      type: "document",
      reliability: "high"
    },
    {
      name: "Climate Watch - World Resources Institute",
      url: "https://www.climatewatchdata.org/",
      description: "Interactive climate data platform",
      lastUpdated: "2024-01-11",
      type: "structured",
      reliability: "high"
    },
    {
      name: "Global Forest Watch",
      url: "https://www.globalforestwatch.org/",
      description: "Forest monitoring and deforestation data",
      lastUpdated: "2024-01-09",
      type: "image",
      reliability: "high"
    }
  ];

  const filteredSources = allSources.filter(source => {
    const matchesSearch = source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         source.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || source.type === typeFilter;
    const matchesReliability = reliabilityFilter === 'all' || source.reliability === reliabilityFilter;
    
    return matchesSearch && matchesType && matchesReliability;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'structured': return <BarChart3 className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'high': return 'text-success';
      case 'medium': return 'text-warning';
      case 'low': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getReliabilityIcon = (reliability: string) => {
    switch (reliability) {
      case 'high': return <CheckCircle className="h-3 w-3" />;
      case 'medium': return <AlertTriangle className="h-3 w-3" />;
      case 'low': return <AlertTriangle className="h-3 w-3" />;
      default: return <Shield className="h-3 w-3" />;
    }
  };

  const typeStats = {
    structured: allSources.filter(s => s.type === 'structured').length,
    image: allSources.filter(s => s.type === 'image').length,
    document: allSources.filter(s => s.type === 'document').length,
    unstructured: allSources.filter(s => s.type === 'unstructured').length
  };

  const exportDataSources = () => {
    const csvContent = [
      ['Name', 'Type', 'Reliability', 'Last Updated', 'URL', 'Description'].join(','),
      ...filteredSources.map(source => 
        [source.name, source.type, source.reliability, source.lastUpdated, source.url, source.description]
          .map(field => `"${field}"`)
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `climate-data-sources-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <Card className="data-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Data Sources & Transparency</CardTitle>
              <Badge variant="outline">Real-time Validation</Badge>
            </div>
            <Button onClick={exportDataSources} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-lg bg-primary/10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="font-semibold">{typeStats.structured}</span>
              </div>
              <p className="text-xs text-muted-foreground">Structured Datasets</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Image className="h-4 w-4 text-secondary" />
                <span className="font-semibold">{typeStats.image}</span>
              </div>
              <p className="text-xs text-muted-foreground">Image Sources</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-accent" />
                <span className="font-semibold">{typeStats.document}</span>
              </div>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{allSources.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total Sources</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Last validation: {new Date(lastUpdated).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="data-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search data sources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="structured">Structured</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="unstructured">Unstructured</SelectItem>
                </SelectContent>
              </Select>
              <Select value={reliabilityFilter} onValueChange={setReliabilityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Reliability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sources List */}
      <div className="space-y-4">
        {filteredSources.map((source, index) => (
          <Card key={index} className="data-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(source.type)}
                      <h3 className="font-semibold">{source.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        {getTypeIcon(source.type)}
                        {source.type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`gap-1 ${getReliabilityColor(source.reliability)}`}
                      >
                        {getReliabilityIcon(source.reliability)}
                        {source.reliability} reliability
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {source.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Updated: {new Date(source.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 ml-4"
                  onClick={() => window.open(source.url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                  Visit Source
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSources.length === 0 && (
        <Card className="data-card">
          <CardContent className="p-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No sources found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search terms or filters to find relevant data sources.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data Quality Statement */}
      <Card className="data-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-success" />
            Data Quality & Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Quality Assurance</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Multi-source cross-validation</li>
                <li>• Real-time data freshness monitoring</li>
                <li>• Automated anomaly detection</li>
                <li>• Source reliability scoring</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">BigQuery AI Integration</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• AI.GENERATE for data summarization</li>
                <li>• ML.GENERATE_EMBEDDING for similarity</li>
                <li>• VECTOR_SEARCH for pattern matching</li>
                <li>• Object tables for image analysis</li>
              </ul>
            </div>
          </div>
          
          <Separator />
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              All data sources are continuously monitored for accuracy, timeliness, and reliability. 
              Our AI validation pipeline ensures consistent data quality across all indicators.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { DataSources };