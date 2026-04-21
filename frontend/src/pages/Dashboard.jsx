import { useState, useEffect } from 'react';
import { 
  Droplets, Thermometer, MapPin, Wind, Sun, RotateCcw
} from 'lucide-react';
import {
  Card,
  Switch,
  Button,
} from '../components/ui';
import { Header } from '../components/Layout/Header';
import { aiAPI, dashboardAPI, deviceAPI, pumpAPI, sensorAPI } from '../api/client';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

const DASHBOARD_DEVICE_KEY = 'dashboardSelectedDeviceId';

const emptyStatus = {
  pumpStatus: false,
  autoMode: false,
  humidityThreshold: null,
  currentHumidity: null,
  airTemperature: null,
  airHumidity: null,
  lightLevel: null,
  waterLevel: null,
};

const normalizeStatus = (payload = {}) => ({
  pumpStatus: payload.pumpStatus ?? payload.pump_status ?? false,
  autoMode: payload.autoMode ?? payload.auto_mode ?? false,
  humidityThreshold: payload.humidityThreshold ?? payload.humidity_threshold ?? null,
  currentHumidity: payload.currentHumidity ?? payload.current_humidity ?? null,
  airTemperature: payload.airTemperature ?? payload.air_temperature ?? null,
  airHumidity: payload.airHumidity ?? payload.air_humidity ?? null,
  lightLevel: payload.lightLevel ?? payload.light_level ?? null,
  waterLevel: payload.waterLevel ?? payload.water_level ?? null,
});

const getWaterLevelMeta = (waterLevel) => {
  const value = String(waterLevel || '').toUpperCase();
  if (!value) {
    return {
      percent: 0,
      label: '--',
      barClass: 'bg-gray-300',
      recommendation: 'Waiting for water-level telemetry',
    };
  }

  if (value === 'LOW') {
    return {
      percent: 15,
      label: 'LOW',
      barClass: 'bg-red-500',
      recommendation: 'Refill now to avoid dry-run',
    };
  }

  return {
    percent: 80,
    label: value || 'OK',
    barClass: 'bg-primary',
    recommendation: 'Tank level is safe',
  };
};

