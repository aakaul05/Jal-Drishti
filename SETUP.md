# 🚀 Jal Drishti - Quick Setup Guide

**Complete setup instructions for developers to run Jal Drishti groundwater management system**

## ⚡ Quick Start (5 Minutes)

### Prerequisites Check
```bash
# Check Node.js (v18+)
node --version

# Check Python (v3.8+)
python --version

# Check Git
git --version

# Check Ollama
ollama --version
```

### One-Command Setup
```bash
# Clone and setup everything
git clone https://github.com/yourusername/Jal-Drishti.git
cd Jal-Drishti
./setup.sh
```

---

## 🛠️ Detailed Setup Steps

### Step 1: Install Ollama AI Service

**Windows (PowerShell):**
```powershell
# Download and install Ollama
iwr -useb https://ollama.ai/download/OllamaSetup.exe -O OllamaSetup.exe
Start-Process OllamaSetup.exe

# Start Ollama service
ollama serve

# Download AI model
ollama pull qwen2.5:7b
```

**macOS/Linux:**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start service
ollama serve

# Download model
ollama pull qwen2.5:7b
```

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env
```

**Edit `.env` file:**
```env
# Supabase - Get from https://supabase.com/dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Ollama - Local AI service
OLLAMA_URL=http://localhost:11434/api/generate

# Development
DEBUG=true
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env.local
```

**Edit `.env.local` file:**
```env
# Backend API
VITE_API_BASE_URL=http://localhost:8000

# App info
VITE_APP_NAME=Jal Drishti
```

### Step 4: Database Setup

**Supabase Configuration:**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → API
4. Copy URL and anon key
5. Update backend `.env` file

**Create Tables (SQL):**
```sql
-- Run in Supabase SQL Editor
CREATE TABLE villages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(255) NOT NULL,
    block VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE groundwater_data (
    id SERIAL PRIMARY KEY,
    village_id INTEGER REFERENCES villages(id),
    depth DECIMAL(8, 2) NOT NULL,
    risk_level VARCHAR(50),
    measurement_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Run Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🧪 Test Setup

### Test Backend
```bash
# Health check
curl http://localhost:8000/api/health

# Test AI chat
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "language": "en"}'
```

### Test Frontend
1. Open http://localhost:5173
2. Select a village from sidebar
3. Try the chatbot
4. Switch languages (English/Hindi/Marathi)

---

## 🔧 Common Fixes

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

### Ollama Not Responding
```bash
# Restart Ollama
# Windows: Restart-Service ollama
# Linux: sudo systemctl restart ollama

# Test connection
curl http://localhost:11434/api/tags
```

### Frontend Build Errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Different port
npm run dev -- --port 3000
```

---

## ✅ Verification Checklist

**Before starting development, verify:**

- [ ] Ollama installed and running (`ollama list` shows qwen2.5:7b)
- [ ] Python virtual environment activated
- [ ] Backend dependencies installed (`pip list`)
- [ ] Frontend dependencies installed (`npm list`)
- [ ] Environment variables configured (`.env` files exist)
- [ ] Supabase project created and credentials added
- [ ] Backend starts without errors (`uvicorn` runs)
- [ ] Frontend builds successfully (`npm run dev` works)
- [ ] API endpoints respond (`curl` tests pass)
- [ ] Database tables created (check Supabase dashboard)
- [ ] Chatbot responds in all 3 languages
- [ ] Village data loads correctly
- [ ] Charts and graphs display properly

---

## 📱 IDE Setup

### VS Code Extensions
```json
{
  "recommendations": [
    "ms-python.python",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json"
  ]
}
```

### Project Settings
```json
// .vscode/settings.json
{
  "python.defaultInterpreterPath": "./backend/venv/Scripts/python.exe",
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## 🚨 Troubleshooting

### Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.8+

# Check virtual environment
which python  # Should point to venv

# Check dependencies
pip install -r requirements.txt --upgrade

# Check environment variables
cat backend/.env
```

### Frontend Shows Errors
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache
npm cache clean --force

# Check environment
cat frontend/.env.local

# Rebuild
rm -rf dist
npm run build
```

### AI Chatbot Not Working
```bash
# Verify Ollama model
ollama run qwen2.5:7b "Test"

# Check backend logs
# Look for Ollama connection errors

# Test API directly
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen2.5:7b", "prompt": "Hello"}'
```

---

## 🎯 Next Steps

Once setup is complete:

1. **Explore the Dashboard**
   - Navigate village selection
   - View groundwater charts
   - Check predictions

2. **Test AI Chatbot**
   - Ask water-related questions
   - Try different languages
   - Test village-specific advice

3. **Development**
   - Read the main README.md
   - Check project structure
   - Start contributing

---

## 📞 Need Help?

**Quick Commands:**
```bash
# Check everything is running
curl http://localhost:8000/api/health && echo "✅ Backend OK"
curl http://localhost:5173 && echo "✅ Frontend OK"
ollama list && echo "✅ Ollama OK"

# Restart everything
pkill -f uvicorn && pkill -f "npm run dev"
cd backend && python -m uvicorn app.main:app --reload --port 8000 &
cd frontend && npm run dev
```

**Support:**
- GitHub Issues: [Report problems](https://github.com/yourusername/Jal-Drishti/issues)
- Documentation: [Full README](./README.md)
- Community: [Discussions](https://github.com/yourusername/Jal-Drishti/discussions)

---

**🌊 Ready to help Indian farmers with smart water management! 💧**

**Setup time: 5-10 minutes | Difficulty: Beginner-friendly**
