import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Wifi } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Label,
} from '../components/ui';
import { deviceAPI } from '../api/client';
import { toast } from 'sonner';

export function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    macAddress: '',
    espIpAddress: '',
    deviceType: 'CONTROL_NODE',
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    try {
      const res = await deviceAPI.getAll();
      setDevices(res.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const uiData = {
        name: formData.name,
        macAddress: formData.macAddress,
        espIpAddress: formData.espIpAddress,
        deviceType: formData.deviceType,
      };
      const userId = localStorage.getItem('userId');
      if (userId) {
        uiData.userId = userId;
      }

      if (editingDevice) {
        await deviceAPI.update(editingDevice.id, uiData);
        toast.success('Device updated successfully');
      } else {
        await deviceAPI.create(uiData);
        toast.success('Device created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchDevices();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      macAddress: device.macAddress,
      espIpAddress: device.espIpAddress || '',
      deviceType: device.deviceType,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    try {
      await deviceAPI.delete(id);
      toast.success('Device deleted successfully');
      fetchDevices();
    } catch {
      toast.error('Failed to delete device');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', macAddress: '', espIpAddress: '', deviceType: 'CONTROL_NODE' });
    setEditingDevice(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Device Management</h1>
          <p className="text-gray-600 mt-1">Manage your IoT devices</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Device
        </Button>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.length > 0 ? (
          devices.map((device) => (
            <Card key={device.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Wifi className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{device.name}</h3>
                      <p className="text-sm text-gray-600">{device.macAddress}</p>
                    </div>
                  </div>
                  <Badge variant={device.status === 'ONLINE' || device.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {device.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Type:</strong> {device.deviceType || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 break-all">
                    <strong>ESP IP:</strong> {device.espIpAddress || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Added:</strong> {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(device)}
                    className="flex-1"
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(device.id)}
                    className="flex-1"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No devices found. Add your first device!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>{editingDevice ? 'Edit Device' : 'Add New Device'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" required>Device Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Garden Sensor 1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="macAddress" required>MAC Address</Label>
                  <Input
                    id="macAddress"
                    name="macAddress"
                    value={formData.macAddress}
                    onChange={handleChange}
                    placeholder="00:1B:44:11:3A:B7"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="espIpAddress">ESP32-CAM IP</Label>
                  <Input
                    id="espIpAddress"
                    name="espIpAddress"
                    value={formData.espIpAddress}
                    onChange={handleChange}
                    placeholder="192.168.1.10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceType" required>Device Type</Label>
                  <select
                    id="deviceType"
                    name="deviceType"
                    value={formData.deviceType}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    required
                  >
                    <option value="CONTROL_NODE">Control Node</option>
                    <option value="VISION_NODE">Vision Node</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingDevice ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
