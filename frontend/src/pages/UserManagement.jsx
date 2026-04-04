import { useState, useEffect } from 'react';
import { Users, ShieldCheck, Mail, Search, MoreVertical, Plus } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Input,
  Button
} from '../components/ui';
import { Header } from '../components/Layout/Header';
import { userAPI } from '../api/client';
import { toast } from 'sonner';

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.status === 'Active').length;
  const pendingUsers = users.filter((user) => user.status === 'Pending').length;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await userAPI.getAll();
        setUsers(res.data || []);
      } catch (err) {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <Header title={
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 text-sm font-medium mt-1">Manage access controls and roles</p>
          </div>
        } />
        <Button className="font-bold bg-primary hover:bg-primary-light px-6 h-12 rounded-xl shadow-sm text-base gap-2 -mt-4">
          <Plus className="h-5 w-5" /> Invite User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[28px] p-6 border-0 shadow-soft flex items-center gap-6">
          <div className="bg-primary/10 p-4 rounded-2xl">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Users</p>
            <p className="text-4xl font-bold text-gray-900 mb-1">{totalUsers}</p>
            <p className="text-xs font-semibold text-gray-400">Active Users: {activeUsers}</p>
          </div>
        </Card>

        <Card className="rounded-[28px] p-6 border-0 shadow-soft flex items-center gap-6">
          <div className="bg-orange-50 p-4 rounded-2xl">
            <ShieldCheck className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Admin Users</p>
            <p className="text-4xl font-bold text-gray-900 mb-1">{users.filter(u => u.role === 'ADMIN').length}</p>
            <p className="text-xs font-semibold text-gray-400">Full Access Privileges</p>
          </div>
        </Card>

        <Card className="rounded-[28px] p-6 border-0 shadow-soft flex items-center gap-6">
          <div className="bg-accent/20 p-4 rounded-2xl">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Invites</p>
            <p className="text-4xl font-bold text-gray-900 mb-1">{pendingUsers}</p>
            <p className="text-xs font-semibold text-gray-400">Awaiting confirmation</p>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="rounded-[28px] border-0 shadow-soft overflow-hidden">
        <CardHeader className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2 text-sm font-bold bg-gray-100 p-1 rounded-xl w-fit">
            <button className="px-4 py-2 bg-white rounded-lg shadow-sm text-gray-900">All Users</button>
            <button className="px-4 py-2 text-gray-500 hover:text-gray-900">Admins</button>
            <button className="px-4 py-2 text-gray-500 hover:text-gray-900">Operators</button>
            <button className="px-4 py-2 text-gray-500 hover:text-gray-900">Pending</button>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-9 h-10 rounded-xl bg-gray-50 border-gray-100" placeholder="Search users..." />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-6 font-bold">User</th>
                  <th className="p-6 font-bold">Role</th>
                  <th className="p-6 font-bold">Status</th>
                  <th className="p-6 font-bold">Last Active</th>
                  <th className="p-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!loading && users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center font-bold text-primary">
                          {user.initial}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="rounded-lg px-3 py-1 font-bold">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        user.status === 'Active' ? 'bg-status-success/10 text-status-success' :
                        user.status === 'Offline' ? 'bg-gray-100 text-gray-500' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          user.status === 'Active' ? 'bg-status-success' :
                          user.status === 'Offline' ? 'bg-gray-500' :
                          'bg-orange-500'
                        }`} />
                        {user.status}
                      </span>
                    </td>
                    <td className="p-6 text-sm font-medium text-gray-600">
                      {user.lastActive}
                    </td>
                    <td className="p-6 text-right">
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-6 border-t border-gray-100 flex items-center justify-between text-sm font-medium text-gray-500">
            <p>Showing {totalUsers > 0 ? 1 : 0} to {totalUsers} of {totalUsers} users</p>
            <div className="flex gap-2">
              <Button variant="outline" className="h-9 px-4 rounded-lg bg-gray-50 border-gray-200">Previous</Button>
              <Button variant="outline" className="h-9 w-9 p-0 rounded-lg bg-primary text-white border-primary hover:bg-primary-light hover:text-white">1</Button>
              <Button variant="outline" className="h-9 w-9 p-0 rounded-lg bg-gray-50 border-gray-200">2</Button>
              <Button variant="outline" className="h-9 w-9 p-0 rounded-lg bg-gray-50 border-gray-200">3</Button>
              <Button variant="outline" className="h-9 px-4 rounded-lg bg-gray-50 border-gray-200">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
