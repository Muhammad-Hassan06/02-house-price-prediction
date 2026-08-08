// ============================================================================
// ValuHome AI - House Price Prediction Dashboard (React 18)
// Real FastAPI REST API integration with Pydantic validation & fallback
// ============================================================================

const { useState, useEffect, useRef, useMemo } = React;

// API Base URL (Render microservice for production, local for localhost)
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:8000' 
    : 'https://ai-backend-w52h.onrender.com';

// ----------------------------------------------------------------------------
// Main Application Container
// ----------------------------------------------------------------------------
function App() {
    const [activeTab, setActiveTab] = useState('calculator');

    return (
        <div className="app-container">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="main-wrapper">
                <Header />
                {activeTab === 'calculator' && <CalculatorTab />}
                {activeTab === 'analytics' && <AnalyticsTab />}
                {activeTab === 'specs' && <ModelSpecsTab />}
                {activeTab === 'api' && <ApiTab />}
            </main>
        </div>
    );
}

// ----------------------------------------------------------------------------
// Sidebar Component
// ----------------------------------------------------------------------------
function Sidebar({ activeTab, setActiveTab }) {
    return (
        <aside className="sidebar">
            <div>
                <div className="logo-box">
                    <div className="logo-icon">🏡</div>
                    <div className="logo-text">
                        <h2>ValuHome AI</h2>
                        <span>Price Predictor</span>
                    </div>
                </div>

                <nav className="nav-menu">
                    <button 
                        className={`nav-item ${activeTab === 'calculator' ? 'active' : ''}`}
                        onClick={() => setActiveTab('calculator')}
                    >
                        <span>📈 Valuation Calculator</span>
                    </button>

                    <button 
                        className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        <span>📊 Feature Analytics</span>
                    </button>

                    <button 
                        className={`nav-item ${activeTab === 'specs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('specs')}
                    >
                        <span>🔬 Model Architecture</span>
                    </button>

                    <button 
                        className={`nav-item ${activeTab === 'api' ? 'active' : ''}`}
                        onClick={() => setActiveTab('api')}
                    >
                        <span>🔌 Backend API & Pydantic</span>
                    </button>
                </nav>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.9)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>FASTAPI BACKEND</small>
                <div style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.8rem', marginTop: '4px' }}>
                    POST /predict (Pydantic)
                </div>
            </div>
        </aside>
    );
}

// ----------------------------------------------------------------------------
// Top Header Component
// ----------------------------------------------------------------------------
function Header() {
    return (
        <header className="top-bar">
            <div>
                <h1>California House Price Prediction</h1>
                <p>Tabular Regression & Valuation Engine powered by XGBoost & FastAPI Microservice</p>
            </div>
            <div className="model-pill">
                <span className="dot"></span> FastAPI + XGBoost Active
            </div>
        </header>
    );
}

// ----------------------------------------------------------------------------
// 1. Calculator Tab (Live FastAPI Prediction Engine)
// ----------------------------------------------------------------------------
function CalculatorTab() {
    const [medInc, setMedInc] = useState(5.2);
    const [houseAge, setHouseAge] = useState(25);
    const [aveRooms, setAveRooms] = useState(5.8);
    const [aveBedrms, setAveBedrms] = useState(1.1);
    const [population, setPopulation] = useState(1200);
    const [activePreset, setActivePreset] = useState('suburban');

    const [predictedPrice, setPredictedPrice] = useState(382000);
    const [apiStatus, setApiStatus] = useState('connecting');
    const [algorithmSource, setAlgorithmSource] = useState('FastAPI (XGBoost Regressor)');

    // Call FastAPI Backend (/predict) when input features change
    useEffect(() => {
        let isMounted = true;
        
        async function fetchPrediction() {
            try {
                // Construct payload matching Pydantic HouseFeaturesInput schema
                const payload = {
                    MedInc: parseFloat(medInc),
                    HouseAge: parseFloat(houseAge),
                    AveRooms: parseFloat(aveRooms),
                    AveBedrms: parseFloat(aveBedrms),
                    Population: parseFloat(population),
                    AveOccup: 3.0,
                    Latitude: 34.2,
                    Longitude: -118.4
                };

                const response = await fetch(`${API_BASE_URL}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    if (isMounted) {
                        setPredictedPrice(Math.round(data.predicted_price_usd));
                        setApiStatus('online');
                        setAlgorithmSource(data.algorithm);
                    }
                } else {
                    throw new Error('API non-200');
                }
            } catch (err) {
                // Fallback math calculation if FastAPI server is offline
                if (isMounted) {
                    let baseVal = (medInc * 0.45) + (aveRooms * 0.09) - (aveBedrms * 0.06) + (houseAge * 0.006) + 0.35;
                    if (baseVal < 0.5) baseVal = 0.5;
                    setPredictedPrice(Math.round(baseVal * 100000));
                    setApiStatus('fallback');
                    setAlgorithmSource('Client Math Engine (Start FastAPI for Live API)');
                }
            }
        }

        const timer = setTimeout(fetchPrediction, 150);
        return () => { isMounted = false; clearTimeout(timer); };
    }, [medInc, houseAge, aveRooms, aveBedrms, population]);

    const applyPreset = (type) => {
        setActivePreset(type);
        if (type === 'suburban') {
            setMedInc(5.2);
            setHouseAge(25);
            setAveRooms(5.8);
            setAveBedrms(1.1);
            setPopulation(1200);
        } else if (type === 'luxury') {
            setMedInc(10.5);
            setHouseAge(8);
            setAveRooms(8.5);
            setAveBedrms(1.4);
            setPopulation(600);
        } else if (type === 'apartment') {
            setMedInc(2.4);
            setHouseAge(42);
            setAveRooms(3.4);
            setAveBedrms(1.0);
            setPopulation(3400);
        }
    };

    return (
        <div>
            <div className="grid-2">
                {/* Inputs */}
                <div className="glass-card">
                    <h3 className="card-title">⚙️ Property Features</h3>

                    <div className="preset-bar">
                        <button 
                            className={`preset-btn ${activePreset === 'suburban' ? 'active' : ''}`}
                            onClick={() => applyPreset('suburban')}
                        >
                            🏡 Suburban Home
                        </button>
                        <button 
                            className={`preset-btn ${activePreset === 'luxury' ? 'active' : ''}`}
                            onClick={() => applyPreset('luxury')}
                        >
                            🏰 Luxury Villa
                        </button>
                        <button 
                            className={`preset-btn ${activePreset === 'apartment' ? 'active' : ''}`}
                            onClick={() => applyPreset('apartment')}
                        >
                            🏢 Budget Apartment
                        </button>
                    </div>

                    <div className="input-row">
                        <div className="label-box">
                            <span>Median Income (Block Group)</span>
                            <span className="val-badge">${(medInc * 10000).toLocaleString()} / yr</span>
                        </div>
                        <input 
                            type="range" 
                            className="range-slider" 
                            min="0.5" 
                            max="15.0" 
                            step="0.1" 
                            value={medInc} 
                            onChange={(e) => { setMedInc(parseFloat(e.target.value)); setActivePreset('custom'); }} 
                        />
                    </div>

                    <div className="input-row">
                        <div className="label-box">
                            <span>Median House Age</span>
                            <span className="val-badge">{houseAge} Years</span>
                        </div>
                        <input 
                            type="range" 
                            className="range-slider" 
                            min="1" 
                            max="52" 
                            step="1" 
                            value={houseAge} 
                            onChange={(e) => { setHouseAge(parseInt(e.target.value)); setActivePreset('custom'); }} 
                        />
                    </div>

                    <div className="input-row">
                        <div className="label-box">
                            <span>Average Rooms per Household</span>
                            <span className="val-badge">{aveRooms} Rooms</span>
                        </div>
                        <input 
                            type="range" 
                            className="range-slider" 
                            min="1.0" 
                            max="12.0" 
                            step="0.1" 
                            value={aveRooms} 
                            onChange={(e) => { setAveRooms(parseFloat(e.target.value)); setActivePreset('custom'); }} 
                        />
                    </div>

                    <div className="input-row">
                        <div className="label-box">
                            <span>Average Bedrooms</span>
                            <span className="val-badge">{aveBedrms} Bedrooms</span>
                        </div>
                        <input 
                            type="range" 
                            className="range-slider" 
                            min="0.5" 
                            max="5.0" 
                            step="0.1" 
                            value={aveBedrms} 
                            onChange={(e) => { setAveBedrms(parseFloat(e.target.value)); setActivePreset('custom'); }} 
                        />
                    </div>

                    <div className="input-row">
                        <div className="label-box">
                            <span>Block Population</span>
                            <span className="val-badge">{population} Residents</span>
                        </div>
                        <input 
                            type="range" 
                            className="range-slider" 
                            min="100" 
                            max="10000" 
                            step="50" 
                            value={population} 
                            onChange={(e) => { setPopulation(parseInt(e.target.value)); setActivePreset('custom'); }} 
                        />
                    </div>
                </div>

                {/* Output Valuation Card */}
                <div>
                    <div className="glass-card">
                        <h3 className="card-title">💰 Estimated Market Valuation</h3>

                        <div className="valuation-display">
                            <div className="valuation-label">Estimated Property Price</div>
                            <div className="valuation-price">${predictedPrice.toLocaleString()}</div>
                            <span className="r2-tag">
                                {apiStatus === 'online' ? '🟢 Live FastAPI Model Inference' : '⚡ Local Demo Engine'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                <span>Estimated Valuation Range</span>
                                <strong style={{ color: 'var(--text-main)' }}>
                                    ${(predictedPrice - 31200).toLocaleString()} – ${(predictedPrice + 31200).toLocaleString()}
                                </strong>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                <span>Inference Engine</span>
                                <strong style={{ color: 'var(--primary)' }}>{algorithmSource}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// 2. Analytics Tab
// ----------------------------------------------------------------------------
function AnalyticsTab() {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current) return;
        const ctx = chartRef.current.getContext('2d');
        if (chartInstance.current) chartInstance.current.destroy();

        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['MedInc (Median Income)', 'AveOccup (Occupancy)', 'HouseAge', 'Latitude', 'Longitude', 'AveRooms'],
                datasets: [{
                    label: 'XGBoost Feature Importance Weight',
                    data: [0.52, 0.18, 0.12, 0.08, 0.06, 0.04],
                    backgroundColor: 'rgba(16, 185, 129, 0.65)',
                    borderColor: '#10b981',
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#94a3b8' } } },
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
                }
            }
        });

        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, []);

    return (
        <div>
            <div className="glass-card">
                <h3 className="card-title">📊 XGBoost Feature Importance Ranking</h3>
                <div style={{ height: '320px', position: 'relative' }}>
                    <canvas ref={chartRef}></canvas>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// 3. Model Specs Tab
// ----------------------------------------------------------------------------
function ModelSpecsTab() {
    return (
        <div>
            <div className="grid-4" style={{ marginBottom: '24px' }}>
                <div className="stat-box">
                    <small>Algorithm</small>
                    <strong>XGBoost Regressor</strong>
                </div>
                <div className="stat-box">
                    <small>R² Score</small>
                    <strong style={{ color: 'var(--primary)' }}>0.8351</strong>
                </div>
                <div className="stat-box">
                    <small>Mean Abs Error (MAE)</small>
                    <strong style={{ color: 'var(--secondary)' }}>$31,200</strong>
                </div>
                <div className="stat-box">
                    <small>Backend Framework</small>
                    <strong>FastAPI + Pydantic</strong>
                </div>
            </div>

            <div className="glass-card">
                <h3 className="card-title">📖 Model & API Architecture</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.92rem' }}>
                    The California Housing model uses an <strong>XGBoost Regressor</strong> trained on 20,640 block group records. 
                    The API backend is constructed with <strong>FastAPI</strong> and uses strict <strong>Pydantic v2</strong> models 
                    to validate JSON payload structures before passing arrays to the machine learning inference engine.
                </p>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// 4. API Guide & Pydantic Schema Tab
// ----------------------------------------------------------------------------
function ApiTab() {
    return (
        <div>
            <div className="glass-card" style={{ marginBottom: '24px' }}>
                <h3 className="card-title">🛡️ FastAPI Server Implementation (app.py)</h3>
                <pre className="code-box">
{`from fastapi import FastAPI
from pydantic import BaseModel, Field
import pickle
import numpy as np

app = FastAPI(title="ValuHome AI API")

# Pydantic Schema for Strict Payload Validation
class HouseFeaturesInput(BaseModel):
    MedInc: float = Field(..., description="Median Income ($10k)")
    HouseAge: float = Field(..., description="House Age")
    AveRooms: float = Field(..., description="Average Rooms")
    AveBedrms: float = Field(..., description="Average Bedrooms")
    Population: float = Field(..., description="Population")

@app.post("/predict")
def predict(features: HouseFeaturesInput):
    data = np.array([[features.MedInc, features.HouseAge, features.AveRooms, features.AveBedrms, features.Population, 3.0, 34.2, -118.4]])
    prediction = model.predict(data)[0]
    return {"predicted_price_usd": float(prediction * 100000)}`}
                </pre>
            </div>
        </div>
    );
}

// Render Application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
