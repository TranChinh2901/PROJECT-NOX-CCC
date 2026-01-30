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

### Requirements
- Node.js >= 22.16.0
- MySQL 8.0+ installed and running

### 1. Clone the Repository

```bash
git clone https://github.com/TranChinh2901/software_project
cd recommendation_server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### 3.1 Create MySQL Database and User

Log into MySQL as root (or an admin user):

```bash
mysql -u root -p
```

Create the database and user with the following SQL commands:

```sql
-- Create the database
CREATE DATABASE IF NOT EXISTS fashion_ecommerce 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Create the user
CREATE USER IF NOT EXISTS 'fashion_user'@'localhost' 
  IDENTIFIED BY 'fashion_pass';

-- Grant privileges
GRANT ALL PRIVILEGES ON fashion_ecommerce.* 
  TO 'fashion_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify
EXIT;
```

#### 3.2 Configure Environment Variables

Create the `.env` file from the example:

```bash
cp .env.example .env
```

Update `.env` with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=fashion_user
DB_PASSWORD=fashion_pass
DB_NAME=fashion_ecommerce

# Server Port
PORT=5000

# JWT Configuration (add your secret)
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Cloudinary (for image uploads)
CLOUD_NAME=your_cloud_name
CLOUD_KEY=your_cloud_key
CLOUD_SECRET=your_cloud_secret
```

### 4. Run Database Migrations

Create the database tables:

```bash
npm run migration:run
```

### 5. Seed Database with Sample Data

Run the seed scripts in order:

```bash
# 1. Seed users and roles (creates admin user)
npm run seed

# 2. Seed e-commerce data (products, categories, brands, etc.)
npm run seed:ecommerce

# 3. Seed blog data (optional - for blog features)
npm run seed:blog
```

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `admin123`

**Default User Credentials:**
- Email: `user@example.com`
- Password: `user123`

### 6. Start the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:5000`

## Scripts

### Development
| Command | Description |
|---------|-------------|
| `npm run dev` | Start the server in development mode with hot reload |
| `npm run build` | Build the project for production |
| `npm run start` | Start the production server |

### Database Migration
| Command | Description |
|---------|-------------|
| `npm run migration:run` | Run all pending migrations to create/update database tables |
| `npm run migration:generate -- src/migrations/FileName` | Generate a new migration from entities (replace `FileName` with no accents/special chars) |
| `npm run migration:revert` | Revert the last executed migration |

### Database Seeding
| Command | Description |
|---------|-------------|
| `npm run seed` | Seed users and roles (creates admin and test users) |
| `npm run seed:ecommerce` | Seed e-commerce data (categories, brands, products, inventory) |
| `npm run seed:blog` | Seed blog posts and categories |

### Testing
| Command | Description |
|---------|-------------|
| `npm test` | Run Jest test suite |
| `npm run test:api` | Run API endpoint tests |

### Complete Setup Workflow
```bash
# 1. Install dependencies
npm install

# 2. Create .env and configure database

# 3. Run migrations
npm run migration:run

# 4. Seed data
npm run seed
npm run seed:ecommerce

# 5. Start development server
npm run dev
```

## Project Structure
```bash
src/
  ├── common/                 // Defines response structures (error, success)
  ├── config/                 // Application and DB configuration; loads env & entities
  ├── constants/             // App-wide constants: error codes, messages, status codes
  ├── database/               // Database connection initialization
  ├── helpers/               // Helper functions
  ├── middlewares/           // Custom middleware
  ├── routes/                // Route definitions
  ├── migrations/             // TypeORM migration files for database schema
  ├── modules/              // Feature modules (users, auth, products, orders, etc.)
  ├── scripts/              // Database seeding scripts
  │   ├── seed-users-roles.ts    // Seed admin and test users
  │   ├── seed-ecommerce.ts      // Seed products, categories, brands
  │   └── seed-blog.ts           // Seed blog content
  ├── utils/                 // Utility functions
main.ts                   // Application entry point
```

## Troubleshooting

### Database Connection Issues
- **Error: `Access denied for user 'fashion_user'@'localhost'`**
  - Verify MySQL user exists: `SELECT user FROM mysql.user;`
  - Recreate user with correct credentials
  - Check `.env` matches the MySQL credentials

- **Error: `Unknown database 'fashion_ecommerce'`**
  - Create the database manually: `CREATE DATABASE fashion_ecommerce;`

### Migration Issues
- **Error: `Cannot find module` during migration**
  - Ensure `tsconfig-paths` is registered: Check package.json scripts
  - Delete `dist/` folder and rebuild: `npm run prebuild && npm run build`

- **Migration fails or gets stuck**
  - Check if MySQL is running: `sudo systemctl status mysql` (Linux) or `brew services list` (macOS)
  - Verify database connection in `.env`

### Port Already in Use
- **Error: `EADDRINUSE: address already in use :::5000`**
  - Kill the process: `npx kill-port 5000`
  - Or change `PORT` in `.env` to a different value (e.g., `5001`)

## License

This project is licensed under the MIT License.

## Author

-Tranchinh2901
