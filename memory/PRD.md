# Indian Profiles Platform - PRD

## Original Problem Statement
Build a comprehensive Indian Profiles website with Admin Dashboard based on provided PDF specifications. The platform includes:
- Public-facing website for citizens to explore leaders, constituencies, and development works
- Admin dashboard for managing geography, leaders, articles, grievances, volunteers, and events
- Indian brand colors (Gradient Blue and Mat Green)
- MongoDB database with JWT authentication

## Architecture
- **Frontend**: React.js with Tailwind CSS, React Router
- **Backend**: FastAPI (Python) with Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: JWT with httpOnly cookies

## User Personas
1. **Citizens**: Browse constituencies, leaders, articles, submit grievances, register as volunteers
2. **Admins**: Manage all content through the admin dashboard

## Core Requirements
- [x] Hierarchical geography (Constituency → Sub-Region)
- [x] Leader profiles with biography and career timeline
- [x] Article/Development work with tagging engine
- [x] Grievance redressal system
- [x] Volunteer registration
- [x] Event management
- [x] JWT authentication for admin

## What's Been Implemented (April 2, 2026)

### Public Website
- Home page with hero, constituency search, stats
- Constituency detail page with sub-regions grid
- Division/Mandal page with local leaders
- Leader profile page with tabs (About, Timeline, Works, Media)
- Article detail page with tagged leaders
- Get Involved page with Grievance form, Volunteer registration, Events calendar

### Admin Dashboard
- Login page with JWT auth
- Dashboard with stats and quick actions
- Geography Manager (CRUD for constituencies and sub-regions)
- Profile Manager (CRUD for leaders with rich text biography and timeline builder)
- Article Editor (CRUD with tagging engine for geography and leaders)
- Grievance Desk (view and update status)
- Volunteer Manager (approve/reject volunteers)
- Event Manager (CRUD for events)

## API Endpoints
- `/api/auth/*` - Authentication
- `/api/constituencies/*` - Constituency CRUD
- `/api/sub-regions/*` - Sub-region CRUD
- `/api/leaders/*` - Leader CRUD
- `/api/articles/*` - Article CRUD
- `/api/grievances/*` - Grievance management
- `/api/volunteers/*` - Volunteer management
- `/api/events/*` - Event CRUD
- `/api/stats` - Dashboard statistics

## P0/P1/P2 Features Remaining

### P0 (Must Have) - DONE
- [x] All core features implemented

### P1 (Should Have) - Backlog
- [ ] Interactive constituency map (Leaflet.js)
- [ ] Image upload to cloud storage (Cloudinary)
- [ ] Multi-language support (i18n)
- [ ] Advanced search with filters

### P2 (Nice to Have) - Future
- [ ] Social media integration (Twitter/Facebook)
- [ ] WhatsApp API for notifications
- [ ] Voter demographics analytics
- [ ] PDF manifesto downloads

## Next Tasks
1. Add sample data for demonstration
2. Implement image upload functionality
3. Add interactive map component
4. Multi-language support

## Recent Changes (July 2025)
- Rebranded from "BJPLeader" to "Indian Profiles"
- Updated color scheme from Orange to Gradient Blue and Mat Green
- Updated all UI components, navigation, and admin pages with new branding
