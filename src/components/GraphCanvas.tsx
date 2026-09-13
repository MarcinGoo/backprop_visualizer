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
import type { Graph } from '../engine/GraphBuilder';

const nodeTypes = {
  computeNode: ComputeNode,
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
    dagreGraph.setNode(node.id, { width: 150, height: 100 }); // Approximate dimensions
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
    // adjust positioning to center
    node.position = {
      x: nodeWithPosition.x - 75,
      y: nodeWithPosition.y - 50,
    };
  });
  
  return { nodes, edges };
};

const GraphCanvas: React.FC<GraphCanvasProps> = ({ graph, onNodeClick, selectedNodeId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  useEffect(() => {
    if (graph) {
      const rfNodes: Node[] = graph.nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          ...n.data,
        }
      }));
      
      const rfEdges: Edge[] = graph.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'straight',
        animated: false,
        style: { stroke: '#475569', strokeWidth: 2 },
      }));
      
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
        fitView
      >
        <Background color="#334155" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default GraphCanvas;
