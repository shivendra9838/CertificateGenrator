# Certificate Generator System

Full-stack certificate generation and management app for creating PDF and PNG certificates, storing records in MongoDB, searching generated certificates, and downloading generated files.

## Stack

- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose, PDFKit, Sharp
- Frontend: React, TypeScript, Vite, React Router, Axios
- Tests: Jest, Supertest, React Testing Library, MongoDB Memory Server
- Deployment: Dockerfiles for backend/frontend and local `docker-compose.yml`

## Project Structure

```text
backend/
  src/
    config/
    models/
    routes/
    services/
    utils/
frontend/
  src/
    components/
    pages/
    services/
    types/
docker-compose.yml
package.json
```

## Quick Start

```bash
npm install
copy backend\.env.development backend\.env
copy frontend\.env.development frontend\.env
npm run dev
```

The backend runs at `http://localhost:3000`.
The frontend runs at `http://localhost:5173`.

For local MongoDB with Docker:

```bash
docker compose up mongodb
```

## Scripts

```bash
npm run dev              # backend and frontend together
npm run dev:backend      # Express API only
npm run dev:frontend     # Vite app only
npm run build            # compile both workspaces
npm test                 # run all tests
npm run lint             # lint both workspaces
npm run format           # format source and docs
```

## Environment

Backend variables:

| Variable                   | Description                         | Default                 |
| -------------------------- | ----------------------------------- | ----------------------- |
| `NODE_ENV`                 | Runtime environment                 | `development`           |
| `PORT`                     | Backend port                        | `3000`                  |
| `MONGODB_URI`              | MongoDB connection string           | required                |
| `MONGODB_DB_NAME`          | Database name                       | `certificate_generator` |
| `CERTIFICATE_STORAGE_PATH` | Generated file directory            | `./certificates`        |
| `CERTIFICATE_SECRET_KEY`   | HMAC secret for certificate IDs     | required in production  |
| `CORS_ORIGIN`              | Allowed frontend origin             | `http://localhost:5173` |
| `LOG_LEVEL`                | `error`, `warn`, `info`, or `debug` | `info`                  |
| `LOG_FILE_PATH`            | JSONL application log path          | `./logs/app.log`        |

Frontend variables:

| Variable            | Description          | Default |
| ------------------- | -------------------- | ------- |
| `VITE_API_BASE_URL` | Backend API base URL | `/api`  |

## API

`POST /api/certificates`

```json
{
  "participantName": "Jane Doe",
  "role": "Software Intern",
  "eventOrInternship": "Summer Internship 2026",
  "date": "2026-05-08",
  "format": "both"
}
```

`GET /api/certificates?page=1&limit=10&searchTerm=Jane&searchField=name`

Returns certificate records with pagination metadata.

`GET /api/certificates/:id`

Returns one certificate record.

`GET /api/certificates/:id/download?format=pdf`

Downloads a PDF or PNG certificate file.

## Frontend

The React admin panel includes:

- Dashboard route with generation and records side by side
- Certificate generation form with client-side validation
- Searchable, paginated certificate table
- PDF and PNG download actions based on the generated format
- Error boundary and API error display

## Logging And Monitoring

The backend logger writes structured JSON lines to `LOG_FILE_PATH` and mirrors messages to the console. In production, forward the log file or container stdout to your platform log collector. Recommended operational checks:

- `/health` uptime probe
- API error rate by route
- certificate generation latency
- download latency
- MongoDB connection errors
- disk usage for `CERTIFICATE_STORAGE_PATH`

## Deployment

### Render Backend

Use the checked-in `render.yaml` Blueprint or create a Web Service from GitHub:

- Repository: `shivendra9838/CertificateGenrator`
- Runtime: Node
- Build command: `npm install --include=dev && npm run build --workspace=backend`
- Start command: `npm run start --workspace=backend`
- Health check path: `/health`

Set these Render environment variables:

| Variable                   | Value                                        |
| -------------------------- | -------------------------------------------- |
| `NODE_ENV`                 | `production`                                 |
| `MONGODB_URI`              | your MongoDB Atlas connection string         |
| `MONGODB_DB_NAME`          | `certificate_generator`                      |
| `JWT_SECRET`               | a long random secret                         |
| `CERTIFICATE_SECRET_KEY`   | a long random secret                         |
| `CERTIFICATE_STORAGE_PATH` | `./certificates`                             |
| `CORS_ORIGIN`              | your Vercel frontend URL                     |
| `LOG_LEVEL`                | `info`                                       |
| `LOG_FILE_PATH`            | `./logs/app.log`                             |

After deploy, the API base URL will look like:

```text
https://certificate-generator-api.onrender.com/api
```

### Vercel Frontend

Use the checked-in `vercel.json` or import the GitHub repo into Vercel:

- Framework preset: Vite
- Build command: `npm run build --workspace=frontend`
- Output directory: `frontend/dist`
- Install command: `npm install`

Set this Vercel environment variable:

| Variable            | Value                                  |
| ------------------- | -------------------------------------- |
| `VITE_API_BASE_URL` | `https://your-render-app.onrender.com/api` |

After Vercel gives you the frontend URL, update Render `CORS_ORIGIN` to that exact URL and redeploy the backend.

### Docker

Build local containers:

```bash
docker compose build
docker compose up
```

For production:

1. Set `backend/.env.production` values for MongoDB Atlas/Atylas, CORS, storage, and logging.
2. Set `frontend/.env.production` to the public backend API URL before building the frontend image.
3. Use persistent storage for generated certificates and logs.
4. Serve the frontend over HTTPS and restrict `CORS_ORIGIN` to that domain.

## Validation

Current validation commands:

```bash
npm run build --workspace=backend
npm test --workspace=backend -- --runInBand
npm run build --workspace=frontend
npm test --workspace=frontend -- --runInBand
```
