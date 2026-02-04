# Jeisys API Server

## Setup

1.  **Install MySQL**: Ensure you have MySQL installed and running.
2.  **Create Database**: Create a database named `jeisys_medical`.
    ```sql
    CREATE DATABASE jeisys_medical;
    ```
3.  **Configure Environment**: Edit `.env` file and update `DATABASE_URL` with your MySQL credentials.
    ```
    DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/jeisys_medical"
    ```
4.  **Install Dependencies**:
    ```bash
    npm install
    ```
5.  **Sync Database**:
    ```bash
    npx prisma db push
    ```
    This will create the tables in your MySQL database based on `prisma/schema.prisma`.

## Running the Server

-   **Development**:
    ```bash
    npm run dev
    ```
    Runs the server with `nodemon` (restarts on file changes).
    Server URL: `http://localhost:3001`

-   **Production Build**:
    ```bash
    npm run build
    npm start
    ```

## API Endpoints

-   `GET /api/health`: Check server status.
-   `GET /api/products`: Get list of products.
-   `POST /api/auth/signup`: Create a new user account.
