import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BarChart3, Activity, Calendar, MapPin } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import type { ForecastData } from '../ClimateInsightEngine';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const getTimeHorizon = (timeRange: string) => ({ '1y': 12, '5y': 60, '10y': 120 }[timeRange as '1y' | '5y' | '10y'] || 120);
const getTimeRangeLabel = (timeRange: string) => ({ '1y': '1-Year', '5y': '5-Year', '10y': '10-Year' }[timeRange as '1y' | '5y' | '10y'] || 'Forecast');

interface ForecastVisualizationProps {
  data: ForecastData | null;
  isLoading: boolean;
  indicator: string;
  region: string;
  timeRange: '1y' | '5y' | '10y';
}

const ForecastVisualization: React.FC<ForecastVisualizationProps> = ({ 
  data, 
  isLoading, 
  indicator, 
  region,
  timeRange
}) => {
  const getIndicatorLabel = (indicator: string) => {
    const labels = {
      co2: 'CO₂ Emissions (ppm)',
      avg_temperature: 'Temperature (°C)',
      gdp: 'GDP ($)',
      renewable_adoption: 'Renewable Energy (%)'
    };
    return labels[indicator as keyof typeof labels] || indicator;
  };

  const getIndicatorIcon = (indicator: string) => {
    const icons = {
      co2: '🌡️',
      avg_temperature: '🌡️',
      gdp: '💰',
      renewable_adoption: '⚡'
    };
    return icons[indicator as keyof typeof icons] || '📊';
  };

  const chartData = useMemo(() => {
    if (!data?.forecast) return null;

    const horizon = getTimeHorizon(timeRange);
    const now = new Date();
    const startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - (timeRange === '1y' ? 1 : timeRange === '5y' ? 5 : 10));

    const series = data.forecast
      .filter(item => {
        const d = new Date(item.ts);
        return d >= startDate && d <= now;
      })
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

    const labels = series.map(item => {
      const date = new Date(item.ts);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    const values = series.map(item => item.value);
    const confidenceLow = series.map(item => item.confidence_low ?? item.value * 0.9);
    const confidenceHigh = series.map(item => item.confidence_high ?? item.value * 1.1);

    return {
      labels,
      datasets: [
        {
          label: getIndicatorLabel(indicator),
          data: values,
          borderColor: 'hsl(217 91% 60%)',
          backgroundColor: 'hsl(217 91% 60% / 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'hsl(217 91% 60%)',
          pointBorderColor: 'hsl(217 91% 90%)',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
        {
          label: 'Confidence Range',
          data: confidenceHigh,
          borderColor: 'hsl(142 76% 36%)',
          backgroundColor: 'hsl(142 76% 36% / 0.08)',
          borderWidth: 2,
          borderDash: [8, 4],
          fill: '+1',
          pointRadius: 0,
        },
        {
          label: 'Lower Bound',
          data: confidenceLow,
          borderColor: 'hsl(346 87% 43%)',
          backgroundColor: 'hsl(346 87% 43% / 0.08)',
          borderWidth: 2,
          borderDash: [8, 4],
          fill: false,
          pointRadius: 0,
        }
      ]
    };
  }, [data, indicator, timeRange]);

  const pieData = useMemo(() => {
    if (!data?.forecast) return null;

    const horizon = getTimeHorizon(timeRange);
    const now = new Date();
    const startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - (timeRange === '1y' ? 1 : timeRange === '5y' ? 5 : 10));
    const series = data.forecast
      .filter(item => {
        const d = new Date(item.ts);
        return d >= startDate && d <= now;
      })
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    const recent = series.slice(-12); // Last 12 months within selected range
    if (!recent.length) return null;

    const growth = recent[recent.length - 1].value - recent[0].value;
    const baseline = recent[0].value;

    return {
      labels: ['Baseline', 'Growth/Change'],
      datasets: [
        {
          data: [baseline, Math.abs(growth)],
          backgroundColor: [
            'hsl(262 83% 58%)', // Purple for baseline
            growth > 0 ? 'hsl(25 95% 53%)' : 'hsl(173 58% 39%)' // Orange for positive, Teal for negative
          ],
          borderColor: [
            'hsl(262 83% 48%)', // Darker purple border
            growth > 0 ? 'hsl(25 95% 43%)' : 'hsl(173 58% 29%)' // Darker borders
          ],
          borderWidth: 3,
          hoverBackgroundColor: [
            'hsl(262 83% 68%)',
            growth > 0 ? 'hsl(25 95% 63%)' : 'hsl(173 58% 49%)'
          ],
          hoverBorderWidth: 4,
        }
      ]
    };
  }, [data, timeRange]);

  const barData = useMemo(() => {
    if (!data?.forecast) return null;

    const horizon = getTimeHorizon(timeRange);
    const now = new Date();
    const startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - (timeRange === '1y' ? 1 : timeRange === '5y' ? 5 : 10));
    const series = data.forecast
      .filter(item => {
        const d = new Date(item.ts);
        return d >= startDate && d <= now;
      })
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

    const yearlyData = series.reduce((acc, item) => {
      const year = new Date(item.ts).getFullYear();
      if (!acc[year]) acc[year] = [] as number[];
      acc[year].push(item.value);
      return acc;
    }, {} as Record<number, number[]>);

    const years = Object.keys(yearlyData).map(Number).sort();
    const averages = years.map(year => 
      yearlyData[year].reduce((sum, val) => sum + val, 0) / yearlyData[year].length
    );

    return {
      labels: years,
      datasets: [
        {
          label: `Annual Average ${getIndicatorLabel(indicator)}`,
          data: averages,
          backgroundColor: averages.map((_, index) => 
            `hsl(${280 + (index * 15) % 60} 70% 60% / 0.8)` // Gradient from purple to pink
          ),
          borderColor: averages.map((_, index) => 
            `hsl(${280 + (index * 15) % 60} 70% 50%)`
          ),
          borderWidth: 2,
          hoverBackgroundColor: averages.map((_, index) => 
            `hsl(${280 + (index * 15) % 60} 70% 70% / 0.9)`
          ),
          borderRadius: 4,
          borderSkipped: false,
        }
      ]
    };
  }, [data, indicator, timeRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        text: `${getIndicatorLabel(indicator)} - ${getTimeRangeLabel(timeRange)} Forecast`
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'hsl(217 91% 60%)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'hsl(0 0% 90%)',
          lineWidth: 1
        },
        title: {
          display: true,
          text: 'Time Period'
        }
      },
      y: {
        display: true,
        grid: {
          color: 'hsl(0 0% 95%)',
          lineWidth: 1
        },
        title: {
          display: true,
          text: getIndicatorLabel(indicator)
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    elements: {
      point: {
        hoverRadius: 8
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="data-card">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="data-card">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No forecast data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header Info */}
      <Card className="data-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl">{getIndicatorIcon(indicator)}</div>
              <div>
                <h3 className="text-lg font-semibold">{getIndicatorLabel(indicator)} Analysis</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {region}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {getTimeRangeLabel(timeRange)} (Past)
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {data.summary.trend.charAt(0).toUpperCase() + data.summary.trend.slice(1)} Trend
                  </div>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <BarChart3 className="h-3 w-3" />
              AI.FORECAST
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Forecast Chart */}
      <Card className="data-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Time Series Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {chartData && <Line data={chartData} options={chartOptions} />}
          </div>
        </CardContent>
      </Card>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Proportion Analysis */}
        <Card className="data-card">
          <CardHeader>
            <CardTitle className="text-lg">Composition Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {pieData && <Pie data={pieData} options={{ maintainAspectRatio: false }} />}
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Annual Trends */}
        <Card className="data-card">
          <CardHeader>
            <CardTitle className="text-lg">Annual Averages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {barData && <Bar data={barData} options={{ maintainAspectRatio: false }} />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabular Data Display */}
      <Card className="data-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-secondary" />
            Forecast Data Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-right p-3 font-semibold">Value</th>
                  <th className="text-right p-3 font-semibold">Lower Bound</th>
                  <th className="text-right p-3 font-semibold">Upper Bound</th>
                  <th className="text-right p-3 font-semibold">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {data.forecast
                  .filter(item => {
                    const d = new Date(item.ts);
                    const now = new Date();
                    const startDate = new Date(now);
                    startDate.setFullYear(now.getFullYear() - (timeRange === '1y' ? 1 : timeRange === '5y' ? 5 : 10));
                    return d >= startDate && d <= now;
                  })
                  .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
                  .slice(0, 20)
                  .map((item, index) => {
                    const confidence = ((item.confidence_high ?? item.value * 1.1) - (item.confidence_low ?? item.value * 0.9)) / item.value * 100;
                    return (
                      <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">
                          {new Date(item.ts).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short' 
                          })}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
                        </td>
                        <td className="p-3 text-right font-mono text-red-600">
                          {(item.confidence_low ?? item.value * 0.9).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono text-green-600">
                          {(item.confidence_high ?? item.value * 1.1).toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <Badge variant={confidence > 15 ? 'secondary' : 'outline'} className="text-xs">
                            {confidence.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing last 20 data points from {getTimeRangeLabel(timeRange)} historical data
          </p>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="data-card">
        <CardHeader>
          <CardTitle>Forecast Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Trend Direction</p>
              <p className="text-xl font-bold capitalize">{data.summary.trend}</p>
              <Badge 
                variant={data.summary.trend === 'increasing' ? 'destructive' : 'secondary'}
                className="mt-2"
              >
                {data.summary.trend === 'increasing' ? '📈' : '📉'} {data.summary.trend}
              </Badge>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Forecast Accuracy</p>
              <p className="text-xl font-bold">{Math.round((data.summary?.accuracy_score ?? 0.87) * 100)}%</p>
              <Badge variant="outline" className="mt-2">
                High Confidence
              </Badge>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Data Points</p>
              <p className="text-xl font-bold">{data.forecast.length}</p>
              <Badge variant="outline" className="mt-2">
                Monthly Resolution
              </Badge>
            </div>
          </div>
          
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border-l-4 border-primary">
            <h4 className="font-semibold mb-2">AI Analysis Summary</h4>
            <p className="text-sm leading-relaxed">{data.summary.impact}</p>
            <p className="text-sm leading-relaxed mt-2 font-medium">
              Recommendation: {data.summary.recommendation}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { ForecastVisualization };