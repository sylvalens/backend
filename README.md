# SylvaLens - Backend

The core API layer for the SylvaLens platform, built with **NestJS** and **TypeORM**.

## Features
- **Spatial Queries:** Optimized PostGIS routing for administrative and BD Forêt geometry.
- **Microservice Proxy:** Integrates with the FastAPI raster service for heavy geospatial computation.
- **Authentication:** JWT-based auth for user accounts and map state persistence.
- **OpenAPI / Swagger:** Automatically generates API contracts for frontend consumption.

## Development Setup

### Prerequisites
- Node.js (v20+)
- pnpm
- A running PostGIS database and Raster service (use the `infra` repository's local compose stack).

### 1. Configuration
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Ensure `DB_PORT=5433` if you are using the default local infra stack.

### 2. Run Development Server
```bash
pnpm install
pnpm run start:dev
```
The API will be available at `http://localhost:4000`.
Swagger documentation is available at `http://localhost:4000/api/docs`.

## Production Build
See the `sylvalens/infra` repository for production deployment orchestration.