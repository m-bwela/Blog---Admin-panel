# Blog + Admin Panel

This repository is a full-stack blog and admin panel application built with a React + Vite frontend and a Node/Express backend using Prisma for database access.

Purpose
- Provide a simple, extendable blog platform with an admin UI to manage posts, categories, tags, and users.

Key Features
- Public blog listing and post pages with categories and tags
- Admin area for creating, editing, publishing, and managing posts
- User profiles with avatar upload and password update
- Rich text editor for post content
- Dark mode and theming via CSS variables
- Dynamic sitemap support and SEO-friendly routes

Tech Stack
- Frontend: React, Vite, Tailwind CSS (utility classes), React Router
- Backend: Node.js, Express, Prisma ORM, SQLite/Postgres (configurable via Prisma)
- Authentication: JWT-based auth on the server, React Context on the client
- Image uploads: Multer on server, stored in `/uploads`

Quick Start (Development)
1. Install dependencies for both client and server:

```bash
# from repository root
cd server
npm install

cd ../client
npm install
```

2. Run the server and client in separate terminals:

```bash
# server
cd server
npm run dev

# client (Vite)
cd client
npm run dev
```

Environment
- Copy `.env.example` or set environment variables for `DATABASE_URL`, `CLIENT_URL`, `JWT_SECRET`, etc., in the `server` folder.

Database
- This project uses Prisma. To apply schema changes or run migrations:

```bash
cd server
npx prisma migrate dev
```

Important Files
- Frontend entry: `client/src/main.jsx`
- Frontend routes and pages: `client/src/pages`
- Profile page: `client/src/profile/UserProfilePage.jsx`
- Backend server: `server/app.js` and `server/server.js`
- API routes: `server/src/routes`
- Prisma schema: `server/prisma/schema.prisma`

Deployment
- The project includes Dockerfiles and a `docker-compose` configuration for production-ready deployment. See `/DEPLOY.md` at the repo root for step-by-step instructions.

Contributing
- Feel free to open issues or pull requests. Follow existing code style and keep changes small and focused.

License
- MIT
