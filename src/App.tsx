import React, { useState, useEffect, useMemo } from 'react';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import LeftPanel from './components/LeftPanel';
import { buildGraph } from './engine/GraphBuilder';
import type { Graph } from './engine/GraphBuilder';
import { forwardPass, backwardPass } from './engine/ComputeEngine';
import styles from './App.module.css';
import { Calculator, Zap, FileText, Share2 } from 'lucide-react';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'graph' | 'trace'>('graph');
  const [expression, setExpression] = useState('x1 * x2 + sin(x1)');
  const [graph, setGraph] = useState<Graph | null>(null);
  const [variables, setVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, number>>({
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
      setError('Błąd w wyrażeniu: ' + e.message);
    }
  }, [expression]);

  const handleApply = () => {
    if (!graph) return;
    try {
      const computedGraph = forwardPass(graph, variableValues);
      const backwardGraph = backwardPass(computedGraph);
      setGraph(backwardGraph);
    } catch (e) {
      console.error(e);
      setError('Błąd podczas obliczeń');
    }
  };

  const selectedNode = useMemo(() => {
    if (!graph || !selectedNodeId) return null;
    return graph.nodes.find(n => n.id === selectedNodeId) || null;
  }, [graph, selectedNodeId]);

  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Zap className={styles.icon} />
          <h1>Backprop Visualizer</h1>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.inputGroup}>
            <label>Funkcja f = </label>
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
                  value={variableValues[v]} 
                  onChange={e => setVariableValues({...variableValues, [v]: parseFloat(e.target.value) || 0})}
                  className={styles.varInput}
                />
              </div>
            ))}
          </div>
          
          <div className={styles.actions}>
            <button 
              onClick={() => setViewMode(prev => prev === 'graph' ? 'trace' : 'graph')} 
              className={styles.btnToggleView}
            >
              {viewMode === 'graph' ? <><FileText size={16} /> Global Trace</> : <><Share2 size={16} /> Graf</>}
            </button>
            <button onClick={handleApply} className={styles.btnApply}>
              <Calculator size={16} /> Apply
            </button>
          </div>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <main className={styles.mainContent}>
        {viewMode === 'trace' ? (
          <LeftPanel graph={graph} />
        ) : (
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
