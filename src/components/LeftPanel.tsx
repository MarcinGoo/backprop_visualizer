import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Graph } from '../engine/GraphBuilder';
import { InlineMath } from 'react-katex';
import styles from './LeftPanel.module.css';

interface LeftPanelProps {
  graph: Graph | null;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ graph }) => {
  const [width, setWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing && panelRef.current) {
        const newWidth = e.clientX - panelRef.current.getBoundingClientRect().left;
        setWidth(Math.max(300, Math.min(newWidth, window.innerWidth - 200)));
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  if (!graph) return null;

  return (
    <div ref={panelRef} className={styles.panel} style={{ width: `${width}px` }}>
      <div className={styles.resizer} onMouseDown={startResizing} />
      <h3>Zapis Matematyczny (Global Trace)</h3>
      <div className={styles.scrollArea}>
      
        {[...graph.nodes].reverse().map((node) => {
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
                  <div className={styles.passTitle}>Backward Pass</div>
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
