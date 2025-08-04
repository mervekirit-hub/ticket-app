Ticket App

A secure, full-stack ticket management system built with Node.js, Express, MongoDB, and EJS, designed to streamline the process of customer service, issue tracking, and administrative control.
Features

    🧾 Ticket creation and management

    👥 Role-based authentication (Admin & Customer)

    🔐 Security best practices with Helmet, CSRF protection, and rate limiting

    📦 RESTful API integration

    🧪 Input validation and sanitization

    🌍 EJS templating for server-side rendering

    🐳 Docker & Nginx integration for containerized deployment

Tech Stack

    Backend: Node.js, Express.js

    Database: MongoDB (via Mongoose)

    Templating: EJS

    Security: Helmet, CSRF, JWT, rate limiting

    Dev Tools: Nodemon, Docker, Docker Compose

Getting Started
Prerequisites

    -Node.js (v16+)

    -MongoDB instance

    -Docker & Docker Compose (optional, for containerized setup)

Installation

Clone the repository:

    git clone <your-repo-url>
    cd ticket-app

Install dependencies:

    npm install

Create a .env file based on the provided template:

    PORT=3000
    MONGO_URI=mongodb://localhost:27017/ticketApp
    JWT_SECRET=your_jwt_secret

Start the development server:

    npm start
    
Open your browser and visit: http://localhost:3000

Docker (Optional)

To run the app in a Docker container:

docker-compose up --build

Access it via http://localhost:80 (Nginx will reverse-proxy to the app container).
Folder Structure

ticket-app/
├── routes/             # Route handlers
├── middlewares/        # Authentication & validation logic
├── views/              # EJS templates
├── public/             # Static assets
├── App.js              # Main app entry
├── db.js               # MongoDB connection
├── Dockerfile          # Docker setup
├── nginx.conf          # Nginx configuration
└── .env                # Environment variables

Security Features

    Helmet for HTTP header hardening

    CSRF protection middleware

    JWT-based token authentication

    Express Rate Limiter to prevent brute force attacks

    Input validation with express-validator

Author

Merve Kırıt

