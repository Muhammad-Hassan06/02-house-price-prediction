"""
ValuHome AI - House Price Prediction FastAPI Microservice
Production-grade REST API with Pydantic validation & CORS support for Vercel/Render deployment.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pickle
import numpy as np
import os

# Initialize FastAPI App
app = FastAPI(
    title="ValuHome AI - House Price Prediction API",
    description="REST API service serving XGBoost regression model for California housing price predictions.",
    version="1.0.0"
)

# Enable CORS for frontend cross-origin requests (Vercel & localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model path resolution
MODEL_PATH = os.path.join(os.path.dirname(__file__), "boston_house_price_model.pkl")

# Global model variable
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

# Pydantic Schema for Strict Input Data Validation
class HouseFeaturesInput(BaseModel):
    MedInc: float = Field(..., example=5.2, description="Median Income in block group ($10,000s)")
    HouseAge: float = Field(..., example=25.0, description="Median house age in years")
    AveRooms: float = Field(..., example=5.8, description="Average rooms per household")
    AveBedrms: float = Field(..., example=1.1, description="Average bedrooms per household")
    Population: float = Field(..., example=1200.0, description="Block group population")
    AveOccup: float = Field(default=3.0, example=3.0, description="Average household occupancy")
    Latitude: float = Field(default=34.2, example=34.2, description="Latitude location coordinate")
    Longitude: float = Field(default=-118.4, example=-118.4, description="Longitude location coordinate")

# Pydantic Schema for Structured API Output
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
    if model is None:
        # Fallback approximation if model load fails in demo mode
        base_val = (features.MedInc * 0.45) + (features.AveRooms * 0.09) - (features.AveBedrms * 0.06) + (features.HouseAge * 0.006) + 0.35
        price_usd = round(max(base_val, 0.5) * 100000, 2)
        return PredictionOutput(
            status="fallback_demo",
            predicted_price_usd=price_usd,
            predicted_value_100k=round(price_usd / 100000, 4),
            algorithm="Heuristic Approximation (Model file loading)"
        )

    try:
        # Construct feature array matching trained order:
        # [MedInc, HouseAge, AveRooms, AveBedrms, Population, AveOccup, Latitude, Longitude]
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

        # Execute model prediction
        prediction = model.predict(input_data)[0]
        
        # Convert prediction ($100k units) to USD
        predicted_usd = float(prediction * 100000)
        if predicted_usd < 50000:
            predicted_usd = 50000.0

        return PredictionOutput(
            status="success",
            predicted_price_usd=round(predicted_usd, 2),
            predicted_value_100k=round(float(prediction), 4),
            algorithm="XGBoost Regressor (boston_house_price_model.pkl)"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction execution failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
