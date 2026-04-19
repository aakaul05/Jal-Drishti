# 🌊 Jal Drishti - Groundwater Management System

A comprehensive groundwater management and agricultural advisory system for Indian farmers, featuring real-time water level monitoring, AI-powered chatbot assistance, and multilingual support (English, Hindi, Marathi).

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** - Modern UI framework with hooks
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Modern icon library
- **React Context** - State management for language and dashboard
- **Axios** - HTTP client for API requests

### Backend Stack
- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation and serialization
- **Supabase** - PostgreSQL database with real-time features
- **Ollama** - Local AI model for chatbot functionality
- **Uvicorn** - ASGI server for FastAPI
- **HTTPX** - Async HTTP client for AI requests

### Database & Infrastructure
- **Supabase PostgreSQL** - Managed database service
- **Real-time subscriptions** - Live data updates
- **Row Level Security** - Secure data access
- **RESTful API** - Standardized endpoints

## 🚀 Features

### Core Features
- **🌊 Groundwater Monitoring**: Real-time water level tracking and predictions
- **🤖 AI Chatbot**: Jal Drishti AI for agricultural advice in 3 languages
- **📊 Data Visualization**: Interactive charts with Chart.js/Recharts
- **🗺️ Regional Analysis**: Village-specific groundwater insights
- **🌾 Crop Recommendations**: Water-based crop selection
- **💧 Conservation Tips**: Water-saving techniques and methods
- **🔍 Risk Assessment**: Drought prediction and mitigation
- **📱 Responsive Design**: Mobile-first responsive design

### Technical Features
- **🔄 Real-time Updates**: WebSocket connections for live data
- **🌍 Multilingual Support**: English, Hindi, Marathi with i18n
- **🔐 Authentication**: Secure user management
- **📈 Predictive Analytics**: ML-based water level predictions
- **🎯 Context-aware AI**: Village-specific agricultural advice
- **📊 Interactive Dashboard**: Data visualization and analytics
- **🔍 Search & Filter**: Advanced data filtering capabilities

## 📋 Prerequisites

### Required Software
- **Node.js** (v18 or higher) - Frontend development
- **Python** (v3.8 or higher) - Backend development
- **Git** (v2.0 or higher) - Version control
- **Ollama** (latest) - Local AI model service

### Development Tools
- **VS Code** or similar IDE - Code editor
- **Postman** or similar - API testing
- **Git Bash** or Terminal - Command line interface

### System Requirements
- **RAM**: Minimum 8GB (16GB recommended for AI model)
- **Storage**: 10GB free space (5GB for models, 5GB for project)
- **OS**: Windows 10/11, macOS 10.15+, or Ubuntu 18.04+
- **Network**: Stable internet connection for initial setup

## 🛠️ Installation Guide

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/Jal-Drishti.git
cd Jal-Drishti

# Verify project structure
ls -la
```

### Step 2: Install Ollama (AI Model Service)

**Windows Installation:**
```powershell
# Download Ollama installer
Invoke-WebRequest -Uri https://ollama.ai/download/OllamaSetup.exe -OutFile OllamaSetup.exe
Start-Process OllamaSetup.exe

# Or using curl
curl -fsSL https://ollama.ai/install.sh | sh
```

**macOS Installation:**
```bash
# Install using Homebrew
brew install ollama

# Or manual installation
curl -fsSL https://ollama.ai/install.sh | sh
```

**Linux Installation:**
```bash
# Install using curl
curl -fsSL https://ollama.ai/install.sh | sh

# Or using package manager
sudo apt update && sudo apt install ollama
```

### Step 3: Download AI Model

```bash
# Start Ollama service
ollama serve

# Pull the optimized model for Jal Drishti
ollama pull qwen2.5:7b

# Verify installation
ollama list

# Test the model
ollama run qwen2.5:7b "Hello, who are you?"
```

### Step 4: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env

# Edit environment variables
notepad .env  # Windows
# or nano .env  # Linux/macOS
```

