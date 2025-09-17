import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Zap, Globe, Calendar, Activity } from 'lucide-react';
import type { ClimateData } from '../ClimateInsightEngine';

interface ControlPanelProps {
  data: ClimateData;
  onChange: (data: ClimateData) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ data, onChange, onRefresh, isLoading }) => {
  const indicators = [
    { value: 'co2', label: 'CO₂ Emissions', icon: '🌡️' },
    { value: 'avg_temperature', label: 'Average Temperature', icon: '🌡️' },
    { value: 'gdp', label: 'GDP Growth', icon: '💰' },
    { value: 'renewable_adoption', label: 'Renewable Energy Adoption', icon: '⚡' }
  ];

  const regions = [
    'United States', 'China', 'European Union', 'India', 'Brazil', 
    'Japan', 'Canada', 'Australia', 'Russia', 'Global'
  ];

  const timeRanges = [
    { value: '1y', label: '1 Year' },
    { value: '5y', label: '5 Years' },
    { value: '10y', label: '10 Years' }
  ];

  return (
    <Card className="card-glass fade-in">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="indicator" className="text-sm font-medium">Climate Indicator</Label>
            <Select value={data.indicator} onValueChange={(value: any) => onChange({ ...data, indicator: value })}>
              <SelectTrigger id="indicator">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {indicators.map((indicator) => (
                  <SelectItem key={indicator.value} value={indicator.value}>
                    <div className="flex items-center gap-2">
                      <span>{indicator.icon}</span>
                      {indicator.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region" className="text-sm font-medium">Region / Country</Label>
            <Select value={data.region} onValueChange={(value) => onChange({ ...data, region: value })}>
              <SelectTrigger id="region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      {region}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeRange" className="text-sm font-medium">Time Range</Label>
            <Select value={data.timeRange} onValueChange={(value: any) => onChange({ ...data, timeRange: value })}>
              <SelectTrigger id="timeRange">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {range.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode" className="text-sm font-medium">Data Mode</Label>
            <Select value={data.mode} onValueChange={(value: any) => onChange({ ...data, mode: value })}>
              <SelectTrigger id="mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demo">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    Demo (Simulated)
                  </div>
                </SelectItem>
                <SelectItem value="bigquery">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    BigQuery AI (Live)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={onRefresh} 
            disabled={isLoading}
            variant="premium"
            className="h-10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analyzing...' : 'Refresh Data'}
          </Button>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3 pulse-dot" />
            Live Data Stream
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            {data.mode === 'bigquery' ? 'BigQuery AI Active' : 'BigQuery AI Available'}
          </Badge>
          {data.mode === 'bigquery' && (
            <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              AI Methods: ML.GENERATE_TEXT | AI.FORECAST | AI.GENERATE_TABLE
            </Badge>
          )}
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { ControlPanel };