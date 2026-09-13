import { parse } from 'mathjs';

export type NodeData = {
  label: string;
  type: 'variable' | 'constant' | 'operator' | 'function';
  value: number | null; // Value after forward pass
  globalGradient: number | null; // dL/dNode after backward pass
  localGradients: Record<string, string>; // childId -> formula for dNode/dChild
  expression?: string; // Original math expression
  
  // UX additions for detailed math breakdown
  vName?: string; // v1, v2, v3...
  forwardEquation?: string;
  expandedEquation?: string;
  gradientContributions?: {
    parentVName: string;
    dL_dParent: number;
    dParent_dChild: number;
    formula: string; // symbol/formula for the local derivative
  }[];
};

export type AppNode = {
  id: string;
  data: NodeData;
  type: string;
  position: { x: number; y: number };
};

export type AppEdge = {
  id: string;
  source: string;
  target: string;
  label?: string; // Optional: display local gradient formula
};

export type Graph = {
  nodes: AppNode[];
  edges: AppEdge[];
  variables: string[];
};

export function buildGraph(expression: string): Graph {
  let rootNode;
  try {
    rootNode = parse(expression);
  } catch (e) {
    throw new Error('Invalid mathematical expression');
  }

  const nodes: AppNode[] = [];
  const edges: AppEdge[] = [];
  const variables = new Set<string>();
  
  let nodeIdCounter = 0;
  const generateId = (prefix: string) => `${prefix}_${nodeIdCounter++}`;
  
  const varNodes = new Map<string, string>(); // name -> id

  function traverse(node: any): string {
    if (node.isSymbolNode) {
      variables.add(node.name);
      if (varNodes.has(node.name)) {
        return varNodes.get(node.name)!;
      }
      const id = generateId('var');
      nodes.push({
        id,
        type: 'computeNode',
        position: { x: 0, y: 0 },
        data: {
          label: node.name,
          type: 'variable',
          value: null,
          globalGradient: null,
          localGradients: {},
          gradientContributions: [],
        }
      });
      varNodes.set(node.name, id);
      return id;
    }
    
    if (node.isConstantNode) {
      const id = generateId('const');
      nodes.push({
        id,
        type: 'computeNode',
        position: { x: 0, y: 0 },
        data: {
          label: String(node.value),
          type: 'constant',
          value: Number(node.value),
          globalGradient: null,
          localGradients: {},
          gradientContributions: [],
        }
      });
      return id;
    }
    
    if (node.isOperatorNode) {
      const id = generateId('op');
      const childIds = node.args.map((arg: any) => traverse(arg));
      
      nodes.push({
        id,
        type: 'computeNode',
        position: { x: 0, y: 0 },
        data: {
          label: node.op,
          type: 'operator',
          value: null,
          globalGradient: null,
          localGradients: {},
          gradientContributions: [],
        }
      });
      
      childIds.forEach((childId: string) => {
        edges.push({
          id: `e_${childId}_${id}`,
          source: childId,
          target: id,
        });
      });
      
      return id;
    }
    
    if (node.isFunctionNode) {
      const id = generateId('fn');
      const childIds = node.args.map((arg: any) => traverse(arg));
      
      nodes.push({
        id,
        type: 'computeNode',
        position: { x: 0, y: 0 },
        data: {
          label: node.fn.name,
          type: 'function',
          value: null,
          globalGradient: null,
          localGradients: {},
          gradientContributions: [],
        }
      });
      
      childIds.forEach((childId: string) => {
        edges.push({
          id: `e_${childId}_${id}`,
          source: childId,
          target: id,
        });
      });
      return id;
    }
    
    if (node.isParenthesisNode) {
      return traverse(node.content);
    }
    
    throw new Error(`Unsupported node type: ${node.type}`);
  }
  
  traverse(rootNode);
  
  // Post-processing to assign vNames and forwardEquations
  nodes.forEach((node, idx) => {
    node.data.vName = `v_{${idx + 1}}`;
    
    if (node.data.type === 'variable' || node.data.type === 'constant') {
      node.data.forwardEquation = node.data.label;
      node.data.expandedEquation = node.data.label;
    } else if (node.data.type === 'operator') {
      const childEdges = edges.filter(e => e.target === node.id);
      if (childEdges.length === 2) {
        const leftChild = nodes.find(n => n.id === childEdges[0].source);
        const rightChild = nodes.find(n => n.id === childEdges[1].source);
        if (leftChild && rightChild) {
          let leftExp = leftChild.data.expandedEquation || leftChild.data.vName;
          let rightExp = rightChild.data.expandedEquation || rightChild.data.vName;
          
          if (leftChild.data.type === 'operator') leftExp = `\\left(${leftExp}\\right)`;
          if (rightChild.data.type === 'operator') rightExp = `\\left(${rightExp}\\right)`;

          if (node.data.label === '*') {
            node.data.forwardEquation = `${leftChild.data.vName} \\cdot ${rightChild.data.vName}`;
            node.data.expandedEquation = `${leftExp} \\cdot ${rightExp}`;
          } else if (node.data.label === '/') {
            node.data.forwardEquation = `\\frac{${leftChild.data.vName}}{${rightChild.data.vName}}`;
            node.data.expandedEquation = `\\frac{${leftExp}}{${rightExp}}`;
          } else if (node.data.label === '^') {
            node.data.forwardEquation = `{${leftChild.data.vName}}^{${rightChild.data.vName}}`;
            node.data.expandedEquation = `{${leftExp}}^{${rightExp}}`;
          } else {
            node.data.forwardEquation = `${leftChild.data.vName} ${node.data.label} ${rightChild.data.vName}`;
            node.data.expandedEquation = `${leftExp} ${node.data.label} ${rightExp}`;
          }
        }
      }
    } else if (node.data.type === 'function') {
      const childEdges = edges.filter(e => e.target === node.id);
      if (childEdges.length === 1) {
        const child = nodes.find(n => n.id === childEdges[0].source);
        if (child) {
          node.data.forwardEquation = `\\${node.data.label}(${child.data.vName})`;
          node.data.expandedEquation = `\\${node.data.label}\\left(${child.data.expandedEquation}\\right)`;
        }
      }
    }
  });
  
  return {
    nodes,
    edges,
    variables: Array.from(variables)
  };
}