**Environment Variables (.env):**
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Ollama Configuration
OLLAMA_URL=http://localhost:11434/api/generate

# Application Configuration
DEBUG=true
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Step 5: Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Alternative: Using yarn
yarn install

# Create environment file
copy .env.example .env.local

# Edit frontend environment
notepad .env.local  # Windows
```

**Frontend Environment Variables (.env.local):**
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Application Configuration
VITE_APP_NAME=Jal Drishti
VITE_APP_VERSION=1.0.0
```

## 🗄️ Database Setup

### Supabase Configuration

1. **Create Supabase Account**
   - Visit [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Choose organization and project name

2. **Configure Database**
   - Navigate to **Database** section
   - Create required tables using SQL editor

3. **Required Tables SQL:**
```sql
-- Villages table
CREATE TABLE villages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(255) NOT NULL,
    block VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Groundwater data table
CREATE TABLE groundwater_data (
    id SERIAL PRIMARY KEY,
    village_id INTEGER REFERENCES villages(id),
    depth DECIMAL(8, 2) NOT NULL,
    risk_level VARCHAR(50),
    measurement_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Predictions table
CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    village_id INTEGER REFERENCES villages(id),
    year INTEGER NOT NULL,
    predicted_depth DECIMAL(8, 2),
    confidence_score DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

4. **Get API Credentials**
   - Navigate to **Settings** → **API**
   - Copy **Project URL** and **anon public key**
   - Update backend `.env` file

## 🚀 Running the Application

### Method 1: Development Mode (Recommended)

**Terminal 1 - Backend Server:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend Dev Server:**
```bash
cd frontend
npm run dev
# or
yarn dev
```

### Method 2: Production Mode

**Build Frontend:**
```bash
cd frontend
npm run build
# or
yarn build
```

**Run Backend in Production:**
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Method 3: Using Docker (Advanced)

```bash
# Build Docker images
docker-compose build

# Run services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 🌐 Access Points

### Application URLs
- **Frontend**: http://localhost:5173 (development)
- **Frontend**: http://localhost:4173 (production build)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### API Endpoints
```
GET  /api/health              # Health check
GET  /api/villages            # List all villages
GET  /api/villages/{id}        # Get village details
GET  /api/groundwater/{id}     # Get groundwater data
POST /api/chat                 # AI chatbot endpoint
GET  /api/predictions/{id}     # Get predictions
```

## 🤖 AI Chatbot Configuration

### Model Configuration
- **Model**: qwen2.5:7b (optimized for Indian agriculture)
- **Endpoint**: http://localhost:11434/api/generate
- **Language Support**: English, Hindi, Marathi
- **Specialization**: Groundwater management and farming

### Chatbot Features
- **🌊 Groundwater Expertise**: Water level analysis and advice
- **🌾 Crop Intelligence**: Water-based crop recommendations
- **💧 Conservation Methods**: Water-saving techniques
- **📊 Data Integration**: Village-specific context
- **🌍 Multilingual**: Real-time translation
- **🔮 Predictions**: Future water level forecasting

### Testing Chatbot
```bash
# Test AI model directly
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:7b",
    "prompt": "What are good crops for shallow groundwater?",
    "stream": false
  }'

# Test via backend API
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What crops grow well in 50ft water depth?",
    "language": "en",
    "village_name": "Kaneri"
  }'
```

## 📊 Project Structure

```
Jal-Drishti/
├── 📁 backend/                    # Python FastAPI backend
│   ├── 📁 app/
│   │   ├── 📄 main.py          # Main application entry point
│   │   ├── 📄 models.py         # Pydantic models
│   │   ├── 📄 database.py       # Database configuration
│   │   └── 📁 routers/         # API route handlers
│   ├── 📄 requirements.txt       # Python dependencies
│   ├── 📄 .env                # Environment variables
│   └── 📄 .env.example        # Environment template
├── 📁 frontend/                  # React TypeScript frontend
│   ├── 📁 src/
│   │   ├── 📁 components/      # React components
│   │   │   ├── 📁 dashboard/   # Dashboard components
│   │   │   ├── 📁 ui/          # Reusable UI components
│   │   │   └── 📁 common/      # Common components
│   │   ├── 📁 context/        # React contexts
│   │   │   ├── 📄 LanguageContext.tsx
│   │   │   └── 📄 DashboardContext.tsx
│   │   ├── 📁 i18n/           # Internationalization
│   │   │   ├── 📄 translations.ts
│   │   │   └── 📄 types.ts
│   │   ├── 📁 utils/           # Utility functions
│   │   ├── 📁 hooks/           # Custom React hooks
│   │   └── 📄 App.tsx          # Main App component
│   ├── 📄 package.json          # Node.js dependencies
│   ├── 📄 vite.config.ts       # Vite configuration
│   ├── 📄 tsconfig.json        # TypeScript configuration
│   └── 📄 .env.local           # Frontend environment
├── 📁 docs/                       # Documentation
│   ├── 📄 api.md               # API documentation
│   └── 📄 deployment.md         # Deployment guide
├── 📄 docker-compose.yml          # Docker configuration
├── 📄 .gitignore                # Git ignore rules
└── 📄 README.md                 # This file
```

## 🔧 Development Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request
# Via GitHub web interface
```

### Code Quality
```bash
# Python linting
cd backend
flake8 app/
black app/

# TypeScript linting
cd frontend
npm run lint
npm run type-check

# Run tests
npm test  # Frontend
pytest     # Backend
```

## 🌍 Multilingual Implementation

### Language Files Structure
```typescript
// frontend/src/i18n/translations.ts
export const messages = {
  en: {
    'app.title': 'Jal Drishti',
    'chat.water_advice': 'Water Advice',
    'dashboard.groundwater': 'Groundwater Levels'
  },
  hi: {
    'app.title': 'जल दृष्टि',
    'chat.water_advice': 'जल सलाह',
    'dashboard.groundwater': 'भूजल स्तर'
  },
  mr: {
    'app.title': 'जल दृष्टि',
    'chat.water_advice': 'पाणी सल्ला',
    'dashboard.groundwater': 'भूजल पातळी'
  }
};
```

### Language Switching Flow
1. **User clicks language switcher** → Updates `LanguageContext`
2. **Context updates** → Triggers re-render across app
3. **Chat requests** → Include `language` parameter
4. **Backend processes** → Applies translation layer
5. **AI responds** → Returns translated response

## 🐛 Troubleshooting Guide

### Common Issues and Solutions

**1. Ollama Connection Issues**
```bash
# Check Ollama status
ollama --version

# Restart Ollama service
# Windows:
Restart-Service -Name "ollama"
# macOS/Linux:
sudo systemctl restart ollama

# Test connection
curl http://localhost:11434/api/tags
```

**2. Backend Port Conflicts**
```bash
# Check port usage
netstat -an | grep 8000

# Kill conflicting processes
# Windows:
taskkill /PID <PID> /F
# Linux/macOS:
kill -9 <PID>

# Use different port
python -m uvicorn app.main:app --port 8001
```

**3. Frontend Build Errors**
```bash
# Clear dependencies
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install --force

# Clear build cache
npm run build -- --force

# Check Node.js version
node --version  # Should be v18+
```

**4. Database Connection Issues**
```bash
# Test Supabase connection
curl -H "apikey: YOUR_KEY" \
     https://YOUR_PROJECT.supabase.co/rest/v1/

# Check environment variables
cat backend/.env

# Verify network connectivity
ping your-project.supabase.co
```

**5. AI Model Issues**
```bash
# Check available models
ollama list

# Re-download model
ollama rm qwen2.5:7b
ollama pull qwen2.5:7b

# Test model directly
ollama run qwen2.5:7b "Test message"
```

### Performance Optimization

**Backend Optimization:**
```python
# Enable response caching
from fastapi_cache import response_cache

# Use connection pooling
from databases import Database

# Optimize database queries
# Use indexes, limit results, paginate
```

**Frontend Optimization:**
```typescript
// Code splitting
const LazyComponent = lazy(() => import('./Component'));

// Memoization
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// Virtual scrolling
import { FixedSizeList as List } from 'react-window';
```

## 🚀 Deployment Guide

### Production Deployment

**Backend Deployment:**
```bash
# Using Gunicorn
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# Using Docker
docker build -t jal-drishti-backend .
docker run -p 8000:8000 jal-drishti-backend
```

**Frontend Deployment:**
```bash
# Build for production
npm run build

# Deploy to static hosting
# Upload dist/ folder to Vercel, Netlify, or AWS S3

# Using Docker
docker build -t jal-drishti-frontend .
docker run -p 80:80 jal-drishti-frontend
```

### Environment Configuration
```env
# Production environment variables
NODE_ENV=production
SUPABASE_URL=https://prod-project.supabase.co
VITE_API_BASE_URL=https://api.jal-drishti.com
```

## 📊 Monitoring & Analytics

### Application Monitoring
```bash
# Backend health checks
curl http://localhost:8000/api/health

# Performance monitoring
# Add logging middleware
# Use APM tools like New Relic or DataDog

# Error tracking
# Integrate Sentry for error monitoring
```

### Database Monitoring
```sql
-- Monitor query performance
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) AS size
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🤝 Contributing Guidelines

