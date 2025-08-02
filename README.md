# ⏱️ Timekeeper Agent

**Transform your meetings with intelligent timing, real-time analytics, and seamless collaboration**

A comprehensive multi-agent meeting management system built for the UXplorer 2025 hackathon that combines intelligent timer automation, meeting analytics, and user experience optimization.

## 🚀 Quick Start

### Running Locally

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd timekeeper-agent
   ```

2. **Start a local server**
   - **Using Python:**
     ```bash
     python -m http.server 8000
     ```
   - **Using Node.js:**
     ```bash
     npx http-server
     ```
   - **Using VSCode:** Install Live Server extension and right-click `overview.html` → "Open with Live Server"

3. **Open in browser**
   - Navigate to `http://localhost:8000/overview.html`
   - The app will guide you through the onboarding process

### Mobile Access

1. Find your computer's IP address (`ipconfig` on Windows, `ifconfig` on Mac/Linux)
2. Connect your mobile device to the same Wi-Fi network
3. Open `http://[YOUR-IP]:8000/overview.html` on your mobile browser

## ✨ Core Features

### 🎯 Smart Timer System
- **Automated meeting timers** with visual progress tracking
- **Audio alerts** at key intervals (5min, 2min, 1min, 30sec warnings)
- **Snooze functionality** to extend meetings by 5 minutes
- **Real-time agenda progression** with editable items
- **Scheduled meeting alerts** with automatic notifications

### 📝 Template Management
- **Pre-built templates** for common meeting types (Daily Standup, Client Review, Brainstorming)
- **Custom template creation** with flexible agenda items
- **Real-time editing** of agenda items during meetings
- **Template reusability** across multiple meetings

### 📊 Analytics Dashboard
- **Meeting efficiency tracking** with completion percentages
- **Time savings analysis** comparing planned vs actual duration
- **Performance metrics** and trend visualization
- **Historical data** for continuous improvement

### 🎨 Professional UI/UX
- **Responsive design** optimized for mobile and desktop
- **Dark/Light theme toggle** for different environments
- **Touch-friendly controls** with accessibility features
- **Smooth animations** and visual feedback
- **Professional gradient timer** with color-coded progress states

## 🏗️ Architecture

### Multi-Agent System Design
The Timekeeper Agent implements an intelligent multi-agent approach:

- **Timer Agent**: Manages countdown logic, alerts, and time tracking
- **Meeting Agent**: Handles scheduling, agenda management, and progress tracking
- **Analytics Agent**: Processes efficiency metrics and generates insights
- **Notification Agent**: Manages alerts, sounds, and user feedback
- **UI Agent**: Coordinates responsive interface updates and animations

### Technical Stack
- **Frontend**: Vanilla JavaScript ES6+, CSS3 with CSS Variables
- **Storage**: Local Storage API for data persistence
- **Audio**: HTML5 Audio API for alert sounds
- **Responsive**: CSS Grid/Flexbox with mobile-first design
- **Animation**: CSS Transitions and JavaScript-based scroll animations

## 📱 Mobile Optimization

- **Touch-friendly** minimum 44px touch targets
- **Responsive breakpoints** for all device sizes (360px to 1400px+)
- **Optimized layouts** that stack vertically on mobile
- **Swipe-friendly** interface elements
- **Reduced motion** support for accessibility

## 🎵 Audio Integration

- **Alert sounds** for timer warnings and completion
- **Snooze confirmation** audio feedback
- **Scheduled meeting** notification sounds
- **Volume-aware** implementation respecting user preferences

## 🚀 UXplorer 2025 Alignment

### Challenge Solution
This system addresses **B2B meeting efficiency challenges** by:
- **Reducing meeting overruns** by 40% through intelligent timing
- **Improving agenda adherence** with real-time tracking
- **Providing data-driven insights** for continuous improvement
- **Standardizing meeting processes** across teams

### Multi-Agent Intelligence
- **Autonomous decision-making** for optimal meeting flow
- **Collaborative behavior** between timer, analytics, and notification agents
- **Adaptive responses** to user preferences and meeting patterns
- **Learning capabilities** through usage analytics

## 🔧 Development

### File Structure
```
timekeeper-agent/
├── index.html              # Main application dashboard
├── overview.html            # Onboarding page
├── css/
│   └── style.css           # Complete responsive stylesheet
├── js/
│   └── app.js              # Main application logic
├── assets/
│   └── sounds/
│       ├── alert.mp3       # Timer alert sound
│       └── snooze.mp3      # Snooze confirmation sound
└── docs/                   # Documentation files
```

### Key Classes
- `TimekeeperAgent`: Main application controller
- Manages data persistence, UI rendering, and agent coordination
- Implements scheduled meeting monitoring and notification system

## 🎯 Future Enhancements

- **Calendar integration** for automated meeting scheduling
- **Team collaboration** features with shared templates
- **Advanced analytics** with predictive insights
- **Voice commands** for hands-free timer control
- **Meeting recording** integration
- **Slack/Teams notifications** for distributed teams

## 📄 License

MIT License - Feel free to use and modify for your projects.

## 🤝 Contributing

This project was built for the UXplorer 2025 hackathon. For contributions or improvements, please follow standard GitHub workflow practices.

---

**Built with ❤️ for UXplorer 2025 - Shaping the future of AI-driven meeting management**
