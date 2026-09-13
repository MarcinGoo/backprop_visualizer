import React from 'react';
import type { Graph } from '../engine/GraphBuilder';
import { InlineMath } from 'react-katex';
import styles from './LeftPanel.module.css';

interface LeftPanelProps {
  graph: Graph | null;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ graph }) => {
  if (!graph) return null;

  return (
    <div className={styles.panel}>
      <h3>Zapis Matematyczny (Global Trace)</h3>
      <div className={styles.scrollArea}>
      
        {graph.nodes.map((node) => {
          const { data } = node;
          const hasBackprop = data.globalGradient !== null;
          
          return (
            <div key={node.id} className={styles.nodeRow}>
              <div className={styles.nodeHeader}>
                Węzeł: <InlineMath math={data.vName || ''} /> {data.label !== data.vName && <span style={{fontSize: '0.8em', color: '#94a3b8'}}>({data.label})</span>}
              </div>
              
              <div className={styles.nodeBody}>
                {/* FORWARD PASS */}
                <div className={styles.passBox}>
                  <div className={styles.passTitle}>Forward Pass</div>
                  <div className={styles.mathLine}>
                    <InlineMath math={`${data.vName} = ${data.forwardEquation}`} />
                  </div>
                  {data.value !== null && (
                    <div className={styles.mathLine}>
                      <span className={styles.valBlue}>Wynik (f): {data.value.toFixed(4)}</span>
                    </div>
                  )}
                </div>
                
                {/* BACKWARD PASS */}
                <div className={styles.passBox}>
                  <div className={styles.passTitle}>Backward Pass (Step-by-Step)</div>
                  {!hasBackprop ? (
                    <p className={styles.muted}>Brak obliczeń (uruchom Backward Pass).</p>
                  ) : (!data.gradientContributions || data.gradientContributions.length === 0) ? (
                    <div className={styles.mathLine}>
                      <InlineMath math={`${data.vName}' = \\frac{\\partial L}{\\partial ${data.vName}} = 1`} />
                    </div>
                  ) : (
                    <>
                      <div className={styles.mathLine}>
                        <InlineMath math={`${data.vName}' = \\frac{\\partial L}{\\partial ${data.vName}} = ` + data.gradientContributions.map(c => `\\left( \\frac{\\partial L}{\\partial ${c.parentVName}} \\cdot \\frac{\\partial ${c.parentVName}}{\\partial ${data.vName}} \\right)`).join(' + ')} />
                      </div>
                      
                      <div className={styles.stepsContainer} style={{ marginTop: '12px', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '12px' }}>
                        {data.gradientContributions.map((c, idx) => (
                          <div key={idx} style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.85em', color: '#94a3b8', marginBottom: '4px' }}>
                              Dla gałęzi od <InlineMath math={c.parentVName} />:
                            </div>
                            <div className={styles.mathLine} style={{ fontSize: '0.9em', color: '#cbd5e1' }}>
                              <span style={{color: '#64748b', marginRight: '8px'}}>Forward:</span>
                              <InlineMath math={`${c.parentVName} = ${c.parentForwardEquation}`} />
                            </div>
                            <div className={styles.mathLine} style={{ fontSize: '0.9em' }}>
                              <span style={{color: '#64748b', marginRight: '8px'}}>Pochodna:</span>
                              <InlineMath math={`\\frac{\\partial ${c.parentVName}}{\\partial ${data.vName}} = ${c.formula}`} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className={styles.mathLine} style={{ color: '#94a3b8', marginTop: '8px' }}>
                        <InlineMath math={`= ` + data.gradientContributions.map(c => `(${c.dL_dParent.toFixed(4)} \\cdot ${c.dParent_dChild.toFixed(4)})`).join(' + ')} />
                      </div>
                      <div className={styles.mathLine} style={{ color: '#f87171', fontWeight: 'bold' }}>
                        <InlineMath math={`= ${data.globalGradient?.toFixed(4)}`} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
      </div>
    </div>
  );
};

export default LeftPanel;
