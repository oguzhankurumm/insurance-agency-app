# Insurance Agency Management System

A modern, full-stack insurance agency management system built with Next.js, TypeScript, and Tailwind CSS. This application is available both as a web application and a desktop application using Electron.

## Features

- 📊 Dashboard with key performance metrics
- 👥 Customer management system
- 📝 Policy management and tracking
- 💰 Premium calculations and billing
- 📈 Sales and revenue analytics
- 📱 Responsive design for all devices
- 🖥️ Desktop application support (Windows, macOS, Linux)
- 📄 PDF report generation
- 📊 Data visualization with Chart.js
- 📥 CSV export functionality

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **Form Handling**: React Hook Form, Yup
- **Data Tables**: TanStack Table
- **Database**: SQLite
- **Desktop App**: Electron
- **Charts**: Chart.js
- **PDF Generation**: jsPDF
- **Date Handling**: React DatePicker

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/insurance-agency-app.git
cd insurance-agency-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
# For web application
npm run dev
# or
yarn dev

# For desktop application
npm run electron-dev
# or
yarn electron-dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the web application.

## Project Structure

```
insurance-agency-app/
├── src/
│   ├── app/           # Next.js app directory
│   ├── components/    # Reusable UI components
│   ├── lib/          # Utility functions
│   ├── db/           # Database related code
│   ├── hooks/        # Custom React hooks
│   ├── types/        # TypeScript type definitions
│   ├── validations/  # Form validation schemas
│   └── scripts/      # Utility scripts
├── electron/         # Electron configuration
├── public/          # Static assets
└── insurance.db     # SQLite database
```

## Available Scripts

- `yarn dev` - Start the Next.js development server
- `yarn build` - Build the Next.js application
- `yarn start` - Start the production server
- `yarn electron-dev` - Start the Electron development environment
- `yarn electron-build` - Build the desktop application
- `yarn electron-start` - Start the Electron application
- `yarn seed` - Seed the database with initial data

## Building for Production

### Web Application
```bash
yarn build
yarn start
```

### Desktop Application
```bash
yarn electron-build
```

This will create installers for:
- Windows: NSIS installer and portable executable
- macOS: DMG and ZIP
- Linux: AppImage and DEB

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.
