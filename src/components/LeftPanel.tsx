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
                  <div className={styles.passTitleWrapper}>
                    <span className={styles.passTitleText}>Forward Pass</span>
                  </div>
                  <div className={styles.mathLine}>
                    <InlineMath math={`${data.vName} = ${data.forwardEquation}${data.value !== null ? ` = ${data.value.toFixed(4)}` : ''}`} />
                  </div>
                </div>
                
                {/* BACKWARD PASS */}
                <div className={styles.passBox}>
                  <div className={styles.passTitleWrapper}>
                    <span className={styles.passTitleText}>Backward Pass</span>
                  </div>
                  {!hasBackprop ? (
                    <p className={styles.muted}>Brak obliczeń (uruchom Backward Pass).</p>
                  ) : (!data.gradientContributions || data.gradientContributions.length === 0) ? (
                    <div className={styles.mathLine}>
                      <InlineMath math={`${data.vName}' = \\frac{\\partial L}{\\partial ${data.vName}} = 1`} />
                    </div>
                  ) : (
                    <>
                      <div className={styles.mathLine}>
                        <InlineMath math={`${data.vName}' = \\frac{\\partial L}{\\partial ${data.vName}} = ` + data.gradientContributions.map(c => `\\frac{\\partial L}{\\partial ${c.parentVName}} \\cdot \\frac{\\partial ${c.parentVName}}{\\partial ${data.vName}}`).join(' + ')} />
                      </div>
                      <div className={styles.mathLine} style={{ color: '#94a3b8', paddingLeft: '10px' }}>
                        <InlineMath math={`= ` + data.gradientContributions.map(c => `(${c.dL_dParent.toFixed(4)} \\cdot ${c.formula})`).join(' + ')} />
                      </div>
                      <div className={styles.mathLine} style={{ color: '#94a3b8', paddingLeft: '10px' }}>
                        <InlineMath math={`= ` + data.gradientContributions.map(c => `(${c.dL_dParent.toFixed(4)} \\cdot ${c.dParent_dChild.toFixed(4)})`).join(' + ')} />
                      </div>
                      <div className={styles.mathLine} style={{ color: '#f87171', paddingLeft: '10px', fontWeight: 'bold' }}>
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
