import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, TrendingUp, AlertTriangle, CheckCircle, Activity, Target, Brain } from 'lucide-react';

interface ExecutiveInsightsProps {
  insights: string;
  isLoading: boolean;
  accuracy: number;
}

const ExecutiveInsights: React.FC<ExecutiveInsightsProps> = ({ insights, isLoading, accuracy }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="data-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>AI-Generated Executive Summary</CardTitle>
              <Badge variant="outline">BigQuery AI</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sections = insights.split('\n\n').filter(section => section.trim());
  const keyFindings = sections.find(s => s.includes('Key Findings:'))?.split('\n').slice(1) || [];
  const recommendations = sections.find(s => s.includes('Strategic Recommendations:'))?.split('\n').slice(1) || [];
  const riskAssessment = sections.find(s => s.includes('Risk Assessment:')) || '';
  
  const riskLevel = riskAssessment.includes('HIGH') ? 'high' : 
                   riskAssessment.includes('MEDIUM') ? 'medium' : 'low';

  return (
    <div className="space-y-6 fade-in">
      {/* Main Summary Card */}
      <Card className="data-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>AI-Generated Executive Summary</CardTitle>
              <Badge variant="outline">BigQuery AI</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Accuracy</span>
              <Progress value={accuracy * 100} className="w-20" />
              <span className="text-sm font-medium">{Math.round(accuracy * 100)}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
              {insights}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trend Analysis */}
        <Card className="data-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trend Confidence</p>
                <p className="text-2xl font-bold">{Math.round(accuracy * 100)}%</p>
              </div>
            </div>
            <Progress value={accuracy * 100} className="mt-3" />
          </CardContent>
        </Card>

        {/* Risk Level - All alerts in red */}
        <Card className="data-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risk Assessment</p>
                <p className="text-2xl font-bold uppercase">{riskLevel}</p>
              </div>
            </div>
            <Badge 
              variant={riskLevel === 'high' ? 'destructive' : 'outline'} 
              className={`mt-3 ${riskLevel !== 'high' ? 'border-red-500 text-red-500' : ''}`}
            >
              <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
              {riskLevel === 'high' ? 'Immediate Action Required' : 
               riskLevel === 'medium' ? 'Monitor Closely' : 'Low Risk'}
            </Badge>
          </CardContent>
        </Card>

        {/* Data Quality */}
        <Card className="data-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <CheckCircle className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Quality</p>
                <p className="text-2xl font-bold">HIGH</p>
              </div>
            </div>
            <Badge variant="outline" className="mt-3 gap-1">
              <Activity className="h-3 w-3" />
              Multi-source Validated
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Key Findings */}
      {keyFindings.length > 0 && (
        <Card className="data-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Key Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {keyFindings.map((finding, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">{finding.replace('•', '').trim()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="data-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-secondary" />
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50 border-l-4 border-red-500">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm leading-relaxed">{rec.trim()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export { ExecutiveInsights };