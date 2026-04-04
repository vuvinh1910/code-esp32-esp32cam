import { useState, useEffect } from 'react';
import { CheckCircle, Activity, RotateCcw, AlertTriangle, DownloadCloud, Zap, ChevronRight, Loader2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button
} from '../components/ui';
import { Header } from '../components/Layout/Header';
import { firmwareAPI, deviceAPI } from '../api/client';
import { toast } from 'sonner';

export function FirmwareUpdates() {
  const [firmwares, setFirmwares] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fwRes, devRes] = await Promise.all([
        firmwareAPI.getAll(),
        deviceAPI.getAll()
      ]);
      setFirmwares(fwRes.data || []);
      setDevices(devRes.data || []);
    } catch {
      toast.error('Failed to load firmware data');
    } finally {
      setLoading(false);
    }
  };

  const currentFirmware = firmwares.length > 0 ? firmwares[0] : null;

  const handleRollback = async (version) => {
    if (!confirm(`Are you sure you want to rollback to ${version}?`)) return;
    setActionLoading(true);
    try {
      await firmwareAPI.rollback(version);
      toast.success(`Successfully rolled back to ${version}`);
      fetchData();
    } catch {
      toast.error('Rollback failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckUpdates = async () => {
    setActionLoading(true);
    try {
      // Hardcode deviceType to CONTROL_NODE for now
      const res = await firmwareAPI.latest('CONTROL_NODE');
      if (res.data) {
        toast.info(`Latest firmware is ${res.data.version}`);
      } else {
        toast.success(`You are on the latest firmware!`);
      }
    } catch {
      toast.error('Failed to check for updates');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 bg-background min-h-screen">
      <Header title={
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Firmware Updates</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Manage system versions & OTA protocols</p>
        </div>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Column: Status & Devices */}
        <div className="lg:col-span-2 space-y-8">
          
          <Card className="rounded-[28px] bg-primary text-white border-0 shadow-soft relative overflow-hidden p-2">
            <CardHeader className="p-6 pb-2">
              <p className="text-white/60 text-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-status-success animate-pulse" /> Firmware Status
              </p>
              <h2 className="text-4xl font-bold tracking-tight">{currentFirmware?.version || 'Unknown'}</h2>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-white/80 font-medium leading-relaxed mb-8">
                Your conservatory system is running the latest stable release. No critical updates required.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleCheckUpdates}
                  disabled={actionLoading}
                  className="font-bold bg-white text-primary hover:bg-gray-100 px-6 h-12 rounded-xl text-sm flex-1"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <DownloadCloud className="h-4 w-4 mr-2" />} 
                  Check for Updates
                </Button>
                <Button disabled={actionLoading} variant="ghost" className="font-bold hover:bg-white/10 px-6 h-12 rounded-xl text-sm flex-1 text-white border border-white/20">
                  <Zap className="h-4 w-4 mr-2 text-accent" /> Install Nightly
                </Button>
              </div>
            </CardContent>
            {/* Decorative background element */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
          </Card>

          <Card className="rounded-[28px] border-0 shadow-soft">
            <CardHeader className="p-6 border-b border-gray-50 flex items-center justify-between flex-row">
              <CardTitle className="text-lg">Active Devices</CardTitle>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-bold border-0">{devices.filter(d => d.status === 'ACTIVE').length} Online</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col gap-6">
                {!loading && devices.map((device, i) => (
                  <div key={device.id || i} className="flex items-center gap-4">
                    <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{device.name}</p>
                      <p className="text-sm font-medium text-gray-500">{device.currentFirmwareVersion || currentFirmware?.version || 'N/A'}</p>
                    </div>
                    {device.status === 'ACTIVE' && <CheckCircle className="h-5 w-5 text-status-success" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-3">
          <Card className="rounded-[28px] h-full border-0 shadow-soft">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl">Version Rollback & History</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-8 mt-4 relative">
                {/* Timeline line */}
                <div className="absolute top-4 bottom-10 left-[19px] w-0.5 bg-gray-100" />
                
                {!loading && firmwares.map((fw, index) => {
                  const isCurrent = index === 0; // Assuming sorted desc
                  return (
                  <div key={fw.id} className="relative flex gap-6 z-10">
                    {/* Timeline Node */}
                    <div className="mt-1">
                      <div className={`h-10 w-10 flex items-center justify-center rounded-full border-4 border-white shadow-sm
                        ${isCurrent ? 'bg-primary text-accent' : 'bg-gray-200 text-gray-400'}`}
                      >
                        {isCurrent ? <CheckCircle className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}
                      </div>
                    </div>

                    <div className="flex-1 bg-gray-50/50 rounded-2xl p-6 border border-gray-100/50 hover:border-primary/20 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-lg text-gray-900">{fw.version}</h3>
                            <Badge variant={isCurrent ? 'success' : 'secondary'} className="rounded-md uppercase tracking-wider text-[10px] font-bold">
                              {isCurrent ? 'Stable' : 'Legacy'}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-500">Released: {new Date(fw.releasedAt).toLocaleDateString()}</p>
                        </div>
                        {isCurrent ? (
                          <Badge variant="success" className="bg-status-success/10 text-status-success border-0 px-3 py-1 text-xs uppercase tracking-wider font-bold">Current</Badge>
                        ) : (
                          <Button 
                            variant="outline" 
                            disabled={actionLoading}
                            onClick={() => handleRollback(fw.version)}
                            className="h-9 px-4 rounded-xl font-bold bg-white text-gray-700 hover:text-primary hover:border-primary transition-colors hover:bg-gray-50"
                          >
                            Rollback
                          </Button>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">{fw.releaseNotes}</p>
                      
                      {/* Read More link */}
                      <button className="text-sm font-bold text-primary flex items-center hover:text-primary-light transition-colors">
                        View Release Notes <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                )})}
              </div>

              {/* Warning Banner */}
              <div className="mt-8 bg-orange-50 border border-orange-100 rounded-2xl p-5 flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Important Note About Rollbacks</h4>
                  <p className="text-sm text-gray-600">Reverting to firmware versions older than v2.3.0 may cause incompatibilities with the latest AI moisture models. Proceed with caution.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
