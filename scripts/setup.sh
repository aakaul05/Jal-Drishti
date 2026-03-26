#!/bin/bash

echo "🚀 Setting up Jal-Drishti Supabase Database"
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it with your Supabase credentials."
    exit 1
fi

echo "✅ Environment file found"

# Test connection
echo "🔍 Testing Supabase connection..."
npm run test:supabase

if [ $? -ne 0 ]; then
    echo "❌ Supabase connection failed. Please check your credentials."
    exit 1
fi

echo "✅ Supabase connection successful"

# Run migration
echo "📊 Running data migration..."
npm run migrate:data

if [ $? -ne 0 ]; then
    echo "❌ Data migration failed."
    exit 1
fi

echo "✅ Setup completed successfully!"
echo "🎯 You can now run the application with: npm run dev"
