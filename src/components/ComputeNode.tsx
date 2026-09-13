import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeData } from '../engine/GraphBuilder';
import { InlineMath } from 'react-katex';
import styles from './ComputeNode.module.css';

interface ComputeNodeProps {
  data: NodeData;
  selected: boolean;
}

const ComputeNode: React.FC<ComputeNodeProps> = ({ data, selected }) => {
  return (
    <div className={`${styles.node} ${selected ? styles.selected : ''} ${styles[data.type]}`}>
      <Handle type="target" position={Position.Left} className={styles.handle} />
      
      <div className={styles.label}>
        <span style={{ fontSize: '0.8em', position: 'absolute', top: 4, left: 6, color: '#94a3b8' }}>
          {data.vName && <InlineMath math={data.vName} />}
        </span>
        {data.label}
      </div>
      
      <div className={styles.values}>
        <div className={styles.forwardValue}>
          <span className={styles.valLabel}>f:</span> 
          {data.value !== null ? data.value.toFixed(2) : '-'}
        </div>
        <div className={styles.backwardValue}>
          <span className={styles.valLabel}>∇:</span> 
          {data.globalGradient !== null ? data.globalGradient.toFixed(2) : '-'}
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  );
};

export default ComputeNode;
