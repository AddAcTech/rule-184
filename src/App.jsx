import React from 'react'

import { useState } from 'react';
import TrafficSimulation from './components/TrafficSimulation';
import './App.css';

function App() {
  const [simulationType, setSimulationType] = useState('single-lane');
  const [density, setDensity] = useState(0.3);
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState(0);

  const handleSimulationTypeChange = (type) => {
    setSimulationType(type);
    setIsRunning(false);
    setSteps(0);
  };

  return (
    <div className="app">
      <h1>Rule 184 - Simulación de tráfico (Aguilar Chavez Alexis Daniel)</h1>
      
      <div className="controls">
        <div className="simulation-types">
          <button 
            className={simulationType === 'single-lane' ? 'active' : ''}
            onClick={() => handleSimulationTypeChange('single-lane')}
          >
            Carril simple
          </button>
          <button 
            className={simulationType === 'two-way' ? 'active' : ''}
            onClick={() => handleSimulationTypeChange('two-way')}
          >
            Carril bidireccional
          </button>
          <button 
            className={simulationType === 'intersection' ? 'active' : ''}
            onClick={() => handleSimulationTypeChange('intersection')}
          >
            Intersección
          </button>
        </div>
        
        <div className="density-control">
          <label>
            Densidad: {Math.round(density * 100)}%
            <input 
              type="range" 
              min="0.1" 
              max="0.9" 
              step="0.1" 
              value={density} 
              onChange={(e) => setDensity(parseFloat(e.target.value))}
            />
          </label>
        </div>
        
        <div className="simulation-controls">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={isRunning ? 'active' : ''}
          >
            {isRunning ? '⏸ Pausar' : '▶ Iniciar'}
          </button>
          <button 
            onClick={() => {
              setSteps(prev => prev + 1);
              if (isRunning) setIsRunning(false);
            }}
            disabled={isRunning}
            title="Avanzar un paso (espacio)"
          >
            ⏭ Paso
          </button>
          <div className="step-counter">
            <span>Generación: {steps}</span>
            <small>Haz clic en la simulación para avanzar manualmente</small>
          </div>
        </div>
      </div>
      
      <div className="simulation-container">
        <TrafficSimulation 
          type={simulationType}
          density={density}
          isRunning={isRunning}
          onStep={() => setSteps(prev => prev + 1)}
          steps={steps}
        />
      </div>
    </div>
  );
}

export default App