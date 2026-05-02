# Express Calendar

A full-stack calendar application built with Express, MongoDB, React, and Socket.IO.

## Features
- **User Authentication**: Secure signup and login using JWT and Bcrypt.
- **Calendar Management**: Create, edit, and delete multiple calendars to organize different aspects of your life.
- **Event Management**: Add, update, and remove events with ease.
- **Real-time Updates**: Instant synchronization across devices using Socket.IO.
- **Modern UI**: Clean and responsive design built with React and Tailwind CSS.

## Prerequisites
- **Node.js**: v18 or higher recommended.
- **MongoDB**: A local instance or a MongoDB Atlas connection string.

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/Lenninssp/express-calendar.git
cd express-calendar
```

### 2. Install Dependencies

Install root and backend dependencies:
```bash
npm install
```

Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

### 3. Environment Configuration

The application requires specific environment variables to function correctly.

#### Backend Configuration
Create a `.env` file in the **root** directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/express-calendar
JWT_SECRET=your_super_secret_key_here
```

#### Frontend Configuration
Create a `.env` file in the **frontend** directory:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Running the Application

You can start both the backend and frontend simultaneously from the root directory using the following command:
```bash
npm run dev
```

- **Frontend**: Accessible at `http://localhost:5173`
- **Backend API**: Accessible at `http://localhost:5000`

### 5. Other Commands

- **Run Server only**: `npm run server`
- **Run Frontend only**: `npm run client`
- **Build Frontend**: `npm run build`

## Project Structure
- `backend/`: Node.js/Express server containing models, routes, and socket logic.
- `frontend/`: React/Vite application with TypeScript and Tailwind CSS.
- `package.json` (root): Manages shared dependencies and scripts for the entire project.

## License
ISC
