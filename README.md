# E-commerce REST API

A RESTful E-commerce backend built using Node.js, Express.js, MongoDB and JWT authentication.

## Features

### Authentication & Users
- User registration and login
- JWT-based authentication
- Role-based access control (Admin and Customer)
- Password hashing using bcrypt
- User profile management
- Admin user listing and account activation/deactivation

### Categories
- Create, read, update and delete categories
- Support for unlimited nested categories
- Retrieve hierarchical category trees
- Parent-child relationship validation

### Products
- Product CRUD operations
- Product search by name
- Category and price filtering
- Sorting and pagination
- Product stock management

### Orders
- Place orders with multiple products
- Automatic price and total calculation
- Stock deduction when orders are placed
- Customer-specific order access
- Admin order management
- Order status updates and cancellation

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcryptjs
- express-validator
- Helmet
- Morgan
- express-rate-limit

## Project Structure

```text
store-manager/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
├── postman/
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

## Installation

Clone the repository:

```bash
git clone https://github.com/reubenbilon/ecommerce-rest-api.git
cd ecommerce-rest-api
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root using `.env.example` as a reference.

Configure the following environment variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
```

Start the development server:

```bash
npm run dev
```

Server runs at:

`http://localhost:5000`

## API Endpoints

Base URL: `http://localhost:5000/api`

| Module | Method | Endpoint | Access |
|---|---|---|---|
| Authentication | POST | `/auth/register` | Public |
| Authentication | POST | `/auth/login` | Public |
| Users | GET | `/users/profile` | Authenticated |
| Users | GET | `/users` | Admin |
| Users | PATCH | `/users/:id/status` | Admin |
| Categories | POST | `/categories` | Admin |
| Categories | GET | `/categories` | Public |
| Categories | GET | `/categories/tree` | Public |
| Categories | PATCH | `/categories/:id` | Admin |
| Categories | DELETE | `/categories/:id` | Admin |
| Products | POST | `/products` | Admin |
| Products | GET | `/products` | Public |
| Products | GET | `/products/:id` | Public |
| Products | PATCH | `/products/:id` | Admin |
| Products | DELETE | `/products/:id` | Admin |
| Orders | POST | `/orders` | Customer |
| Orders | GET | `/orders` | Authenticated |
| Orders | GET | `/orders/:id` | Authenticated |
| Orders | PATCH | `/orders/:id/status` | Admin |

## Postman Testing

## API Documentation & Testing

The Postman collection is available in the `postman/` directory.

### Import the Collection

1. Clone or download this repository.
2. Open Postman.
3. Click Import.
4. Select the file:

   `postman/E-commerce REST API.postman_collection.json`

5. Run the Login requests to generate authentication tokens.
6. Use the collection to test the API endpoints.

### Authentication

The collection uses JWT authentication with three collection variables:

- `customerToken`
- `adminToken`
- `customer2Token`

Login requests automatically save the generated tokens.

### Tested Modules

- Authentication and User Management
- Category Management
- Product Management
- Order Management
- Role-based Authorization
- Product Stock Management

## Security

- Passwords are hashed before storage.
- JWT authentication protects private routes.
- Role-based authorization restricts admin operations.
- Environment variables are used for sensitive configuration.
- Helmet and rate limiting provide additional API protection.

## License

This project was developed as a backend developer machine test.