# Portfolio Test Site

Demo project to showcase frontend (HTML + Tailwind with dark/light mode), backend (Flask API), and automated tests (pytest, Selenium, Cypress). Ideal for CV to demonstrate testing skills.

## Project Structure

```
portfolio-test-site/
├─ backend/          # Flask API + backend tests
├─ frontend/         # Static HTML + Tailwind + app.js
├─ tests/            # Selenium UI tests
├─ cypress/          # Cypress e2e tests
├─ package.json      # NPM scripts for serve and tests
└─ README.md         # This file
```

## Requirements

* Python 3.10+
* Node.js 16+ (for Cypress)
* Chrome (for Selenium)

## Local Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export ALLOWED_ORIGINS='http://localhost:8000'   # Windows PowerShell: $env:ALLOWED_ORIGINS='http://localhost:8000'
python app.py
```

### Frontend

```bash
cd frontend
python -m http.server 8000
```

Open in browser: [http://localhost:8000/index.html](http://localhost:8000/index.html)

### Tests

* Backend: `npm run backend:test`
* Selenium UI: `npm run selenium:test` (ensure FRONTEND_URL is set)
* Cypress: `npm run cypress:run` or `npm run cypress:open`

### Quick frontend serve

```bash
npm run serve
```

## Production Notes

* Update `meta[name="api-base"]` in `index.html` to production backend URL.
* Set `ALLOWED_ORIGINS` in backend to the frontend domain.
* Make sure frontend and backend are served via HTTPS.
* CI badges and test results can be linked from GitHub Actions or other CI.

## NPM Scripts

* `npm run serve` — serve frontend locally
* `npm run backend:test` — run backend tests
* `npm run selenium:test` — run Selenium UI tests
* `npm run cypress:run` / `npm run cypress:open` — run Cypress e2e tests
