import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Shield, 
  CreditCard,
  User,
  Mail,
  Phone,
  Building,
  Lock,
  Sparkles
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL 
  ? `${process.env.REACT_APP_BACKEND_URL}/api` 
  : 'http://localhost:8001/api';

const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID || 'AUHKUutCy9GAT_04UAmO_rrWje5m_v_9e9f5jdh-CUioJN0TcIzqq2N9Nx99zvPUCq3h6s_Ib86uw-PI';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    mobile: '',
    companyName: '',
    country: 'US'
  });
  const [errors, setErrors] = useState({});
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderID, setOrderID] = useState(null);

  const steps = [
    { number: 1, title: 'User Information', icon: <User className="h-5 w-5" /> },
    { number: 2, title: 'Payment', icon: <CreditCard className="h-5 w-5" /> },
    { number: 3, title: 'Confirmation', icon: <CheckCircle className="h-5 w-5" /> }
  ];

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!registrationData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!registrationData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!registrationData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(registrationData.mobile)) {
      newErrors.mobile = 'Please enter a valid mobile number';
    }
    
    if (!registrationData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setRegistrationData(prev => ({
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

  const handleContinue = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const createPayPalOrder = async () => {
    try {
      const response = await axios.post(`${API}/payments/create-order`, {
        amount: 20.00,
        currency: 'USD',
        description: 'AssetFlow Professional Plan - Monthly Subscription',
        userInfo: registrationData
      });
      
      setOrderID(response.data.orderID);
      return response.data.orderID;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      toast.error('Failed to create payment order');
      throw error;
    }
  };

  const onPayPalApprove = async (data) => {
    try {
      setLoading(true);
      
      // Capture payment
      const response = await axios.post(`${API}/payments/capture-order`, {
        orderID: data.orderID,
        userInfo: registrationData
      });
      
      if (response.data.success) {
        setPaymentSuccess(true);
        setCurrentStep(3);
        toast.success('Payment successful! Account created.');
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment capture error:', error);
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onPayPalError = (error) => {
    console.error('PayPal error:', error);
    toast.error('Payment failed. Please try again.');
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
        <p className="text-gray-600 mt-2">
          Join thousands of companies using AssetFlow to manage their assets
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Full Name *
          </Label>
          <div className="mt-1 relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="name"
              type="text"
              value={registrationData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter your full name"
            />
          </div>
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address *
          </Label>
          <div className="mt-1 relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              value={registrationData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
              placeholder="Enter your email address"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">
            Mobile Number *
          </Label>
          <div className="mt-1 relative">
            <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="mobile"
              type="tel"
              value={registrationData.mobile}
              onChange={(e) => handleInputChange('mobile', e.target.value)}
              className={`pl-10 ${errors.mobile ? 'border-red-500' : ''}`}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          {errors.mobile && (
            <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
          )}
        </div>

        <div>
          <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
            Company Name *
          </Label>
          <div className="mt-1 relative">
            <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="companyName"
              type="text"
              value={registrationData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className={`pl-10 ${errors.companyName ? 'border-red-500' : ''}`}
              placeholder="Enter your company name"
            />
          </div>
          {errors.companyName && (
            <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
          )}
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Your information is secure and encrypted. We'll never share your data with third parties.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-blue-600 hover:bg-blue-700 flex items-center"
        >
          Continue to Payment
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h2>
        <p className="text-gray-600 mt-2">
          Secure payment processing powered by PayPal
        </p>
      </div>

      {/* Order Summary */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">AssetFlow Professional Plan</span>
              <span className="font-medium">$20.00/month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Manage up to 2,000 assets</span>
              <Badge variant="secondary">Included</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">14-day free trial</span>
              <Badge className="bg-green-100 text-green-800">Free</Badge>
            </div>
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total (First Month)</span>
              <span>$20.00 USD</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Info */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{registrationData.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium">{registrationData.email}</span>
            </div>
            <div>
              <span className="text-gray-600">Mobile:</span>
              <span className="ml-2 font-medium">{registrationData.mobile}</span>
            </div>
            <div>
              <span className="text-gray-600">Company:</span>
              <span className="ml-2 font-medium">{registrationData.companyName}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PayPal Payment */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Lock className="h-4 w-4" />
              <span>Secure payment processing</span>
            </div>
            
            <PayPalScriptProvider 
              options={{ 
                "client-id": PAYPAL_CLIENT_ID,
                currency: "USD",
                intent: "capture",
                "enable-funding": "venmo,paylater",
                "disable-funding": "",
                "data-sdk-integration-source": "button-factory"
              }}
            >
              <div className="min-h-[200px] p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Complete Payment</h4>
                  <p className="text-sm text-gray-600">Choose your preferred payment method</p>
                </div>
                
                <PayPalButtons
                  createOrder={async (data, actions) => {
                    try {
                      const orderId = await createPayPalOrder();
                      return orderId;
                    } catch (error) {
                      console.error('Error creating order:', error);
                      toast.error('Failed to create payment order');
                      throw error;
                    }
                  }}
                  onApprove={async (data, actions) => {
                    try {
                      await onPayPalApprove(data);
                    } catch (error) {
                      console.error('Error approving payment:', error);
                      toast.error('Payment approval failed');
                    }
                  }}
                  onError={(error) => {
                    console.error('PayPal error:', error);
                    toast.error('Payment failed. Please try again.');
                  }}
                  onCancel={(data) => {
                    console.log('Payment cancelled:', data);
                    toast.info('Payment was cancelled');
                  }}
                  style={{
                    layout: "vertical",
                    color: "gold",
                    shape: "rect",
                    label: "paypal",
                    height: 55
                  }}
                  disabled={loading}
                />
                
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Sandbox Environment - Test payments only
                  </p>
                </div>
              </div>
            </PayPalScriptProvider>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(1)}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Information
        </Button>
        <div className="text-sm text-gray-500 flex items-center">
          <Shield className="h-4 w-4 mr-1" />
          SSL Encrypted & Secure
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Welcome to AssetFlow!</h2>
        <p className="text-gray-600 mt-2">
          Your account has been successfully created and payment processed.
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">What's Next?</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Check your email for login credentials and welcome message</li>
            <li>• Your 14-day free trial has started</li>
            <li>• Set up your first assets and team members</li>
            <li>• Explore all AssetFlow features</li>
          </ul>
        </CardContent>
      </Card>

      <Alert className="bg-green-50 border-green-200">
        <Mail className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          A welcome email with your login credentials has been sent to <strong>{registrationData.email}</strong>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <Button
          size="lg"
          onClick={() => navigate('/login')}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Login to Your Account
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="w-full"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );

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
            
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="px-6 py-2"
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center space-x-8 mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                {currentStep > step.number ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  Step {step.number}
                </p>
                <p className={`text-xs ${
                  currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.title}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 ml-4 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;