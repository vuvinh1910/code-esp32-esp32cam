import { useState, useEffect } from 'react';
import { Droplets, CloudRain, ShieldCheck, Info, Check } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Switch,
} from '../components/ui';
import { Header } from '../components/Layout/Header';
import { configAPI, deviceAPI } from '../api/client';
import { toast } from 'sonner';

const SeasonButton = ({ title, desc, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`relative w-full text-left p-4 rounded-xl mb-3 flex items-start gap-4 transition-all ${
      active 
        ? 'bg-primary text-white shadow-soft' 
        : 'bg-gray-50 text-gray-900 border border-gray-100 hover:bg-gray-100'
    }`}
  >
    <div className={`mt-1 p-2 rounded-full ${active ? 'bg-accent text-primary' : 'bg-white text-gray-400'}`}>
      {icon}
    </div>
    <div className="flex-1">
      <h4 className="font-bold text-base">{title}</h4>
      <p className={`text-sm mt-0.5 ${active ? 'text-gray-300' : 'text-gray-500'}`}>{desc}</p>
    </div>
    {active && <div className="absolute top-4 right-4 bg-white/20 p-1 rounded-full"><Check className="h-4 w-4" /></div>}
  </button>
);

export function WateringConfig() {
  const [config, setConfig] = useState({
    autoMode: true,
    minSoilMoisture: 24,
    maxSoilMoisture: 68,
    overrideByWeather: true,
    season: 'summer',
  });
  const [deviceId, setDeviceId] = useState(null);
  const [deviceName, setDeviceName] = useState('N/A');
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const deviceRes = await deviceAPI.getAll();
        const devices = Array.isArray(deviceRes.data) ? deviceRes.data : [];

        if (!devices.length) {
          setLoading(false);
          return;
        }

        const firstDevice = devices[0];
        setDeviceId(firstDevice.id);
        setDeviceName(firstDevice.name || firstDevice.macAddress || firstDevice.id);

        const res = await configAPI.get(firstDevice.id);
        if (res.data) {
          setConfig(prev => ({
            ...prev,
            minSoilMoisture: res.data.minSoilMoisture ?? prev.minSoilMoisture,
            maxSoilMoisture: res.data.maxSoilMoisture ?? prev.maxSoilMoisture,
            overrideByWeather: res.data.overrideByWeather ?? prev.overrideByWeather,
          }));
          setDeviceId(res.data.deviceId);
          setLastSyncedAt(new Date());
        }
      } catch (err) {
        console.error('Failed to load watering config', err);
        if (err?.response?.status !== 404) {
          toast.error('Failed to load watering config');
        }
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    if (!deviceId) {
      toast.error('No device selected');
      return;
    }

    try {
      await configAPI.upsert({
        deviceId,
        minSoilMoisture: config.minSoilMoisture,
        maxSoilMoisture: config.maxSoilMoisture,
        overrideByWeather: config.overrideByWeather
      });
      toast.success('Settings Applied successfully');
      setLastSyncedAt(new Date());
    } catch {
      toast.error('Failed to save configuration');
    }
  };

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!deviceId) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto space-y-8 bg-background min-h-screen">
        <Header title="Watering Config" />
        <Card className="rounded-[28px] p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">No devices found</h3>
          <p className="text-gray-500">Please create a device first before editing watering settings.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 bg-background min-h-screen">
      <Header title={
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Watering Config</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Device: {deviceName}</p>
        </div>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Controls (Left Column) */}
        <div className="lg:col-span-2 space-y-8">
          
          <Card className="rounded-[28px] p-2">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Moisture Thresholds</CardTitle>
                  <p className="text-gray-500 text-sm mt-1">Define the precision trigger points for your irrigation pump.</p>
                </div>
                <div className="bg-accent/50 p-3 rounded-full">
                  <Droplets className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-10">
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="font-bold text-gray-900 uppercase tracking-widest text-xs">MIN SOIL MOISTURE (TURN ON)</label>
                  <div className="text-3xl font-bold">{config.minSoilMoisture}<span className="text-xl text-gray-400">%</span></div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.minSoilMoisture}
                  onChange={(e) => handleChange('minSoilMoisture', Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-sm text-gray-500">Pump will activate when moisture drops below this point.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="font-bold text-gray-900 uppercase tracking-widest text-xs">MAX SOIL MOISTURE (TURN OFF)</label>
                  <div className="text-3xl font-bold">{config.maxSoilMoisture}<span className="text-xl text-gray-400">%</span></div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.maxSoilMoisture}
                  onChange={(e) => handleChange('maxSoilMoisture', Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-sm text-gray-500">Pump will deactivate once saturation reaches this level.</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-[28px] p-6 flex flex-col justify-between h-full bg-[#f8fbfa] border-0 shadow-sm">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg">Weather Override</h3>
                  <Switch
                    checked={config.overrideByWeather}
                    onCheckedChange={(c) => handleChange('overrideByWeather', c)}
                  />
                </div>
                <p className="text-sm text-gray-500 mb-6">Suspend watering if rain is forecasted in the next 6 hours.</p>
              </div>
              <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="bg-orange-50 p-2 rounded-lg"><CloudRain className="h-5 w-5 text-orange-400" /></div>
                <div>
                  <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">Forecast</p>
                  <p className="text-sm font-bold text-gray-900">24°C • Chance of Rain 15%</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[28px] p-6 flex flex-col justify-between h-full bg-[#f8fbfa] border-0 shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">Operational Mode</h3>
                  <div className="bg-gray-200/60 p-1 rounded-lg flex text-sm font-semibold">
                    <button 
                      className={`px-3 py-1 rounded-md transition-all ${config.autoMode ? 'bg-white shadow pointer-events-none' : 'text-gray-500 hover:text-gray-900'}`}
                      onClick={() => handleChange('autoMode', true)}
                    >
                      Auto
                    </button>
                    <button 
                      className={`px-3 py-1 rounded-md transition-all ${!config.autoMode ? 'bg-white shadow pointer-events-none' : 'text-gray-500 hover:text-gray-900'}`}
                      onClick={() => handleChange('autoMode', false)}
                    >
                      Manual
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-6">Switch between AI-guided or manual pump control.</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900 bg-white/50 w-fit px-4 py-2 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-gray-500" /> AI Optimization Active
              </div>
            </Card>
          </div>

        </div>

        {/* Seasonal Profile (Right Column) */}
        <div className="lg:col-span-1">
          <Card className="rounded-[28px] h-full p-2 border-0 shadow-soft">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-xl">Seasonal Profile</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 h-full flex flex-col">
              
              <SeasonButton 
                title="Spring" 
                desc="Moderate hydration (15-45%)" 
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22S7 16 7 11a5 5 0 0 1 10 0c0 5-5 11-5 11Z"/><path d="M12 22V11"/></svg>}
                active={config.season === 'spring'} 
                onClick={() => handleChange('season', 'spring')} 
              />
              <SeasonButton 
                title="Summer" 
                desc="High frequency (25-70%)" 
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>}
                active={config.season === 'summer'} 
                onClick={() => handleChange('season', 'summer')} 
              />
              <SeasonButton 
                title="Autumn" 
                desc="Reduction phase (20-50%)" 
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 10 4-6 4 6"/><path d="m12 4v16"/><path d="m12 14-4-4"/><path d="m12 14 4-4"/></svg>}
                active={config.season === 'autumn'} 
                onClick={() => handleChange('season', 'autumn')} 
              />
              <SeasonButton 
                title="Winter" 
                desc="Dormancy mode (10-30%)" 
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10 20-4-4 4-4"/><path d="M14 14v6"/><path d="m14 4-4 4 4 4"/><path d="M10 10V4"/></svg>}
                active={config.season === 'winter'} 
                onClick={() => handleChange('season', 'winter')} 
              />

              <div className="mt-auto border border-dashed border-gray-300 rounded-xl p-5 bg-gray-50/50">
                <div className="flex gap-2 items-center text-sm font-bold text-gray-900 mb-2">
                  <Info className="h-4 w-4" /> Expert Recommendation
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Based on your plant species (Ficus Lyrata), Summer mode is highly recommended to prevent leaf browning during peak solar hours.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-8 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Last synced: {lastSyncedAt ? lastSyncedAt.toLocaleString() : 'Not synced yet'}
        </p>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="font-bold text-gray-900 hover:bg-gray-100 px-6 h-12 rounded-xl">Discard Changes</Button>
          <Button onClick={handleSave} className="font-bold bg-primary hover:bg-primary-light px-8 h-12 rounded-xl shadow-sm text-base">Save Configuration</Button>
        </div>
      </div>
    </div>
  );
}
