# AI Sports Analyst

An AI-powered sports prediction and analysis app for NFL and NCAAF games. This web-based application provides data-driven predictions and parlay recommendations for entertainment and informational purposes.

## 🏈 Features

### 1. Home Screen
- Browse upcoming NFL and NCAAF games
- Quick view of game matchups with team logos
- AI confidence badges (High/Medium/Low) for each game
- Spread, Over/Under, and key betting lines
- Win probability indicators

### 2. Game Analysis Page
- Detailed win probability gauges for each team
- Comprehensive stats comparison:
  - Offense and defense rankings
  - Recent form (last 5 games)
  - Average points scored/allowed
  - Injury reports
  - Weather conditions
- AI prediction summary with reasoning
- Add games to Parlay Builder

### 3. Parlay Builder
- Build parlays with 3-10 games
- Combined probability calculator
- Risk assessment meter (Conservative/Moderate/Aggressive)
- Individual pick breakdown
- Export as screenshot functionality (coming soon)

### 4. Historical Performance
- Track AI prediction accuracy over time
- Performance metrics by sport (NFL vs NCAAF)
- Breakdown by bet type (Spread, Moneyline, Over/Under)
- Week-by-week results table
- Performance insights

## 🎨 Design

- **Dark Theme**: Sports-betting aesthetic optimized for extended viewing
- **Mobile-First**: Fully responsive, optimized for iOS Safari
- **Modern Stack**: React + TypeScript + Tailwind CSS
- **Card-Based UI**: Clean, intuitive interface with team colors

## ⚠️ Important Disclaimers

- **For entertainment and informational purposes only**
- **Not gambling advice. We are not a sportsbook.**
- **Always gamble responsibly**
- Predictions are AI-generated and may not be accurate
- Past performance does not guarantee future results

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd sports-prediction-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## 📁 Project Structure

```
sports-prediction-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # Main layout with header/footer
│   │   ├── GameCard.tsx     # Game card component
│   │   └── ConfidenceBadge.tsx
│   ├── pages/              # Route pages
│   │   ├── Home.tsx        # Home screen with game listings
│   │   ├── GameAnalysis.tsx # Detailed game analysis
│   │   ├── ParlayBuilder.tsx # Parlay building tool
│   │   └── HistoricalPerformance.tsx
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── data/               # Mock data (will be replaced with API)
│   │   └── mockGames.ts
│   ├── utils/              # Utility functions
│   │   └── parlayCalculator.ts
│   ├── App.tsx            # Main app with routing
│   └── index.css          # Global styles with Tailwind
├── tailwind.config.js     # Tailwind configuration
└── package.json
```

## 🔮 Next Steps

### Phase 2: Real Data Integration
- [ ] Connect to real sports APIs (ESPN, The Odds API, etc.)
- [ ] Implement real-time odds updates
- [ ] Add more leagues (NBA, NHL, MLB)

### Phase 3: Enhanced Features
- [ ] User accounts and saved parlays
- [ ] Push notifications for game updates
- [ ] Advanced filters and search
- [ ] Social sharing features

### Phase 4: Premium Features
- [ ] Stripe payment integration for premium tier
- [ ] Advanced analytics and insights
- [ ] Historical trend analysis
- [ ] Custom AI model training

### Phase 5: Mobile Apps
- [ ] Native iOS app (Swift/SwiftUI)
- [ ] Native Android app (Kotlin)
- [ ] Progressive Web App (PWA) support

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Build Tool**: Vite
- **State Management**: Local state + localStorage (Context API coming soon)

## 📝 Notes

- Currently using mock data for demonstration
- Screenshot export feature requires additional library (html2canvas)
- No actual betting functionality - this is an analysis tool only
- All disclaimers prominently displayed on every page

## 📄 License

This project is for educational and entertainment purposes only.

---

**Remember**: This is a sports analysis tool, not a betting platform. Always gamble responsibly and within your means.
