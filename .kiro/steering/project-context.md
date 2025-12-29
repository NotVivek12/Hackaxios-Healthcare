---
inclusion: always
---

# Healthcare Platform Project Context

This is an AI-powered healthcare platform built with Next.js 15, featuring:

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Dark mode only)
- **Authentication**: NextAuth.js
- **Database**: MongoDB with Mongoose
- **Internationalization**: next-intl (7 languages: en, es, fr, hi, pt, sw, ar)
- **UI Components**: Custom components with Radix UI primitives

## Key Features
- AI-powered symptom checker
- Telemedicine consultations (video/audio/text)
- SMS health support for low-connectivity areas
- Multi-role system (patients, providers, admins)
- Health records management
- Real-time notifications
- Health analytics dashboard

## Architecture Notes
- Dark mode is enforced (no light mode toggle)
- Middleware handles internationalization routing
- Role-based access control throughout the app
- RESTful API routes in `/api/` directory

## Important Paths
- Components: `src/components/`
- Pages: `src/app/[locale]/`
- API Routes: `src/app/api/`
- Models: `src/models/`
- Translations: `messages/`