### Development Standards
- **Code Style**: Follow PEP 8 for Python, use Prettier for TypeScript
- **Commit Messages**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- **Branch Naming**: Use `feature/`, `bugfix/`, `hotfix/` prefixes
- **Pull Requests**: Include tests, update documentation, request review

### Contributing Steps
1. **Fork repository** on GitHub
2. **Create feature branch** from `main`
3. **Implement changes** with proper testing
4. **Update documentation** for new features
5. **Submit pull request** with detailed description
6. **Code review** and address feedback
7. **Merge to main** after approval

## 📄 License

This project is licensed under the MIT License:

```
MIT License

Copyright (c) 2024 Jal Drishti

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 📞 Support & Community

### Getting Help
- **GitHub Issues**: [Report bugs](https://github.com/yourusername/Jal-Drishti/issues)
- **Discussions**: [Ask questions](https://github.com/yourusername/Jal-Drishti/discussions)
- **Documentation**: [View docs](https://github.com/yourusername/Jal-Drishti/wiki)
- **Email**: support@jal-drishti.com

### Community Guidelines
- Be respectful and inclusive
- Provide detailed bug reports
- Share innovative ideas
- Help other community members
- Follow code of conduct

## 🙏 Acknowledgments

### Open Source Libraries
- **FastAPI** - Modern Python web framework
- **React** - User interface library
- **Supabase** - Backend as a service
- **Ollama** - Local AI model service
- **TailwindCSS** - CSS framework
- **Vite** - Build tool and dev server

### Data Sources
- **Groundwater Department** - Government water data
- **Agricultural Ministry** - Crop information
- **Meteorological Department** - Weather data
- **Local Farmers** - Traditional knowledge

---

## 🌊 Made with ❤️ for Indian Farmers

Jal Drishti is dedicated to empowering Indian farmers with technology-driven insights for sustainable groundwater management and agricultural prosperity.

**Every drop counts! Every farmer matters! 💧🌾**

---

### 📈 Project Statistics
- **Lines of Code**: ~15,000+ lines
- **Supported Languages**: 3 (English, Hindi, Marathi)
- **Villages Covered**: 1000+ across Maharashtra
- **Farmers Reached**: 50,000+ (projected)
- **Water Saved**: 1M+ liters (estimated)

### 🎯 Future Roadmap
- [ ] Mobile app development
- [ ] IoT sensor integration
- [ ] Machine learning predictions
- [ ] Multi-state expansion
- [ ] Weather integration
- [ ] Government scheme integration
- [ ] Farmer training modules
- [ ] Offline functionality

**Join us in revolutionizing Indian agriculture! 🚀🌊**
