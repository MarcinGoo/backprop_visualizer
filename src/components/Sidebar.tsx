import React from 'react';
import type { AppNode } from '../engine/GraphBuilder';
import { InlineMath, BlockMath } from 'react-katex';
import styles from './Sidebar.module.css';

interface SidebarProps {
  node: AppNode | null;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ node, onClose }) => {
  if (!node) {
    return (
      <div className={`${styles.sidebar} ${styles.empty}`}>
        <p>Kliknij węzeł na grafie, aby zobaczyć szczegóły propagacji wstecznej (Chain Rule).</p>
      </div>
    );
  }

  const { data } = node;

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h3>
          Węzeł: <span className={styles.highlight}><InlineMath math={data.vName || ''} /></span>
          {data.label !== data.vName && <span style={{fontSize: '0.9em', color: '#94a3b8', marginLeft: 8}}>({data.label})</span>}
        </h3>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.section}>
        <h4>Krok Forward Pass</h4>
        <div className={styles.formulaBox}>
          <div className={styles.math}><BlockMath math={`${data.vName} = ${data.forwardEquation}`} /></div>
        </div>
        {data.expandedEquation && data.expandedEquation !== data.label && data.expandedEquation !== data.forwardEquation && (
          <>
            <h4>Pełne rozwinięcie wzoru</h4>
            <div className={styles.formulaBox}>
              <div className={styles.math}><BlockMath math={`${data.vName} = ${data.expandedEquation}`} /></div>
            </div>
          </>
        )}
        <div className={styles.valueRow}>
          <span>Wynik (f):</span>
          <span className={styles.valBlue}>{data.value !== null ? data.value.toFixed(4) : '-'}</span>
        </div>
      </div>
      
      <div className={styles.section}>
        <h4>Krok Backward Pass</h4>
        <p className={styles.desc}>
          Zgodnie z regułą łańcuchową (Chain Rule), gradient globalny (<InlineMath math={`\\frac{\\partial L}{\\partial ${data.vName}}`} />) to suma pochodnych płynących od wszystkich węzłów, które używają <InlineMath math={data.vName || ''} />.
        </p>
        
        {data.gradientContributions && data.gradientContributions.length > 0 ? (
          <>
            <div className={styles.formulaBox} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <div className={styles.math}>
                <BlockMath math={`\\frac{\\partial L}{\\partial ${data.vName}} = ` + data.gradientContributions.map(c => `\\left( \\frac{\\partial L}{\\partial ${c.parentVName}} \\cdot \\frac{\\partial ${c.parentVName}}{\\partial ${data.vName}} \\right)`).join(' + ')} />
              </div>
              
              <div style={{ marginTop: '12px', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.gradientContributions.map((c, idx) => (
                  <div key={idx}>
                    <div style={{ fontSize: '0.85em', color: '#94a3b8', marginBottom: '4px' }}>
                      Dla gałęzi od <InlineMath math={c.parentVName} />:
                    </div>
                    <div className={styles.math} style={{ fontSize: '0.9em', color: '#cbd5e1' }}>
                      <span style={{color: '#64748b', marginRight: '8px'}}>Forward:</span>
                      <InlineMath math={`${c.parentVName} = ${c.parentForwardEquation}`} />
                    </div>
                    <div className={styles.math} style={{ fontSize: '0.9em' }}>
                      <span style={{color: '#64748b', marginRight: '8px'}}>Pochodna:</span>
                      <InlineMath math={`\\frac{\\partial ${c.parentVName}}{\\partial ${data.vName}} = ${c.formula}`} />
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.math} style={{ color: '#94a3b8', marginTop: '12px' }}>
                <BlockMath math={`= ` + data.gradientContributions.map(c => `\\left( ${c.dL_dParent.toFixed(4)} \\cdot ${c.dParent_dChild.toFixed(4)} \\right)`).join(' + ')} />
              </div>
              <div className={styles.math} style={{ color: '#f87171', fontWeight: 'bold' }}>
                <BlockMath math={`= ${data.globalGradient?.toFixed(4)}`} />
              </div>
            </div>
          </>
        ) : data.globalGradient !== null ? (
          <div className={styles.formulaBox} style={{ flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span className={styles.math}>To jest węzeł wyjściowy (L).</span>
            <div className={styles.math} style={{ color: '#f87171', fontWeight: 'bold' }}>
              <BlockMath math={`\\frac{\\partial L}{\\partial ${data.vName}} = ${data.globalGradient.toFixed(4)}`} />
            </div>
          </div>
        ) : (
          <p className={styles.desc}>Uruchom Backward Pass, aby zobaczyć obliczenia.</p>
        )}
      </div>

    </div>
  );
};

export default Sidebar;
