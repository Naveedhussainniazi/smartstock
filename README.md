# SmartStock -- Inventory Management System

A full-stack inventory management web application built with the MERN
stack and deployed using Docker on AWS EC2.

> **Project status:** Deployed and publicly accessible through an EC2
> public IP over HTTP. HTTPS and a custom domain are future deployment
> improvements.

## Project Overview

SmartStock is designed to help manage inventory operations through a
web-based interface. This project demonstrates full-stack application
development, REST API integration, database connectivity,
containerization, and cloud deployment.

## Technology Stack

  -----------------------------------------------------------------------
  Area                    Technologies            Purpose
  ----------------------- ----------------------- -----------------------
  Frontend                React, Vite             User interface and
                                                  production build

  State management        Redux Toolkit           Centralized application
                                                  state

  Styling                 Tailwind CSS            Responsive UI styling

  API communication       Axios                   Frontend-to-backend
                                                  HTTP requests

  Backend                 Node.js, Express.js     REST API and
                                                  application logic

  Database                MongoDB Atlas, Mongoose Cloud database and data
                                                  modeling

  Authentication          JWT, bcryptjs           Token-based
                                                  authentication and
                                                  password hashing

  Containerization        Docker, Docker Compose  Build and run
                                                  application services

  Web server              Nginx                   Serve frontend and
                                                  reverse-proxy API
                                                  requests

  Cloud hosting           AWS EC2, Ubuntu Server  Host the deployed
                          24.04 LTS               application

  Version control         Git, GitHub             Source control and
                                                  repository hosting

  API testing             Postman                 API testing and
                                                  troubleshooting
  -----------------------------------------------------------------------

## Main Application Areas

The current project includes or is being developed around these areas.
Exact availability may vary by deployed build:

-   User authentication
-   Dashboard
-   Product management
-   Category management
-   Supplier management
-   Purchase management
-   Sales management
-   Stock movements and product stock history
-   Reports and analytics

## Architecture

``` text
                  Web Browser
                       |
                       | HTTP :80
                       v
                AWS EC2 (Ubuntu)
                       |
                       v
              Docker Compose Network
                       |
             +---------+---------+
             |                   |
             v                   |
       Frontend Container        |
       Nginx :80                 |
             |                   |
             | /api/*            |
             +-------------------+
                       |
                       v
              Backend Container
              Node.js / Express
                    :5000
                       |
                       v
                MongoDB Atlas
```

The frontend is exposed on port `80`. Nginx serves the React application
and forwards `/api/` requests to the backend container. The backend port
`5000` is not intended to be exposed publicly; browser API requests
should go through Nginx.

## Repository Structure

``` text
smartstock/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── ...
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── index.html
├── docker-compose.yml
└── README.md
```

Some folders or files may change as the project evolves.

## Run Locally with Docker

### Prerequisites

-   Git
-   Docker Engine
-   Docker Compose plugin
-   MongoDB Atlas database (or another supported MongoDB instance)

### 1. Clone the repository

``` bash
git clone https://github.com/Naveedhussainniazi/smartstock.git
cd smartstock
```

### 2. Configure backend environment variables

Create the backend environment file:

``` bash
cp backend/.env.example backend/.env
nano backend/.env
```

Set the values for your own environment:

``` env
PORT=5000
NODE_ENV=production

MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost
JWT_SECRET=replace_with_a_long_random_secret

ADMIN_NAME=Your Admin Name
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_secure_password
```

Use a strong, unique JWT secret and admin password. Never commit `.env`
files, database connection strings, passwords, or other secrets to
GitHub.

### 3. Build and start the containers

From the project root:

``` bash
sudo docker compose up -d --build
```

### 4. Check container status

``` bash
sudo docker compose ps
```

### 5. Check the API health endpoint

``` bash
curl http://localhost/api/health
```

Expected response:

``` json
{
  "success": true,
  "message": "SmartStock API is running"
}
```

Open the application in a browser:

``` text
http://localhost
```

## Deploy on AWS EC2

The project has been deployed on an Ubuntu Server 24.04 LTS EC2 instance
using Docker Compose.

High-level deployment steps:

1.  Launch an Ubuntu EC2 instance.
2.  Configure the EC2 security group to allow SSH from a trusted IP and
    HTTP on port `80`.
3.  Install Docker Engine and the Docker Compose plugin.
4.  Clone the SmartStock repository.
5.  Configure `backend/.env` on the EC2 instance.
6.  Add the EC2 public IP or application domain to MongoDB Atlas Network
    Access.
7.  Ensure the backend `CLIENT_URL` matches the frontend origin.
8.  Build and start the services:

``` bash
sudo docker compose up -d --build
```

9.  Verify the containers:

``` bash
sudo docker compose ps
```

10. Test the application and API:

``` bash
curl -I http://localhost
curl http://localhost/api/health
```

Then open:

``` text
http://YOUR_EC2_PUBLIC_IP
```

### AWS Security Group guidance

  Type      Port Recommended source
  ------- ------ --------------------------------------------
  SSH         22 Your trusted public IP only
  HTTP        80 `0.0.0.0/0` when public access is required
  HTTPS      443 `0.0.0.0/0` when HTTPS is configured

Do not open backend port `5000` to the public internet. Use Nginx as the
public entry point. For production use, configure HTTPS with a domain
and TLS certificate, and consider an Elastic IP so the server address
remains stable.

## Useful Docker Commands

Run these commands from the repository root:

``` bash
# View running services
sudo docker compose ps

# View logs from all services
sudo docker compose logs

# Follow backend logs
sudo docker compose logs -f backend

# Follow frontend logs
sudo docker compose logs -f frontend

# Rebuild and restart services
sudo docker compose up -d --build

# Rebuild only the frontend
sudo docker compose up -d --build frontend

# Stop services
sudo docker compose down
```

## API Health Check

  Method   Endpoint        Purpose
  -------- --------------- -------------------------------------------
  GET      `/api/health`   Verify that the backend API is responding

Other API routes depend on the current backend implementation. Refer to
the source code for the latest route definitions.

## QA and Testing

A separate QA handover package is available for this project:

-   **QA Test Plan & Functional Test Cases** -- Word document
-   **QA Test Execution Tracker** -- Excel workbook with test cases,
    status tracking, defect log, and execution summary

The QA baseline covers authentication, dashboard, products, categories,
suppliers, purchases, sales, stock management, reports, API integration,
security checks, and deployment checks. Testers should confirm which
features are present in the release and verify business rules before
execution.

## Security Notes

-   Keep `.env` files out of Git.
-   Never publish MongoDB credentials, JWT secrets, admin passwords, SSH
    private keys, or access tokens.
-   Use strong and unique credentials.
-   Restrict SSH access to trusted IP addresses.
-   Do not expose the backend container port publicly.
-   Use HTTPS for production traffic.
-   Use test data when validating purchase, sales, and stock workflows.
-   Take backups and verify recovery procedures before production use.

## Future Improvements

Potential next steps for the project include:

-   Custom domain and HTTPS
-   Automated CI/CD deployment pipeline
-   Automated backend and frontend tests
-   Role-based access control and audit logging
-   Application and infrastructure monitoring
-   Centralized logs, alerts, and backup/recovery procedures
-   Performance and security testing

## Project Repository

**GitHub:** https://github.com/Naveedhussainniazi/smartstock

## Author

Developed as a hands-on full-stack and cloud deployment project to
practice MERN stack development, Linux administration, Docker
containerization, and AWS EC2 deployment.

------------------------------------------------------------------------

*This README describes the known project setup and deployment workflow.
Update it as application features, configuration, and infrastructure
evolve.*
