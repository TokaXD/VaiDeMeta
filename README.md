# VaiDeMeta

VaiDeMeta is a goal management web application that helps users track and achieve their objectives effectively. The application provides a user-friendly interface for creating, managing, and monitoring personal or professional goals.

## Features

- **User Authentication**: Secure login and registration system
- **Goal Management**: Create, edit, and delete personal goals
- **Dashboard**: Visual representation of goal progress and statistics
- **AI Integration**: Smart goal completion messages and insights
- **Deadline Tracking**: Set and monitor goal deadlines
- **Profile Management**: User profile customization

## Technology Stack

### Backend
- Node.js with Express
- TypeScript
- SQLite3 for database
- JSON Web Tokens (JWT) for authentication
- bcrypt for password hashing

### Frontend
- HTML5/CSS3
- jQuery
- Chart.js for data visualization
- SweetAlert2 for notifications

## Getting Started

### Prerequisites
- Node.js (Latest LTS version)
- npm (Node Package Manager)

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd vaidemeta
```

2. Install dependencies
```bash
npm install
```

3. Build the project
```bash
npm run build
```

4. Start the server
```bash
npm start
```

The application will be available at `http://localhost:3001`

### Development Mode

To run the application in development mode with hot-reloading:
```bash
npm run dev
```

## Project Structure

```
├── public/              # Static files
│   ├── css/            # Stylesheets
│   ├── js/             # Client-side JavaScript
│   └── *.html          # HTML pages
├── src/                # Source code
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── server.ts       # Server configuration
├── package.json        # Project dependencies
└── tsconfig.json      # TypeScript configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Goals
- `GET /api/metas` - Get all goals
- `POST /api/metas` - Create new goal
- `PUT /api/metas/:id` - Update goal
- `DELETE /api/metas/:id` - Delete goal

### AI Integration
- `POST /api/ai/completion-message` - Generate AI messages for goal completion
