import pandas as pd
from fastapi import FastAPI, UploadFile
from fraudkit import FraudDetectionModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://bmcallaway.github.io",
]

model = FraudDetectionModel()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/fraudprob")
async def root(file : UploadFile):
    df = pd.read_csv(file.file)
    fv = model.fraud_values(df)
    return {"Fraud Values": fv,
            "Length": len(fv)}