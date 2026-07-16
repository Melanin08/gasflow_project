# GasFlow Project Structure

GasFlow is split into a React client and a Flask server for a customer gas ordering and delivery tracking flow in Zanzibar.

## Project Structure

```text
client/
  assets/              Static client media, including payment QR images
  src/
    components/        Shared UI components
    data/              Frontend seed data and constants
    pages/             Page-level route/view wrappers
    utils/             Frontend helper logic and tests
    App.jsx            Main application state and view orchestration
    main.jsx           React bootstrap
    styles.css         Client styles
  index.html           Vite HTML entry

server/
  app.py               Flask application entry
  src/
    config/            Server configuration
    controllers/       Request handlers
    middleware/        Request/response middleware
    models/            Data models
    routes/            API route modules
    services/          Business services
    sockets/           Realtime socket handlers
    uploads/           Uploaded files
    utils/             Server helpers
    validations/       Request validation

docs/                  Project documentation
```

## Database

No local database folder is included right now. When deploying, configure the Flask server with a PostgreSQL connection string such as `DATABASE_URL`.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

See `requirements.txt` for the same setup checklist.

## Installation

Install all frontend dependencies:

```bash
npm.cmd install
```

For a clean install from the lockfile:

```bash
npm.cmd ci
```

## Run The App On Port 5000

Start the React development server:

```bash
npm.cmd run dev
```

Open `http://127.0.0.1:5000/`.

Start the Flask server separately. It defaults to `http://127.0.0.1:5001/` so the client can keep port `5000`.

```bash
npm.cmd run server
```

Build the production app:

```bash
npm.cmd run build
```

Preview the built app:

```bash
npm.cmd run preview
```

Vite dev and Vite preview are configured to use local port `5000`.
