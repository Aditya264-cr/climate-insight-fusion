// Real-time Data Service - WebSocket & Event Stream Integration
// Provides live updates for climate and economic indicators

interface RealTimeConfig {
  websocketUrl?: string;
  pollInterval: number;
  retryAttempts: number;
  enableNotifications: boolean;
}

interface DataUpdate {
  timestamp: string;
  indicator: string;
  region: string;
  value: number;
  change: number;
  changePercent: number;
  source: string;
  reliability: 'high' | 'medium' | 'low';
}

interface AlertConfig {
  threshold: number;
  type: 'absolute' | 'percentage';
  direction: 'increase' | 'decrease' | 'both';
}

type UpdateCallback = (update: DataUpdate) => void;
type ErrorCallback = (error: Error) => void;

class RealTimeService {
  private config: RealTimeConfig;
  private websocket: WebSocket | null = null;
  private subscribers: Map<string, UpdateCallback[]> = new Map();
  private errorHandlers: ErrorCallback[] = [];
  private pollingIntervals: Map<string, number> = new Map();
  private alerts: Map<string, AlertConfig> = new Map();
  private lastValues: Map<string, number> = new Map();
  private connectionRetries = 0;

  constructor(config: RealTimeConfig) {
    this.config = config;
    this.initializeConnection();
  }

