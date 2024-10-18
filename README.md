#This project is a Task Management API built using Node.js, Express, and MongoDB. It supports task creation, updating, and deletion with role-based access control (RBAC) for different user types such as Admin and Manager. The API includes JWT authentication and token blacklisting for enhanced security.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/task-management-api.git
   ```

2. Navigate into the project directory:
   ```bash
   cd task-management-api
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables by creating a `.env` file with the following:
   ```
   PORT=5000
   MONGODB_URI=your-mongodb-uri
   JWT_SECRET=your-jwt-secret
   ```

5. Start the server:
   ```bash
   npm start
   ```


## Usage

### Create a Task
- **Method**: `POST`
- **URL**: `/api/tasks`
- **Body**:
  ```json
  {
    "title": "New Task",
    "priority": "High",
    "dueDate": "2024-10-20"
  }
  ```

### Update a Task
- **Method**: `PUT`
- **URL**: `/api/tasks/:id`
- **Body**:
  ```json
  {
    "title": "Updated Task Title",
    "priority": "Medium",
    "dueDate": "2024-11-10"
  }
  ```

## Technologies Used
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT (for authentication)
- Joi (for validation)
- Postman (for API testing)


## API Endpoints

| Method | Endpoint            | Description                |
|--------|---------------------|----------------------------|
| POST   | `/api/tasks`         | Create a new task           |
| PUT    | `/api/tasks/:id`     | Update an existing task     |
| DELETE | `/api/tasks/:id`     | Delete a task               |



