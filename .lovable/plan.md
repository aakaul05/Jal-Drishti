

# Jal-Drishti: AI-Driven Water Level Decision Support Dashboard

## Overview
A dark-mode, enterprise-grade dashboard for groundwater level monitoring and prediction, featuring data visualization, risk classification, and an AI chatbot.

## Design System
- **Theme**: Dark mode with Primary (#0B132B), Secondary (#1C2541), Accent (#00A896)
- **Effects**: Glassmorphic panels with backdrop-blur, subtle drop-shadows, skeleton loaders
- **Typography**: Inter for data, system fonts for metrics

## Layout (CSS Grid)

### 1. Left Sidebar — Region Explorer
- Glassmorphic sidebar with fuzzy-search autocomplete for Region/Block/Taluka selection
- Session history list showing recently viewed regions
- Collapsible with icon-only mini mode

### 2. Primary Viewport — Data Visualization
- Recharts-powered line chart showing:
  - **Historical data** (10 years): solid cyan line
  - **Predicted data** (5-10 years): dashed neon-green line with 95% confidence interval shaded area
  - Vertical "T=0" axis marker separating historical from predicted
- Custom tooltip showing exact depth and year on hover
- Skeleton loader while data loads

### 3. Right Rail — Risk Engine
- Dynamic risk classification widget (Low/Moderate/High/Severe) with color-coded states
- Circular SVG gauge showing R² validation metric
- Stats cards for key metrics (current depth, annual change rate, prediction horizon)
- Colors transition based on risk level (green → yellow → orange → red)

### 4. Bottom HUD — Advisory Banner
- Pulsing alert banner with contextual advisory messages
- Severity-based styling matching risk classification
- Example: "⚠️ Severe Risk: Annual decline of 1.5 ft/year detected"

### 5. Floating Chatbot (Bottom Right)
- Translucent floating chat widget with expand/collapse
- Natural language input with microphone icon (Web Speech API)
- Context-aware: reads current region and prediction data from React Context
- Responds to questions like "What is my risk?" using local state

## Data Architecture
- React Context provider wrapping the app for shared state (selected region, prediction data, risk level)
- TanStack Query for data fetching with caching per region
- Mock data service simulating historical + Random Forest predicted water levels for demo
- Dynamic risk calculation based on annual change rate

## Pages
- **Dashboard** (Index): Full grid layout with all 5 sections
- Mock data for 15+ regions with realistic groundwater depth trends

