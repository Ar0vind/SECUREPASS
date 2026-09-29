# SecurePass - Password Security Tool (Frontend)

A simple and clean React frontend for password leak checking, password generation, account history, and password reset.

> See the [project-level README](../README.md) for the full setup guide, API reference, and environment variable list. This file is a quick-start for the frontend only.

## Features

- **User Authentication**: Register and login functionality
- **Forgot / Reset Password**: Request a reset link by email and set a new password from it
- **Password Leak Checker**: Check if passwords have been compromised using the Have I Been Pwned API
- **Password Generator**: Generate strong, random passwords with customizable options
- **Account History**: A filterable timeline of past checks and generations (metadata only — never the passwords themselves)
- **Clean UI**: Minimal, modern design with smooth animations

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory (see `backend/.env.example` for the full list):
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
```

4. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit: `http://localhost:3000`

## Usage

1. **Register**: Create a new account with username, email, and password
2. **Login**: Sign in with your credentials
3. **Forgot password?**: Request a reset link from the login screen if you've lost your password
4. **Check Password**: Enter a password to see if it's been compromised in data breaches
5. **Generate Password**: Create strong passwords with customizable length and character options
6. **History**: Review a log of your past checks and generations from the dashboard

## Tech Stack

- **Frontend**: React, Vite, CSS3
- **Backend**: Node.js, Express, MongoDB
- **APIs**: Have I Been Pwned API for password breach checking
- **Security**: bcrypt for password hashing, JWT for authentication, nodemailer for reset emails

## Password Checker

The password leak checker uses the Have I Been Pwned API with k-anonymity model:
- Passwords are hashed locally using SHA-1
- Only the first 5 characters of the hash are sent to the API
- Your actual password never leaves your browser

## Password Generator

Features:
- Adjustable password length (8-32 characters)
- Include/exclude uppercase, lowercase, numbers, and symbols
- Real-time strength meter
- One-click copy to clipboard

## Account History

- Logs whether a checked password was breached (and how many times), or the length/options/strength of a generated password
- Never logs the passwords themselves — checks and generation both stay entirely client-side
- Filterable by type, with a "Clear history" action

## Notes

- Make sure MongoDB is running before starting the backend
- The backend must be running on port 5000 for the frontend to connect
- Password requirements: minimum 8 characters with uppercase, lowercase, number, and special character
- Without SMTP credentials configured on the backend, "forgot password" reset links are printed to the backend console instead of emailed — handy for local development

## License

MIT
