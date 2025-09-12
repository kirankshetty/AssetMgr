import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ArrowRight, 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Key
} from 'lucide-react';

const NewLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Forgot Password Modal State
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        setErrors({ general: 'Invalid email or password. Please try again.' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Login failed. Please check your credentials and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setForgotPasswordLoading(true);
    
    try {
      // Here you would typically call an API to send password reset email
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setForgotPasswordSent(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Failed to send password reset email. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setForgotPasswordEmail('');
    setForgotPasswordSent(false);
    setForgotPasswordLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AssetFlow</h1>
                <p className="text-sm text-gray-600">Smart Asset Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="px-6 py-2"
              >
                Back to Home
              </Button>
              <Button
                onClick={() => navigate('/register')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Register Now
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Shield className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-gray-600">
              Sign in to your AssetFlow account
            </p>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl text-center text-gray-900">Sign In</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {errors.general}
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="mt-1 relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="mt-1 relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-500 font-medium"
                          onClick={() => setForgotPasswordOpen(true)}
                        >
                          Forgot password?
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center">
                            <Key className="h-5 w-5 mr-2 text-blue-600" />
                            Reset Password
                          </DialogTitle>
                        </DialogHeader>
                        
                        {!forgotPasswordSent ? (
                          <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div>
                              <Label htmlFor="forgotEmail" className="text-sm font-medium text-gray-700">
                                Email Address
                              </Label>
                              <div className="mt-1 relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                  id="forgotEmail"
                                  type="email"
                                  value={forgotPasswordEmail}
                                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                  className="pl-10"
                                  placeholder="Enter your email address"
                                  disabled={forgotPasswordLoading}
                                />
                              </div>
                            </div>
                            
                            <Alert className="bg-blue-50 border-blue-200">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <AlertDescription className="text-blue-800">
                                We'll send password reset instructions to your email address.
                              </AlertDescription>
                            </Alert>
                            
                            <div className="flex space-x-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setForgotPasswordOpen(false);
                                  resetForgotPassword();
                                }}
                                className="flex-1"
                                disabled={forgotPasswordLoading}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                disabled={forgotPasswordLoading}
                              >
                                {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Check Your Email</h3>
                              <p className="text-gray-600 mt-2">
                                We've sent password reset instructions to:
                              </p>
                              <p className="font-medium text-blue-600 mt-1">
                                {forgotPasswordEmail}
                              </p>
                            </div>
                            <Alert className="bg-blue-50 border-blue-200">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <AlertDescription className="text-blue-800">
                                If you don't see the email, check your spam folder or try again.
                              </AlertDescription>
                            </Alert>
                            <Button
                              onClick={() => {
                                setForgotPasswordOpen(false);
                                resetForgotPassword();
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              Got it, thanks!
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center"
                >
                  {loading ? (
                    'Signing in...'
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/register')}
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Register now
                    </button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Alert className="bg-gray-50 border-gray-200">
            <Shield className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-700 text-sm">
              Your login is secured with SSL encryption and multi-factor authentication.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default NewLoginPage;