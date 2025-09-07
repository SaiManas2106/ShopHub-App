# Ecom Single Page Application (Backend + Frontend)

This project is a minimal single-page e-commerce application with:

- Backend: Node.js + Express
  - JWT Authentication (signup/login)
  - Items CRUD with filters (category, minPrice, maxPrice, search q)
  - Cart APIs (server-side cart persistence per user stored in JSON files)
- Frontend: React + Vite
  - Signup and Login pages
  - Products listing with filters
  - Cart page with add/remove items
  - Cart persists across logout/login because it's stored server-side for each user

## How to run

### Backend
```
cd backend
npm install
npm run start
```
By default the backend runs on http://localhost:4000

### Frontend
```
cd frontend
npm install
npm run dev
```
By default the frontend runs on http://localhost:3000 and expects the backend on http://localhost:4000

## Notes
- Data is persisted to `backend/data/*.json` files. This is intentionally simple so you can run without a database.
- For production you should replace file-based storage with a real database and secure the JWT secret.

