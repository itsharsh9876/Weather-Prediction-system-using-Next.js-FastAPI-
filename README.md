# Weather Prediction System

A comprehensive weather prediction system built with Next.js, featuring time series analysis and queue-based data processing.

## Prerequisites

Before running this project in VS Code, make sure you have:

1. **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
2. **VS Code** - [Download here](https://code.visualstudio.com/)
3. **Git** (optional but recommended)

## VS Code Setup Instructions

### 1. Open the Project
```bash
# Clone or download the project
# Open VS Code and use File > Open Folder to open the project directory
```

### 2. Install Dependencies
Open the integrated terminal in VS Code (`Ctrl+`` or `View > Terminal`) and run:

```bash
npm install
```

If you encounter permission errors, try:
```bash
npm install --legacy-peer-deps
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Recommended VS Code Extensions

Install these extensions for the best development experience:

1. **ES7+ React/Redux/React-Native snippets**
2. **Tailwind CSS IntelliSense**
3. **TypeScript Importer**
4. **Auto Rename Tag**
5. **Prettier - Code formatter**
6. **ESLint**

## Common Issues and Solutions

### Issue 1: "Module not found" errors
**Solution:** Delete `node_modules` and `package-lock.json`, then reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: TypeScript errors
**Solution:** Restart the TypeScript server in VS Code:
- Press `Ctrl+Shift+P`
- Type "TypeScript: Restart TS Server"
- Press Enter

### Issue 3: Port already in use
**Solution:** Kill the process using port 3000:
```bash
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# On Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Issue 4: Build errors
**Solution:** Clear Next.js cache:
```bash
rm -rf .next
npm run dev
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── WeatherDashboard.tsx
│   ├── TimeSeriesAnalysis.tsx
│   ├── QueueManager.tsx
│   └── PredictionEngine.tsx
├── lib/                   # Utility libraries
│   ├── weatherData.ts     # Weather data generation
│   ├── weatherQueue.ts    # Queue implementation
│   └── timeSeriesAnalysis.ts # Time series algorithms
└── package.json          # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features

- **Real-time Weather Dashboard** - Live weather data visualization
- **Time Series Analysis** - Trend detection and forecasting
- **Queue Management** - Data processing with queue data structure
- **Prediction Engine** - Weather prediction algorithms
- **Responsive Design** - Works on all device sizes

## Technology Stack

- **Frontend:** Next.js 13, React, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Charts:** Recharts
- **Icons:** Lucide React
- **Data Structures:** Custom Queue implementation
- **Algorithms:** Time series analysis, linear regression

## Troubleshooting

If you're still experiencing errors:

1. **Check Node.js version:**
   ```bash
   node --version
   ```
   Should be 16.x or higher

2. **Clear all caches:**
   ```bash
   npm run build
   rm -rf .next
   npm run dev
   ```

3. **Restart VS Code completely**

4. **Check for conflicting extensions** - Disable all extensions and re-enable one by one

## Support

If you continue to have issues:
1. Check the VS Code terminal for specific error messages
2. Ensure all prerequisites are installed
3. Try running the project in a different terminal outside VS Code
4. Check if antivirus software is blocking Node.js processes

## Development Tips

- Use `Ctrl+Shift+P` to access VS Code command palette
- Use `Ctrl+`` to toggle terminal
- Install the recommended extensions for better IntelliSense
- Use `F12` to go to definition of functions/components
- Use `Ctrl+Space` for auto-completion suggestions