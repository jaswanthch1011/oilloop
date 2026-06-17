# FrytoFly Backend

Production-ready Node.js backend for the FrytoFly UCO Recycling Platform.

## Architecture
- **MVC Pattern**: Clear separation of Models, Views (API JSON responses), and Controllers.
- **Service Layer**: Business logic isolated from controllers for reusability and testability.
- **Middleware**: robust authentication, role-based access, and security layers.

## Tech Stack
- **Node.js & Express**: Core framework.
- **MongoDB & Mongoose**: Database and ODM.
- **JWT**: Secure authentication.
- **TensorFlow.js**: AI-powered oil quality prediction.
- **Docker**: Containerized deployment.
- **Swagger**: API Documentation.

## Getting Started

### Prerequisites
- Node.js (v20+)
- MongoDB Atlas account
- Docker (optional)

### Installation
1. `cd backend`
2. `npm install`
3. Create `.env` file from `.env.example`
4. `npm run dev`

### API Documentation
Visit `http://localhost:5000/api-docs` to view the Swagger UI.

## Project Structure
- `src/config`: Database and server configuration.
- `src/controllers`: Request handlers.
- `src/models`: Mongoose schemas.
- `src/routes`: API route definitions.
- `src/services`: Business logic (Gamification, AI, etc).
- `src/middlewares`: Auth and security middlewares.
- `src/docs`: Swagger definitions.
