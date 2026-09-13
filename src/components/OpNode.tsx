import React from 'react';
import { Handle, Position } from '@xyflow/react';

const OpNode = ({ data }: any) => {
  return (
    <div style={{
      background: '#334155',
      border: '2px solid #475569',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#f8fafc',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: '#475569', border: 'none' }} />
      {data.label}
      <Handle type="source" position={Position.Right} style={{ background: '#475569', border: 'none' }} />
    </div>
  );
};

export default OpNode;
