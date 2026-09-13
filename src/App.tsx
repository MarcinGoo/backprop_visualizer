import React, { useState, useEffect, useMemo } from 'react';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import LeftPanel from './components/LeftPanel';
import StepByStepPanel from './components/StepByStepPanel';
import { buildGraph } from './engine/GraphBuilder';
import type { Graph } from './engine/GraphBuilder';
import { forwardPass, backwardPass } from './engine/ComputeEngine';
import styles from './App.module.css';
import { Calculator, Zap, FileText, Share2, ListTree } from 'lucide-react';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'graph' | 'trace' | 'stepbystep'>('graph');
  const [expression, setExpression] = useState('x1 * x2 + sin(x1)');
  const [graph, setGraph] = useState<Graph | null>(null);
  const [variables, setVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, number | string>>({
    x1: 2,
    x2: 3,
  });
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const g = buildGraph(expression);
      setGraph(g);
      setVariables(g.variables);
      setError(null);
      
      // Initialize new variables with 0 if not present
      setVariableValues(prev => {
        const newVals = { ...prev };
        g.variables.forEach(v => {
          if (newVals[v] === undefined) newVals[v] = 0;
        });
        return newVals;
      });
      setSelectedNodeId(null);
    } catch (e: any) {
      // Ignore syntax errors during typing, display error only after clicking Apply
    }
  }, [expression]);

  const handleApply = () => {
    try {
      const g = buildGraph(expression);
      setGraph(g);
      setVariables(g.variables);
      
      const parsedValues: Record<string, number> = {};
      for (const [k, v] of Object.entries(variableValues)) {
        const val = typeof v === 'string' ? parseFloat(v) : v;
        parsedValues[k] = isNaN(val) ? 0 : val;
      }
      const computedGraph = forwardPass(g, parsedValues);
      const backwardGraph = backwardPass(computedGraph);
      setGraph(backwardGraph);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError('Expression or calculation error: ' + (e.message || ''));
    }
  };

  const selectedNode = useMemo(() => {
    if (!graph || !selectedNodeId) return null;
    return graph.nodes.find(n => n.id === selectedNodeId) || null;
  }, [graph, selectedNodeId]);

  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => setViewMode('graph')} style={{ cursor: 'pointer' }}>
          <Zap className={styles.icon} />
          <h1>Backprop Visualizer</h1>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.inputGroup}>
            <label>Function f = </label>
            <input 
              type="text" 
              value={expression} 
              onChange={e => setExpression(e.target.value)} 
              placeholder="np. x1 * x2 + sin(x1)"
              className={styles.funcInput}
            />
          </div>
          
          <div className={styles.varsGroup}>
            {variables.map(v => (
              <div key={v} className={styles.varInputGroup}>
                <label>{v} =</label>
                <input 
                  type="number" 
                  value={variableValues[v] ?? 0} 
                  onChange={e => setVariableValues({...variableValues, [v]: e.target.value})}
                  className={styles.varInput}
                />
              </div>
            ))}
          </div>
          
          <div className={styles.actions}>
            <button onClick={handleApply} className={styles.btnApply}>
              <Calculator size={16} /> Apply
            </button>
            <button 
              onClick={() => setViewMode('graph')} 
              className={`${styles.btnToggleView} ${viewMode === 'graph' ? styles.activeView : ''}`}
            >
              <Share2 size={16} /> Graf
            </button>
            <button 
              onClick={() => setViewMode('trace')} 
              className={`${styles.btnToggleView} ${viewMode === 'trace' ? styles.activeView : ''}`}
            >
              <FileText size={16} /> Global Trace
            </button>
            <button 
              onClick={() => setViewMode('stepbystep')} 
              className={`${styles.btnToggleView} ${viewMode === 'stepbystep' ? styles.activeView : ''}`}
            >
              <ListTree size={16} /> Step-by-Step
            </button>
          </div>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <main className={styles.mainContent}>
        {viewMode === 'trace' && <LeftPanel graph={graph} />}
        {viewMode === 'stepbystep' && <StepByStepPanel graph={graph} />}
        {viewMode === 'graph' && (
          <>
            <div className={styles.canvasContainer}>
              <GraphCanvas 
                graph={graph} 
                onNodeClick={setSelectedNodeId} 
                selectedNodeId={selectedNodeId} 
              />
            </div>
            <Sidebar node={selectedNode} onClose={() => setSelectedNodeId(null)} />
          </>
        )}
      </main>
    </div>
  );
};

export default App;
