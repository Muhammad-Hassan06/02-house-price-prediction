import os
import pickle
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np

app = FastAPI(
    title="ValuHome AI - House Price Prediction API",
    description="REST API service serving XGBoost regression model for California housing price predictions."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "boston_house_price_model.pkl")
model = None

@app.on_event("startup")
def load_model():
    global model
    try:
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, "rb") as f:
                model = pickle.load(f)
            print("✅ Successfully loaded model: boston_house_price_model.pkl")
        else:
            print(f"⚠️ Model file not found at {MODEL_PATH}")
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")

class HouseFeaturesInput(BaseModel):
    MedInc: float = Field(..., example=5.2, description="Median Income in block group ($10,000s)")
    HouseAge: float = Field(..., example=25.0, description="Median house age in years")
    AveRooms: float = Field(..., example=5.8, description="Average rooms per household")
    AveBedrms: float = Field(..., example=1.1, description="Average bedrooms per household")
    Population: float = Field(..., example=1200.0, description="Block group population")
    AveOccup: float = Field(default=3.0, example=3.0, description="Average household occupancy")
    Latitude: float = Field(default=34.2, example=34.2, description="Latitude location coordinate")
    Longitude: float = Field(default=-118.4, example=-118.4, description="Longitude location coordinate")

class PredictionOutput(BaseModel):
    status: str
    predicted_price_usd: float
    predicted_value_100k: float
    algorithm: str

@app.get("/")
def root():
    return {
        "service": "ValuHome AI House Price Prediction API",
        "status": "online",
        "model_loaded": model is not None,
        "docs_url": "/docs"
    }

@app.post("/predict", response_model=PredictionOutput)
def predict_house_price(features: HouseFeaturesInput):
    global model
    if model is None:
        base_val = (features.MedInc * 0.45) + (features.AveRooms * 0.09) - (features.AveBedrms * 0.06) + (features.HouseAge * 0.006) + 0.35
        price_usd = round(max(base_val, 0.5) * 100000, 2)
        return PredictionOutput(
            status="fallback_demo",
            predicted_price_usd=price_usd,
            predicted_value_100k=round(price_usd / 100000, 4),
            algorithm="Heuristic Approximation (Model file loading)"
        )

    try:
        input_data = np.array([[
            features.MedInc,
            features.HouseAge,
            features.AveRooms,
            features.AveBedrms,
            features.Population,
            features.AveOccup,
            features.Latitude,
            features.Longitude
        ]])

        prediction = float(model.predict(input_data)[0])
        predicted_usd = float(prediction * 100000)
        if predicted_usd < 50000:
            predicted_usd = 50000.0

        return PredictionOutput(
            status="success",
            predicted_price_usd=round(predicted_usd, 2),
            predicted_value_100k=round(prediction, 4),
            algorithm="XGBoost Regressor (boston_house_price_model.pkl)"
        )
    except Exception as e:
        base_val = (features.MedInc * 0.45) + (features.AveRooms * 0.09) - (features.AveBedrms * 0.06) + 0.35
        price_usd = round(max(base_val, 0.5) * 100000, 2)
        return PredictionOutput(
            status="fallback_demo",
            predicted_price_usd=price_usd,
            predicted_value_100k=round(price_usd / 100000, 4),
            algorithm=f"Heuristic Fallback: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
