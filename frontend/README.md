# PlantCare - IoT Plant Watering System Frontend

Modern web interface for monitoring and controlling your IoT plant watering system.

## 🚀 Features

- **Dashboard** - Real-time sensor data, pump control, and activity monitoring
- **Watering Config** - Configure auto-watering settings and seasonal profiles
- **Device Management** - Full CRUD operations for IoT devices
- **User Management** - Manage system users and permissions
- **Firmware Updates** - Track and manage device firmware versions
- **Responsive Design** - Works on desktop and mobile devices

## 🛠️ Tech Stack

- **React 19** - UI library
- **Vite 8** - Build tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - API calls
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Sonner** - Toast notifications

## 📦 Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Create \`.env\` file:
\`\`\`bash
cp .env.example .env
\`\`\`

3. Update \`.env\` with your backend URL:
\`\`\`
VITE_API_URL=http://localhost:5000
\`\`\`

## 🏃 Development

Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The app will be available at \`http://localhost:5173\`

## 🏗️ Build

Build for production:
\`\`\`bash
npm run build
\`\`\`

Preview production build:
\`\`\`bash
npm run preview
\`\`\`

## 📡 API Endpoints

The frontend connects to these backend endpoints:

### Auth
- \`POST /api/login\` - User authentication

### Sensor
- \`GET /api/status\` - Get system status
- \`GET /api/readings\` - Get sensor readings

### Pump
- \`POST /api/pump\` - Control pump on/off
- \`GET /api/pump-history\` - Get pump activity history

### Config
- \`POST /api/auto-mode\` - Update auto-watering config

### Device
- \`GET /api/devices\` - List all devices
- \`POST /api/devices\` - Create new device
- \`PUT /api/devices/:id\` - Update device
- \`DELETE /api/devices/:id\` - Delete device

## 🎨 Design

This frontend is built based on Figma design specifications with primary colors:
- Primary: #0A3A2A (Dark Green)
- Accent: #B8E5D2 (Mint Green)
- Background: #F5F5F5 (Light Gray)