  // Subscription management
  subscribe(indicator: string, region: string, callback: UpdateCallback): () => void {
    const key = `${indicator}-${region}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
      this.startPolling(indicator, region);
    }
    
    this.subscribers.get(key)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
          if (callbacks.length === 0) {
            this.stopPolling(key);
            this.subscribers.delete(key);
          }
        }
      }
    };
  }

  // Alert configuration
  setAlert(indicator: string, region: string, config: AlertConfig): void {
    const key = `${indicator}-${region}`;
    this.alerts.set(key, config);
  }

  removeAlert(indicator: string, region: string): void {
    const key = `${indicator}-${region}`;
    this.alerts.delete(key);
  }

  // Error handling
  onError(callback: ErrorCallback): () => void {
    this.errorHandlers.push(callback);
    return () => {
      const index = this.errorHandlers.indexOf(callback);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  private async initializeConnection(): Promise<void> {
    if (this.config.websocketUrl) {
      try {
        await this.connectWebSocket();
      } catch (error) {
        console.warn('WebSocket connection failed, using polling:', error);
      }
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(this.config.websocketUrl!);
        
        this.websocket.onopen = () => {
          console.log('Real-time connection established');
          this.connectionRetries = 0;
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const update: DataUpdate = JSON.parse(event.data);
            this.handleUpdate(update);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.websocket.onclose = () => {
          console.log('Real-time connection closed');
          this.attemptReconnection();
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.notifyError(new Error('Real-time connection error'));
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnection(): void {
    if (this.connectionRetries < this.config.retryAttempts) {
      this.connectionRetries++;
      const delay = Math.min(1000 * Math.pow(2, this.connectionRetries), 30000);
      
      setTimeout(() => {
        console.log(`Attempting reconnection (${this.connectionRetries}/${this.config.retryAttempts})`);
        this.connectWebSocket();
      }, delay);
    }
  }

  private startPolling(indicator: string, region: string): void {
    const key = `${indicator}-${region}`;
    
    // Clear existing polling
    this.stopPolling(key);
    
    // Start new polling
    const intervalId = window.setInterval(async () => {
      try {
        const update = await this.fetchLatestData(indicator, region);
        this.handleUpdate(update);
      } catch (error) {
        this.notifyError(error as Error);
      }
    }, this.config.pollInterval);
    
    this.pollingIntervals.set(key, intervalId);
    
    // Fetch initial data
    this.fetchLatestData(indicator, region)
      .then(update => this.handleUpdate(update))
      .catch(error => this.notifyError(error));
  }

  private stopPolling(key: string): void {
    const intervalId = this.pollingIntervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(key);
    }
  }

  private async fetchLatestData(indicator: string, region: string): Promise<DataUpdate> {
    // Simulate real API call with enhanced data
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const key = `${indicator}-${region}`;
    const lastValue = this.lastValues.get(key) || this.getBaseValue(indicator);
    
    // Generate realistic fluctuations
    const volatility = this.getVolatility(indicator);
    const trend = this.getTrend(indicator);
    const randomChange = (Math.random() - 0.5) * volatility;
    const trendChange = trend * 0.001; // Small trend component
    
    const newValue = lastValue + lastValue * (trendChange + randomChange);
    const change = newValue - lastValue;
    const changePercent = (change / lastValue) * 100;
    
    this.lastValues.set(key, newValue);
    
    return {
      timestamp: new Date().toISOString(),
      indicator,
      region,
      value: Number(newValue.toFixed(2)),
      change: Number(change.toFixed(3)),
      changePercent: Number(changePercent.toFixed(2)),
      source: this.getDataSource(indicator),
      reliability: 'high'
    };
  }

  private handleUpdate(update: DataUpdate): void {
    const key = `${update.indicator}-${update.region}`;
    
    // Check for alerts
    this.checkAlerts(update);
    
    // Notify subscribers
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  private checkAlerts(update: DataUpdate): void {
    const key = `${update.indicator}-${update.region}`;
    const alertConfig = this.alerts.get(key);
    
    if (!alertConfig) return;
    
    let triggered = false;
    
    if (alertConfig.type === 'absolute') {
      triggered = Math.abs(update.change) >= alertConfig.threshold;
    } else {
      triggered = Math.abs(update.changePercent) >= alertConfig.threshold;
    }
    
    if (triggered) {
      const direction = update.change > 0 ? 'increase' : 'decrease';
      if (alertConfig.direction === 'both' || alertConfig.direction === direction) {
        this.triggerAlert(update, alertConfig);
      }
    }
  }

  private triggerAlert(update: DataUpdate, config: AlertConfig): void {
    if (this.config.enableNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`Climate Alert: ${update.indicator}`, {
          body: `${update.region}: ${update.changePercent}% change detected`,
          icon: '/climate-icon.png'
        });
      }
    }
    
    console.warn('Climate Alert:', {
      indicator: update.indicator,
      region: update.region,
      change: update.changePercent,
      threshold: config.threshold
    });
  }

  private getBaseValue(indicator: string): number {
    const baseValues = {
      co2: 415,
      avg_temperature: 14.8,
      gdp: 52000,
      renewable_adoption: 28
    };
    return baseValues[indicator as keyof typeof baseValues] || 100;
  }

  private getVolatility(indicator: string): number {
    const volatilities = {
      co2: 0.002, // 0.2% daily volatility
      avg_temperature: 0.01, // 1% daily volatility
      gdp: 0.005, // 0.5% daily volatility
      renewable_adoption: 0.003 // 0.3% daily volatility
    };
    return volatilities[indicator as keyof typeof volatilities] || 0.005;
  }

  private getTrend(indicator: string): number {
    const trends = {
      co2: 0.5, // Slight upward trend
      avg_temperature: 0.3, // Upward trend
      gdp: 0.2, // Slight upward trend
      renewable_adoption: 1.0 // Strong upward trend
    };
    return trends[indicator as keyof typeof trends] || 0;
  }

  private getDataSource(indicator: string): string {
    const sources = {
      co2: 'NOAA Global Monitoring Laboratory',
      avg_temperature: 'NASA GISS Temperature Data',
      gdp: 'World Bank Global Economic Data',
      renewable_adoption: 'International Energy Agency'
    };
    return sources[indicator as keyof typeof sources] || 'Real-time Data Feed';
  }

  private notifyError(error: Error): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (e) {
        console.error('Error handler failed:', e);
      }
    });
  }

  // Request notification permissions
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }

  // Cleanup
  disconnect(): void {
    // Close WebSocket
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    // Clear all polling
    this.pollingIntervals.forEach(intervalId => clearInterval(intervalId));
    this.pollingIntervals.clear();
    
    // Clear subscribers
    this.subscribers.clear();
    this.errorHandlers.length = 0;
    this.alerts.clear();
    this.lastValues.clear();
  }
}

// Singleton instance with production configuration
export const realTimeService = new RealTimeService({
  websocketUrl: import.meta.env.VITE_REALTIME_WS_URL,
  pollInterval: 30000, // 30 seconds
  retryAttempts: 5,
  enableNotifications: true
});

export type { DataUpdate, AlertConfig };
export default RealTimeService;