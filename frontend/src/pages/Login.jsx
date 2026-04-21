import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button, Input, Label, Card, CardContent } from '../components/ui';
import { authAPI } from '../api/client';
import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData.username, formData.password);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.userId) {
          localStorage.setItem('userId', response.data.userId);
        }
        if (response.data.role) {
          localStorage.setItem('userRole', response.data.role);
        }
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }
    } catch {
      toast.error('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Watermarks */}
      <img 
        src="/assets/watermark_leaf_1774841000050.png" 
        alt="" 
        className="absolute top-10 left-10 w-48 opacity-5 -rotate-12 pointer-events-none mix-blend-multiply"
      />
      <img 
        src="/assets/watermark_leaf_1774841000050.png" 
        alt="" 
        className="absolute bottom-10 right-10 w-64 opacity-10 rotate-12 pointer-events-none mix-blend-multiply"
      />

      {/* Header Logo */}
      <div className="mb-8 text-center flex flex-col items-center z-10">
        <div className="bg-primary p-3 rounded-xl mb-3 shadow-sm">
          <Droplets className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">PlantOS</h1>
        <p className="text-gray-500 text-sm font-medium mt-1">Digital Conservatory Management</p>
      </div>

      <Card className="w-full max-w-md p-8 z-10">
        <CardContent className="p-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500 mt-1">Please enter your credentials to access your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">Email Address</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="username"
                  type="text"
                  placeholder="name@plantos.com"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="pl-10 bg-gray-50 border-gray-200 focus-visible:ring-primary h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-gray-700">Password</Label>
                <a href="#" className="text-sm font-semibold text-gray-900 hover:text-primary transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="pl-10 bg-gray-50 border-gray-200 focus-visible:ring-primary h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="remember" className="font-medium text-gray-600 cursor-pointer">Remember this device</Label>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl bg-[#1A3B2E] hover:bg-primary gap-2" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Logging in...</>
              ) : (
                <>Sign In <ArrowRight className="h-5 w-5" /></>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-12 text-center text-sm font-medium text-gray-500 z-10">
        <p>Protected by enterprise-grade encryption.</p>
        <p>
          Need an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-primary hover:underline"
          >
            Create one here
          </button>
        </p>
      </div>
    </div>
  );
}
