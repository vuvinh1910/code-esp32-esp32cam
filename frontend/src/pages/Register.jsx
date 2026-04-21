import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Loader2, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button, Input, Label, Card, CardContent } from '../components/ui';
import { authAPI } from '../api/client';
import { toast } from 'sonner';

const extractErrorMessage = (error) => {
  const data = error?.response?.data;
  if (!data) return 'Register failed. Please try again.';
  if (typeof data.message === 'string') return data.message;
  if (typeof data === 'string') return data;

  const fieldError = Object.values(data).find((value) => typeof value === 'string');
  return fieldError || 'Register failed. Please check your information.';
};

export function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Password confirmation does not match.');
      return;
    }

    setLoading(true);

    try {
      await authAPI.register(formData.username, formData.password, formData.email);
      toast.success('Register successful. Please login.');
      setTimeout(() => navigate('/login', { replace: true }), 500);
    } catch (error) {
      toast.error(extractErrorMessage(error));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] flex flex-col items-center justify-center p-4 relative overflow-hidden">
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

      <div className="mb-8 text-center flex flex-col items-center z-10">
        <div className="bg-primary p-3 rounded-xl mb-3 shadow-sm">
          <Droplets className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">PlantOS</h1>
        <p className="text-gray-500 text-sm font-medium mt-1">Create your account</p>
      </div>

      <Card className="w-full max-w-md p-8 z-10">
        <CardContent className="p-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Register</h2>
            <p className="text-gray-500 mt-1">Set up an account to manage your watering system.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">Username</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="username"
                  type="text"
                  placeholder="yourname"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="pl-10 bg-gray-50 border-gray-200 focus-visible:ring-primary h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="email"
                  type="email"
                  placeholder="name@plantos.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="pl-10 bg-gray-50 border-gray-200 focus-visible:ring-primary h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="pl-10 bg-gray-50 border-gray-200 focus-visible:ring-primary h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">Confirm Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="pl-10 bg-gray-50 border-gray-200 focus-visible:ring-primary h-12 rounded-xl"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl bg-[#1A3B2E] hover:bg-primary gap-2" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Creating account...</>
              ) : (
                <>Create Account <ArrowRight className="h-5 w-5" /></>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-10 text-center text-sm font-medium text-gray-500 z-10">
        <p>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-primary hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
