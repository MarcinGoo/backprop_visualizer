import React from 'react';
import type { Graph } from '../engine/GraphBuilder';
import { InlineMath, BlockMath } from 'react-katex';
import styles from './StepByStepPanel.module.css';

interface StepByStepPanelProps {
  graph: Graph | null;
}

const StepByStepPanel: React.FC<StepByStepPanelProps> = ({ graph }) => {
  if (!graph) return null;

  return (
    <div className={styles.panel}>
      <h3>Math Breakdown (Step-by-Step Backpropagation)</h3>
      <div className={styles.scrollArea}>
      
        {[...graph.nodes].reverse().map((node) => {
          const { data } = node;
          const hasBackprop = data.globalGradient !== null;
          
          return (
            <div key={node.id} className={styles.nodeRow}>
              <div className={styles.nodeHeader}>
                Node: <InlineMath math={data.vName || ''} /> {data.label !== data.vName && <span style={{fontSize: '0.8em', color: '#94a3b8'}}>({data.label})</span>}
              </div>
              
              <div className={styles.nodeBody}>
                {/* BACKWARD PASS ONLY */}
                <div className={styles.passBox}>
                  <div className={styles.passTitleWrapper}>
                    <span className={styles.passTitleText}>Calculating total derivative</span> <InlineMath math={`\\frac{\\partial L}{\\partial ${data.vName}}`} />
                  </div>
                  {!hasBackprop ? (
                    <p className={styles.muted}>No calculations (run Backward Pass).</p>
                  ) : (!data.gradientContributions || data.gradientContributions.length === 0) ? (
                    <div className={styles.mathLine}>
                      <span className={styles.desc}>This is the output node (L).</span>
                      <br />
                      <br />
                      <BlockMath math={`${data.vName}' = \\frac{\\partial L}{\\partial ${data.vName}} = 1`} />
                    </div>
                  ) : (
                    <>
                      <div className={styles.mathLine}>
                        <BlockMath math={`${data.vName}' = \\frac{\\partial L}{\\partial ${data.vName}} = ` + data.gradientContributions.map(c => `\\left( \\frac{\\partial L}{\\partial ${c.parentVName}} \\cdot \\frac{\\partial ${c.parentVName}}{\\partial ${data.vName}} \\right)`).join(' + ')} />
                      </div>
                      
                      <div className={styles.stepsContainer}>
                        {data.gradientContributions.map((c, idx) => (
                          <div key={idx} className={styles.stepBlock}>
                            <div className={styles.stepHeader}>
                              Contribution from node <InlineMath math={c.parentVName} />:
                            </div>
                            <div className={styles.mathLine}>
                              <span className={styles.stepLabel}>Equation (Forward):</span>
                              <InlineMath math={`\\displaystyle ${c.parentVName} = ${c.parentForwardEquation}`} />
                            </div>
                            <div className={styles.mathLine}>
                              <span className={styles.stepLabel}>Derivative (from Forward):</span>
                              <InlineMath math={`\\displaystyle \\frac{\\partial ${c.parentVName}}{\\partial ${data.vName}} = ${c.formula}`} />
                            </div>
                            <div className={styles.mathLine}>
                              <span className={styles.stepLabel}>Derivative (values):</span>
                              <InlineMath math={`\\displaystyle \\frac{\\partial ${c.parentVName}}{\\partial ${data.vName}} = ${c.substitutedFormula} = ${c.dParent_dChild.toFixed(4)}`} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className={styles.mathLine} style={{ color: '#94a3b8', marginTop: '16px' }}>
                        <BlockMath math={`= ` + data.gradientContributions.map(c => `\\left( ${c.dL_dParent.toFixed(4)} \\cdot ${c.dParent_dChild < 0 ? `(${c.dParent_dChild.toFixed(4)})` : c.dParent_dChild.toFixed(4)} \\right)`).join(' + ')} />
                      </div>
                      <div className={styles.mathLine} style={{ color: '#f87171', fontWeight: 'bold' }}>
                        <BlockMath math={`= ${data.globalGradient?.toFixed(4)}`} />
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

export default StepByStepPanel;
