import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import * as dagre from 'dagre';
import ComputeNode from './ComputeNode';
import OpNode from './OpNode';
import type { Graph } from '../engine/GraphBuilder';

const nodeTypes = {
  computeNode: ComputeNode,
  opNode: OpNode,
};

interface GraphCanvasProps {
  graph: Graph | null;
  onNodeClick: (nodeId: string) => void;
  selectedNodeId: string | null;
}

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, edgesep: 50, ranksep: 100 });
  
  nodes.forEach((node) => {
    const width = node.type === 'opNode' ? 40 : 150;
    const height = node.type === 'opNode' ? 40 : 100;
    dagreGraph.setNode(node.id, { width, height });
  });
  
  edges.forEach((edge) => {
    // In our logic, source is child and target is parent. 
    // In typical trees, parent is at top, children at bottom.
    // If we want root (output) at top and inputs at bottom, we should reverse edges in dagre.
    // Or if we want inputs at top and output at bottom, data flows down.
    // Data flows from source to target. So source (inputs) should be above target (operator).
    dagreGraph.setEdge(edge.source, edge.target);
  });
  
  dagre.layout(dagreGraph);
  
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = node.type === 'opNode' ? 40 : 150;
    const height = node.type === 'opNode' ? 40 : 100;
    // adjust positioning to center
    node.position = {
      x: nodeWithPosition.x - width / 2,
      y: nodeWithPosition.y - height / 2,
    };
  });
  
  return { nodes, edges };
};

const GraphCanvas: React.FC<GraphCanvasProps> = ({ graph, onNodeClick, selectedNodeId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  useEffect(() => {
    if (graph) {
      const rfNodes: Node[] = [];
      const rfEdges: Edge[] = [];
      
      graph.nodes.forEach(n => {
        rfNodes.push({
          id: n.id,
          type: n.type,
          position: n.position,
          data: { ...n.data }
        });
        
        if (n.data.type === 'operator' || n.data.type === 'function') {
          rfNodes.push({
            id: `op_${n.id}`,
            type: 'opNode',
            position: { x: 0, y: 0 },
            data: { label: n.data.label }
          });
          
          rfEdges.push({
            id: `e_op_${n.id}_${n.id}`,
            source: `op_${n.id}`,
            target: n.id,
            type: 'straight',
            animated: false,
            style: { stroke: '#475569', strokeWidth: 2 },
          });
        }
      });
      
      graph.edges.forEach(e => {
        const targetNode = graph.nodes.find(n => n.id === e.target);
        const isTargetOp = targetNode && (targetNode.data.type === 'operator' || targetNode.data.type === 'function');
        
        rfEdges.push({
          id: e.id,
          source: e.source,
          target: isTargetOp ? `op_${e.target}` : e.target,
          type: 'straight',
          animated: false,
          style: { stroke: '#475569', strokeWidth: 2 },
        });
      });
      
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        rfNodes,
        rfEdges,
        'LR' // Left to Right (Inputs on left, Output on right)
      );
      
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [graph, setNodes, setEdges]);
  
  // Highlight selected node
  useEffect(() => {
    setNodes(nds => nds.map(node => ({
      ...node,
      data: {
        ...node.data,
        selected: node.id === selectedNodeId
      }
    })));
  }, [selectedNodeId, setNodes]);
  
  const onNodeClickInternal = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.id.startsWith('op_')) return;
    onNodeClick(node.id);
  }, [onNodeClick]);
  
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes.map(n => ({
          ...n,
          data: {
            ...n.data,
            selected: n.id === selectedNodeId
          }
        }))}
        edges={edges.map(e => {
          // If backwards pass is run, maybe animate edges based on gradients?
          // For now just basic edges
          let isBackwardsActive = false;
          if (graph && graph.nodes.length > 0 && graph.nodes[0].data.globalGradient !== null) {
            isBackwardsActive = true;
          }
          
          return {
            ...e,
            animated: isBackwardsActive,
            style: { 
              stroke: isBackwardsActive ? '#f87171' : '#60a5fa', 
              strokeWidth: isBackwardsActive ? 3 : 2 
            }
          };
        })}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClickInternal}
        connectionMode={ConnectionMode.Loose}
        proOptions={{ hideAttribution: true }}
        fitView
      >
        <Background color="#334155" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default GraphCanvas;
