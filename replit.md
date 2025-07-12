# STAK-XTRACT - AI-Powered Audio Sample Extraction PWA

## Overview

STAK-XTRACT is a cyberpunk-themed Progressive Web Application (PWA) designed for AI-powered audio sample extraction and arrangement. The application allows users to upload audio files, extract samples using AI processing, arrange them on a timeline, and export the results. Built with a modern full-stack architecture using React, Express, and PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack TypeScript architecture with clear separation between client and server:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with cyberpunk theme and custom CSS variables
- **State Management**: React hooks and TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **PWA Features**: Service worker for offline functionality and app installation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon Database)
- **Session Storage**: In-memory storage (MemStorage class) with interface for database migration

## Key Components

### Audio Processing Engine
- **Web Audio API**: Core audio processing using browser's native audio context
- **Sample Extraction**: AI-powered onset detection for automatic sample identification
- **Waveform Visualization**: Canvas-based real-time audio visualization
- **Export System**: ZIP file generation with individual samples and project metadata

### User Interface Components
- **AudioProcessor**: Main component handling file upload and processing coordination
- **WaveformCanvas**: Interactive audio waveform display with click navigation
- **SampleExtraction**: AI parameter controls and sample preview interface
- **ArrangementTimeline**: 16-slot timeline for sample sequencing
- **ExportControls**: Multi-format export options with metadata inclusion

### PWA Features
- **Offline Support**: Service worker caching for full offline functionality
- **Installation**: Progressive installation prompts with native app experience
- **Responsive Design**: Mobile-optimized interface with touch interactions

## Data Flow

1. **Audio Upload**: User selects audio file → File validation → Web Audio API processing
2. **AI Analysis**: Audio buffer → Onset detection algorithm → Sample identification
3. **Sample Management**: Extracted samples → Preview interface → Timeline arrangement
4. **Export Process**: Selected samples + arrangement → ZIP generation → Download

### Database Schema
- **Users Table**: Basic user authentication (id, username, password)
- **Extensible Design**: Schema ready for sample storage, user projects, and session management

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives for accessible components
- **Audio Processing**: Web Audio API (browser native)
- **File Operations**: JSZip for export packaging, FileSaver.js for downloads
- **Fonts**: Google Fonts (Orbitron) for cyberpunk aesthetic

### Backend Dependencies
- **Database**: Neon Database (PostgreSQL) via @neondatabase/serverless
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: connect-pg-simple for PostgreSQL session storage

### Development Tools
- **TypeScript**: Full type safety across client and server
- **Path Aliases**: Configured for clean imports (@/, @shared/)
- **Hot Reload**: Vite HMR with Express middleware integration

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Frontend development with hot module replacement
- **Express Middleware**: Backend API integrated with Vite in development
- **Database Migrations**: Drizzle-kit for schema management

### Production Build
- **Frontend**: Vite build generating optimized static assets
- **Backend**: esbuild bundling Express server for Node.js deployment
- **Database**: PostgreSQL with connection pooling via Neon Database
- **PWA**: Service worker registration for offline functionality

### Environment Configuration
- **Database**: DATABASE_URL environment variable required
- **Build Targets**: ESNext modules with Node.js platform targeting
- **Asset Handling**: Public assets served from client/public directory

The application is designed for easy deployment on platforms supporting Node.js with PostgreSQL databases, with particular optimization for Replit's development environment.