export function Dashboard() {
  const [status, setStatus] = useState(emptyStatus);
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [recognizing, setRecognizing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);
  const waterLevelMeta = getWaterLevelMeta(status.waterLevel);
  const healthScore = status.currentHumidity === null || status.currentHumidity === undefined
    ? '--'
    : `${Math.round(status.currentHumidity)}%`;

  const formatMetric = (value, unit = '') => {
    if (value === null || value === undefined) return '--';
    return `${value}${unit}`;
  };

  const formatConfidence = (confidenceValue) => {
    if (confidenceValue === null || confidenceValue === undefined) return '--';
    const numericValue = Number(confidenceValue);
    if (Number.isNaN(numericValue)) return '--';
    const normalized = numericValue <= 1 ? numericValue * 100 : numericValue;
    return `${normalized.toFixed(1)}%`;
  };

  async function fetchDashboardData(deviceId) {
    if (!deviceId) return;

    try {
      const [statusRes, readingsRes, pumpRes] = await Promise.all([
        dashboardAPI.getSummary(deviceId),
        sensorAPI.getReadings(deviceId, { size: 9 }),
        pumpAPI.getHistory(deviceId)
      ]);

      const readings = Array.isArray(readingsRes.data?.content) ? readingsRes.data.content : [];
      const sortedReadings = [...readings].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
      const formattedChart = sortedReadings
        .map((reading) => ({
          time: new Date(reading.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Number(reading.soilMoisture ?? 0)
        }));

      const normalizedStatus = normalizeStatus(statusRes.data || {});
      if (!normalizedStatus.waterLevel && sortedReadings.length > 0) {
        normalizedStatus.waterLevel = sortedReadings[sortedReadings.length - 1]?.waterLevel || null;
      }

      setStatus(normalizedStatus);
      setChartData(formattedChart);

      setActivities(Array.isArray(pumpRes.data) ? pumpRes.data : []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setLoading(false);
    }
  }

  useEffect(() => {
    let unmounted = false;

    const initDevices = async () => {
      try {
        const deviceRes = await deviceAPI.getAll();
        if (unmounted) return;

        const loadedDevices = Array.isArray(deviceRes.data) ? deviceRes.data : [];
        setDevices(loadedDevices);

        if (!loadedDevices.length) {
          setSelectedDevice(null);
          setLoading(false);
          return;
        }

        const savedDeviceId = localStorage.getItem(DASHBOARD_DEVICE_KEY);
        const initialDevice =
          loadedDevices.find((device) => device.id === savedDeviceId) ||
          loadedDevices.find((device) => device.status === 'ONLINE') ||
          loadedDevices[0];

        setSelectedDevice(initialDevice);
      } catch (err) {
        console.error('Failed to load devices for dashboard:', err);
        toast.error('Failed to load dashboard devices');
        setLoading(false);
      }
    };

    initDevices();

    return () => {
      unmounted = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDevice?.id) return undefined;

    let intervalId = null;
    setLoading(true);
    fetchDashboardData(selectedDevice.id);

    intervalId = setInterval(() => {
      fetchDashboardData(selectedDevice.id);
    }, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedDevice?.id]);

  async function handlePumpToggle() {
    if (!selectedDevice?.id) {
      toast.error('No device selected');
      return;
    }

    if (status.autoMode) {
      toast.error('Switch mode to Manual before controlling pump.');
      return;
    }

    try {
      await pumpAPI.control(selectedDevice.id, !status.pumpStatus ? 'TURN_ON' : 'TURN_OFF');
      fetchDashboardData(selectedDevice.id);
    } catch {
      toast.error('Failed to control pump');
    }
  }

  async function handleAiRecognition() {
    if (!selectedDevice?.id) {
      toast.error('No device selected');
      return;
    }

    const trimmedIp = (selectedDevice.espIpAddress || '').trim();
    if (!trimmedIp) {
      toast.error('Missing ESP32-CAM IP. Please update this device in Device Management.');
      return;
    }

    try {
      setRecognizing(true);
      const response = await aiAPI.triggerRecognition(selectedDevice.id, trimmedIp);
      setAiResult(response.data || null);
      toast.success('Plant recognition completed');
    } catch (error) {
      console.error('AI recognition failed:', error);
      toast.error(error.response?.data?.message || 'Failed to recognize plant from ESP32-CAM');
    } finally {
      setRecognizing(false);
    }
  }

  const handleDeviceChange = (event) => {
    const nextDeviceId = event.target.value;
    const nextDevice = devices.find((device) => device.id === nextDeviceId);
    if (!nextDevice) return;

    localStorage.setItem(DASHBOARD_DEVICE_KEY, nextDevice.id);
    setSelectedDevice(nextDevice);
    setStatus(emptyStatus);
    setStatus({
      pumpStatus: false,
      autoMode: false,
      humidityThreshold: null,
      currentHumidity: null,
      airTemperature: null,
      airHumidity: null,
      lightLevel: null,
    });
    setAiResult(null);
    setChartData([]);
    setActivities([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Droplets className="h-12 w-12 animate-bounce text-primary" />
      </div>
    );
  }

  if (!selectedDevice) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto bg-background min-h-screen">
        <Header title="Dashboard" />
        <Card className="rounded-[28px] p-8 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">No devices found</h3>
          <p className="text-gray-500">Create a device first in the Devices page to view live dashboard data.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6 bg-background min-h-screen">
      <Header title="Dashboard">
        {devices.length > 0 && (
          <select
            value={selectedDevice?.id || ''}
            onChange={handleDeviceChange}
            className="h-10 min-w-[220px] rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name || device.macAddress || device.id} ({device.status})
              </option>
            ))}
          </select>
        )}
      </Header>

      {/* Hero Section */}
      <div 
        className="w-full h-[280px] rounded-[32px] relative overflow-hidden shadow-soft flex"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/assets/rose_macro_background_1774840968878.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        
        <div className="relative z-10 p-10 flex flex-col justify-between w-full">
          <div className="flex items-center gap-3">
            <span className="bg-status-success text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider flex items-center gap-2">
              <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
              {selectedDevice.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}
            </span>
            <span className="text-gray-300 text-sm font-medium">
              Device ID: {selectedDevice.macAddress || selectedDevice.id}
            </span>
          </div>
          
          <div className="flex items-end justify-between w-full">
            <div>
              <h2 className="text-white text-5xl font-bold tracking-tight mb-3">{selectedDevice.name || 'IoT Device'}</h2>
              <div className="flex items-center text-gray-200 gap-2 font-medium">
                <MapPin className="h-4 w-4" />
                AI Detected: {aiResult?.plant || 'Unknown'}
              </div>
              {aiResult && (
                <div className="mt-2 text-sm text-gray-200/90">
                  Confidence: {formatConfidence(aiResult.confidence)} • Below threshold: {aiResult.below_threshold ? 'Yes' : 'No'}
                </div>
              )}
              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="h-10 min-w-[240px] rounded-lg border border-white/30 bg-white/10 px-3 text-sm text-white/90 flex items-center">
                  ESP32-CAM IP: {selectedDevice.espIpAddress || 'Not set'}
                </div>
                <Button
                  type="button"
                  variant="accent"
                  onClick={handleAiRecognition}
                  disabled={recognizing}
                  className="h-10"
                >
                  {recognizing ? 'Recognizing...' : 'Recognize Plant'}
                </Button>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-center shadow-2xl">
              <p className="text-white/80 text-xs font-bold tracking-widest uppercase mb-1">Health Score</p>
              <p className="text-white text-4xl font-bold">{healthScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="flex items-center justify-between p-7 rounded-[28px]">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Soil Moisture</p>
            <p className="text-4xl font-bold text-gray-900 mb-1">{formatMetric(status.currentHumidity, '%')}</p>
            <p className="text-xs font-bold text-status-success">Optimal Range</p>
          </div>
          <div className="h-14 w-14 rounded-full border-[3px] border-primary flex items-center justify-center">
            <Droplets className="h-6 w-6 text-primary" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-7 rounded-[28px]">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Air Temperature</p>
            <p className="text-4xl font-bold text-gray-900 mb-1">{formatMetric(status.airTemperature, '°C')}</p>
            <p className="text-xs font-medium text-gray-400">High: 31°C</p>
          </div>
          <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center">
            <Thermometer className="h-6 w-6 text-primary" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-7 rounded-[28px]">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Air Humidity</p>
            <p className="text-4xl font-bold text-gray-900 mb-1">{formatMetric(status.airHumidity, '%')}</p>
            <p className="text-xs font-medium text-gray-400">Stable</p>
          </div>
          <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center">
            <Wind className="h-6 w-6 text-primary" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-7 rounded-[28px]">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Light Level</p>
            <p className="text-4xl font-bold text-gray-900 mb-1">{formatMetric(status.lightLevel, ' lux')}</p>
            <p className="text-xs font-bold text-orange-500">Full Sun</p>
          </div>
          <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center">
            <Sun className="h-6 w-6 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Middle Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-primary text-white border-0 rounded-[28px] h-full p-8 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <RotateCcw className="h-6 w-6 text-accent" />
              <h3 className="text-xl font-bold">Pump Control</h3>
            </div>
            
            <div className="flex items-center gap-12">
              <div>
                <p className="text-white/50 text-xs font-bold tracking-widest uppercase mb-2">Trigger Source</p>
                <p className="text-lg font-semibold tracking-wide">{activities[0]?.triggeredBy || '--'}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs font-bold tracking-widest uppercase mb-2">Mode</p>
                <p className="text-lg font-semibold tracking-wide">{status.autoMode ? 'AUTO' : 'MANUAL'}</p>
              </div>
              <div className="flex-1 flex items-center justify-end gap-4">
                <span className="font-semibold">Current State: {status.pumpStatus ? <span className="text-status-success">ACTIVE</span> : <span className="text-white/50">IDLE</span>}</span>
                <Switch
                  checked={status.pumpStatus}
                  onCheckedChange={handlePumpToggle}
                  disabled={status.autoMode}
                  className={status.pumpStatus ? 'bg-status-success' : 'bg-white/20'}
                />
              </div>
            </div>

            <p className="mt-4 text-sm text-white/80">
              {status.autoMode
                ? `Auto mode is active. Pump is controlled by threshold ${formatMetric(status.humidityThreshold, '%')}.`
                : 'Manual mode is active. You can toggle pump from this switch.'}
            </p>
            
            {/* Background pure decorative circle */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="rounded-[28px] h-full flex flex-col p-8">
            <h3 className="text-lg font-bold mb-6">Water Tank Status</h3>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-24 h-40 bg-gray-100 rounded-t-3xl rounded-b-xl relative overflow-hidden border-4 border-gray-100 mb-4">
                <div
                  className={`absolute bottom-0 left-0 right-0 ${waterLevelMeta.barClass} rounded-b-xl flex flex-col items-center justify-center text-white transition-all duration-1000`}
                  style={{ height: `${waterLevelMeta.percent}%` }}
                >
                  <span className="font-bold text-lg">{waterLevelMeta.percent}%</span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider opacity-80">{waterLevelMeta.label}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                <RotateCcw className="h-3 w-3" /> {waterLevelMeta.recommendation}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Section: Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-[28px] p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">Soil Moisture (24h)</h3>
            <div className="flex items-center bg-gray-100 rounded-full p-1">
              <button className="px-4 py-1.5 rounded-full bg-white shadow-sm text-sm font-semibold">Live</button>
              <button className="px-4 py-1.5 rounded-full text-gray-500 text-sm font-semibold hover:text-gray-900">History</button>
            </div>
          </div>
          <div className="h-[250px] w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                No sensor readings yet for this device.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    ticks={[0, 50, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[6, 6, 6, 6]} 
                    barSize={40}
                    minPointSize={3}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value > 80 ? '#0B271C' : entry.value > 60 ? '#8FA39A' : '#E5E7EB'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-1 rounded-[28px] p-8">
          <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {activities.length > 0 ? (
              activities.slice(0, 5).map((log, i) => {
                const isStart = log.action === 'TURN_ON';
                const isLast = i === activities.slice(0, 5).length - 1;
                return (
                  <div key={log.id} className="flex gap-4">
                    <div className="relative">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${isStart ? 'bg-primary ring-4 ring-accent' : 'bg-gray-300'}`} />
                      {!isLast && <div className="absolute top-4 bottom-[-100%] left-1/2 -ml-px w-0.5 bg-gray-100" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{isStart ? 'Pump Started' : 'Pump Stopped'}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1 gap-2">
                        <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className={isStart ? 'font-semibold text-gray-700' : ''}>{log.triggeredBy || 'MANUAL_APP'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm">No recent pump activities recorded.</p>
            )}
          </div>
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <button className="text-sm font-bold text-gray-900 hover:text-primary transition-colors">
              View Detailed Logs
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
