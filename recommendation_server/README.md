# Express TypeScript Codebase

A backend project scaffold built with Express and TypeScript, integrated with database migrations.

## Table of Contents

- Introduction
- Technologié Used
- Installation
- Running the Project
- Scripts
- Project Structure
- License

# Fashion E-commerce Backend

Backend API for a clothing e-commerce website built with Express, TypeScript, and TypeORM.

## Introduction

This backend project powers a clothing e-commerce website with the
following features:

- Product management (clothing) with size, color, and material options
- Brand and category management
- Shopping cảt and order system 
- Product reviews
- Authentication & Authorization
- Phân lớp Controller - Service - Entity rõ ràng

## Technologies Used

### Backend:
- **Node.js** - Runtime environment
- **TypeScript** - Strongly typed JavaScript
- **Express.js** - Web framework
- **TypeORM** - Object-Relational Mapping
- **ts-node** - TypeScript execution engine

### Frontend:
- **Next.js** - React framework
- **TypeScript** - Type safety

### Database:
- **MySQL** - Relational database

## Installation

Requirements: Node.js >= 22.16.0, MySQL installed
 
1. Clone the repo:

## git clone https://github.com/TranChinh2901/software_project
## cd software_project

2. Install dependencies:

npm install

3. Create the .env file:

cp .env.example .env

Update the database connection details DB, PORT, JWT,... ínide file 
.env

## Running the project

1. Run migrations to create tables:

npm run migration:run

2. Run in develop mode:

npm run dev

3. Generate a new migration file from an Entity (replace the filename, no accents or special characters):

npm run migration:generate -- src/migrations/tenFile

## Scripts

| Command                                 | Description                                 |
|--------------------------------------|----------------------------------------|
| npm run dev                          | Start the server with ts-node-dev           |
| npm run migration:run                | Run migrations to create database tables            |
| npm run migration:generate -- src/migrations/tenFile   | Generate a new migration file (replace filename with no accents or special characters)             |

## Project Structure
```bash
src/
  ├── common/                 // Defines response structures (error, success)
  ├── config/                 // Application and DB configuration; loads env & entities for DB initialization
  ├── constants/             // App-wide constants: error codes, messages, status codes, etc.
  ├── database/               // Database connection initialization
  ├── helpers/               // Helper functions
  ├── middlewares/           // customs middleware 
  ├── routes/                // Route definition
  ├── migrations/             // File migration to create DB tables
  ├── modules/              // Modules in project: users, auth,...
  ├── utils/                 // Utility functions
main.ts                   // Entry point: app startup, middleware,...
```

## License

This project is licensed under the MIT License.

## Author

-Tranchinh2901
