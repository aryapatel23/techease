# TeachEase - Teacher-Centric Academic Administration System

A comprehensive web application designed to reduce teacher workload by automating administrative tasks like attendance, grading, reporting, and analytics.

## Features

### Core Functionality

1. **Attendance System**
   - Quick single and bulk attendance marking
   - View attendance by class/date
   - Attendance statistics and reports
   - Export attendance data

2. **Grading System**
   - Easy grade entry interface
   - Automatic grade calculation
   - Report card generation
   - Subject-wise performance tracking

3. **Student Management**
   - Add/edit student profiles
   - Organized student records
   - Class enrollment management
   - Student search and filtering

4. **Performance Analytics**
   - Visual performance graphs
   - Class insights and statistics
   - Identify struggling students
   - Subject-wise analysis

5. **Timetable Management**
   - Teacher schedule view
   - Conflict-free timetable
   - Daily class overview

6. **Dashboard**
   - Today's classes at a glance
   - Pending tasks overview
   - Quick action buttons
   - Key statistics

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Recharts for data visualization
- Axios for API calls
- Lucide React for icons

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL database
- JWT authentication
- bcryptjs for password hashing

## Project Structure

```
teachease/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and app configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth and error handling
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   └── index.ts         # Main server file
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context (Auth)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx          # Main app component
│   └── package.json
│
└── package.json             # Root package file
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE teachease;
```

2. Update backend/.env with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=teachease
DB_USER=postgres
DB_PASSWORD=your_password
```

### Installation

1. Install all dependencies:
```bash
npm run install-all
```

Or install separately:

Backend:
```bash
cd backend
npm install
```

Frontend:
```bash
cd frontend
npm install
```

### Running the Application

#### Development Mode

1. Start the backend server:
```bash
cd backend
npm run dev
```
Server runs on http://localhost:5000

2. Start the frontend (in a new terminal):
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:3000

#### Production Build

```bash
npm run build
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- GET `/api/auth/profile` - Get user profile
- PUT `/api/auth/profile` - Update profile

### Students
- GET `/api/students` - Get all students
- GET `/api/students/:id` - Get student by ID
- POST `/api/students` - Create student
- PUT `/api/students/:id` - Update student
- DELETE `/api/students/:id` - Delete student
- POST `/api/students/enroll` - Enroll student in class

### Classes
- GET `/api/classes` - Get all classes
- GET `/api/classes/:id` - Get class by ID
- POST `/api/classes` - Create class
- PUT `/api/classes/:id` - Update class
- DELETE `/api/classes/:id` - Delete class
- GET `/api/classes/:id/students` - Get class students

### Attendance
- POST `/api/attendance` - Mark attendance
- POST `/api/attendance/bulk` - Bulk mark attendance
- GET `/api/attendance/class` - Get class attendance
- GET `/api/attendance/student/:id` - Get student attendance
- GET `/api/attendance/stats` - Get attendance statistics

### Grades
- POST `/api/grades` - Add grade
- PUT `/api/grades/:id` - Update grade
- DELETE `/api/grades/:id` - Delete grade
- GET `/api/grades/class` - Get class grades
- GET `/api/grades/student/:id` - Get student grades
- GET `/api/grades/report-card` - Generate report card

### Timetable
- POST `/api/timetable` - Create timetable entry
- GET `/api/timetable/class/:id` - Get class timetable
- GET `/api/timetable/teacher` - Get teacher timetable
- PUT `/api/timetable/:id` - Update timetable
- DELETE `/api/timetable/:id` - Delete timetable entry

### Analytics
- GET `/api/analytics/class/:id` - Get class analytics
- GET `/api/analytics/student/:id` - Get student analytics
- GET `/api/analytics/dashboard` - Get dashboard statistics

## Default Users

Create users through the registration API or use these demo credentials:

**Teacher Account:**
- Email: teacher@demo.com
- Password: password123

## Database Schema

The system uses the following main tables:
- `users` - User accounts (teachers, students, admin)
- `classes` - Class information
- `subjects` - Subject catalog
- `enrollments` - Student-class relationships
- `attendance` - Attendance records
- `grades` - Grade/marks records
- `exam_types` - Exam type definitions
- `timetable` - Schedule entries
- `announcements` - System announcements

## Features by User Role

### Teacher
- Manage multiple classes
- Mark attendance (single/bulk)
- Enter and update grades
- View class analytics
- Access timetable
- Generate reports

### Student (Read-only)
- View personal attendance
- View grades and report cards
- Check timetable
- View announcements

### Admin
- Full system access
- User management
- Class management
- System configuration

## Contributing

This is a hackathon project. Feel free to fork and enhance!

## License

MIT License
