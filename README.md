# Credit Card Fraud Detection

A machine learning project that scores credit card transactions by fraud probability and exposes the results through a FastAPI backend and a React frontend.

Live demo: [bmcallaway.github.io/CreditCardFraudDetection](https://bmcallaway.github.io/CreditCardFraudDetection/)

## Overview

This project uses a logistic regression model trained on transaction data to estimate fraud risk for each transaction row. The application supports:

- manual entry of transaction feature values
- generated sample transaction rows for quick testing
- CSV upload and batch scoring
- fraud probability results returned from the backend and displayed in the UI

The frontend is built with React + Vite and the backend is built with FastAPI.

## Tech Stack

- Machine learning: scikit-learn, pandas
- Backend API: FastAPI, uvicorn
- Frontend: React, Vite
- Language: Python, JavaScript

## Project Structure

```text
.
├── main.py               # FastAPI app and API route definitions
├── fraudkit.py           # Model training and fraud scoring logic
├── card_transdata.csv    # Training dataset
├── requirements.txt      # Python dependencies
└── frontend/             # React + Vite frontend
```

## How It Works

1. The backend loads `card_transdata.csv` on startup.
2. A logistic regression model is trained using the transaction features.
3. The `/fraudprob` endpoint accepts an uploaded CSV file.
4. The backend scores each row and returns fraud probabilities.
5. The frontend displays the returned results and highlights higher-risk rows.

## Backend Setup

From the project root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

The API will be available locally at:

```text
http://127.0.0.1:8000
```

Main scoring endpoint:

```text
POST /fraudprob
```

## Frontend Setup

From the `frontend` directory:

```bash
npm install
npm run dev
```

The frontend will run locally at:

```text
http://localhost:5173
```

## Running The Full App Locally

1. Start the FastAPI backend from the project root.
2. Start the React frontend from `frontend/`.
3. Open `http://localhost:5173`.
4. Enter transaction rows manually, generate sample rows, or upload a CSV for scoring.

## CSV Input Format

The backend expects these seven feature columns:

- `distance_from_home`
- `distance_from_last_transaction`
- `ratio_to_median_purchase_price`
- `repeat_retailer`
- `used_chip`
- `used_pin_number`
- `online_order`

## Notes

- The backend currently trains the model at startup.
- CORS is configured for local frontend development and the GitHub Pages frontend.
- The deployed frontend is static; backend deployment should expose the FastAPI app over HTTPS for production use.
