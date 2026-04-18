import { useNavigate } from "react-router-dom";
import { Droplets, Waves, ArrowRight, MapPin, TrendingUp, Shield, Leaf } from "lucide-react";

export function WelcomePage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 text-center max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
            <Droplets className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Jal Drishti
          </h1>
        </div>
        
        {/* Welcome Message */}
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">
          Welcome to Groundwater Monitoring
        </h2>
        
        <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto">
          Empowering Maharashtra communities with AI-powered groundwater insights. 
          Monitor historical trends, predict future water levels, and make informed decisions 
          for sustainable water management.
        </p>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-lg mb-2 mx-auto w-fit">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800">3,338+ Villages</h3>
            <p className="text-sm text-gray-600">Complete Maharashtra coverage</p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-cyan-100 rounded-lg mb-2 mx-auto w-fit">
              <TrendingUp className="h-6 w-6 text-cyan-600" />
            </div>
            <h3 className="font-semibold text-gray-800">2025 Focus</h3>
            <p className="text-sm text-gray-600">Monthly predictions</p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-teal-100 rounded-lg mb-2 mx-auto w-fit">
              <Shield className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Risk Analysis</h3>
            <p className="text-sm text-gray-600">Water scarcity assessment</p>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-12 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Platform Overview</h3>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">10</div>
              <div className="text-sm text-gray-600">Years of Data</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-600">36</div>
              <div className="text-sm text-gray-600">Districts</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-600">AI</div>
              <div className="text-sm text-gray-600">Powered</div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center relative z-50">
          <button
            onClick={handleStart}
            style={{
              background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(6, 182, 212))',
              color: 'white',
              fontSize: '1.125rem',
              fontWeight: '500',
              padding: '1rem 2rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              transform: 'scale(1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '0 auto',
              position: 'relative',
              zIndex: 50
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, rgb(37, 99, 235), rgb(14, 165, 233))';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, rgb(59, 130, 246), rgb(6, 182, 212))';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>Start Monitoring</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-24 text-blue-100 opacity-30" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
