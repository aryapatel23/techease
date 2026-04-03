# TeachEase - Quick Start Guide

## Prerequisites

Before running the application, ensure you have:

1. **Node.js** v18 or higher
2. **PostgreSQL** v14 or higher
3. **npm** or **yarn** package manager

## Database Setup

### Option 1: Using Local PostgreSQL

1. Install PostgreSQL on your system
2. Create a new database:
```bash
psql -U postgres
CREATE DATABASE teachease;
\q
```

3. Update `backend/.env` with your database credentials:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=teachease
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### Option 2: Using Docker PostgreSQL

```bash
docker run --name teachease-postgres \
  -e POSTGRES_DB=teachease \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:14
```

## Installation

### Install All Dependencies

From the project root:
```bash
npm run install-all
```

Or install separately:

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

## Running the Application

### Development Mode

You need two terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```
The backend will start on http://localhost:5000

**Terminal 2 - Frontend Server:**
```bash
cd frontend
npm run dev
```
The frontend will start on http://localhost:3000

### Important Notes

1. **Database Auto-Setup**: When you start the backend for the first time, it will:
   - Create all necessary tables
   - Seed demo data automatically
   - You don't need to run any SQL scripts manually

2. **Demo Accounts**: The system creates these accounts automatically:
   - **Teacher**: teacher@demo.com / password123
   - **Student**: student1@demo.com / password123

## Accessing the Application

1. Open your browser and go to: http://localhost:3000
2. Login with the demo credentials above
3. Explore the features!

## Features Overview

### Teacher Dashboard
- View today's schedule
- Quick stats (classes, students, attendance)
- Manage all administrative tasks

### Main Features
1. **Students**: Add, edit, view student records
2. **Classes**: Create and manage classes
3. **Attendance**: Mark attendance (single or bulk)
4. **Grades**: Enter grades and generate report cards
5. **Timetable**: View your teaching schedule
6. **Analytics**: Performance insights and graphs

## Production Build

To create production builds:

```bash
# Build both frontend and backend
npm run build

# Or build separately
cd backend && npm run build
cd frontend && npm run build
```

## Troubleshooting

### Port Already in Use
If port 5000 or 3000 is already in use, you can change them:

**Backend**: Edit `backend/.env` and change `PORT=5000` to another port

**Frontend**: Edit `frontend/vite.config.ts` and change the port in server.port

### Database Connection Error
- Ensure PostgreSQL is running
- Verify database credentials in `backend/.env`
- Check if the database `teachease` exists

### Build Errors
Make sure you have the latest dependencies:
```bash
cd backend && npm install
cd frontend && npm install
```

## Project Structure

```
teachease/
├── backend/               # Express.js backend
│   ├── src/
│   │   ├── config/       # DB config and initialization
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth and error handling
│   │   ├── routes/       # API routes
│   │   └── index.ts      # Main server file
│   └── package.json
│
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React context providers
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx       # Root component
│   └── package.json
│
└── README.md             # Detailed documentation
```

## Next Steps

1. Explore the demo data
2. Create your own classes and students
3. Mark attendance for today
4. Enter some grades
5. Check out the analytics dashboard

## Support

For issues or questions:
- Check the main README.md for detailed API documentation
- Review the code comments
- Check console logs for error messages

Enjoy using TeachEase!
