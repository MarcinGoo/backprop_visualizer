import type { Graph, AppNode } from './GraphBuilder';

export function forwardPass(graph: Graph, variableValues: Record<string, number>): Graph {
  const newNodes = [...graph.nodes];
  
  // Create a map for quick node lookup
  const nodeMap = new Map<string, AppNode>();
  newNodes.forEach(n => nodeMap.set(n.id, n));
  
  // Edges where source is input, target is operation
  // We need to evaluate a node only when all its sources are evaluated
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>(); // node -> targets
  
  newNodes.forEach(n => {
    inDegree.set(n.id, 0);
    outEdges.set(n.id, []);
  });
  
  graph.edges.forEach(e => {
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    outEdges.get(e.source)!.push(e.target);
  });
  
  const queue: string[] = [];
  newNodes.forEach(n => {
    if (inDegree.get(n.id) === 0) {
      queue.push(n.id);
    }
  });
  
  // Topological sort & evaluation
  while (queue.length > 0) {
    const currId = queue.shift()!;
    const currNode = nodeMap.get(currId)!;
    
    if (currNode.data.type === 'variable') {
      currNode.data.value = variableValues[currNode.data.label] ?? 0;
    } else if (currNode.data.type === 'constant') {
      // already set
    } else {
      // It's an operator or function, get inputs (sources of edges where target is currId)
      const inputs = graph.edges
        .filter(e => e.target === currId)
        .map(e => nodeMap.get(e.source)!.data.value!);
        
      if (currNode.data.type === 'operator') {
        const [a, b] = inputs;
        switch (currNode.data.label) {
          case '+': currNode.data.value = a + b; break;
          case '-': currNode.data.value = a - b; break;
          case '*': currNode.data.value = a * b; break;
          case '/': currNode.data.value = a / b; break;
          case '^': currNode.data.value = Math.pow(a, b); break;
        }
      } else if (currNode.data.type === 'function') {
        const [a] = inputs;
        switch (currNode.data.label) {
          case 'sin': currNode.data.value = Math.sin(a); break;
          case 'cos': currNode.data.value = Math.cos(a); break;
          case 'tan': currNode.data.value = Math.tan(a); break;
          case 'exp': currNode.data.value = Math.exp(a); break;
          case 'log': currNode.data.value = Math.log(a); break;
        }
      } else if (currNode.data.type === 'output') {
        const [a] = inputs;
        currNode.data.value = a;
      }
    }
    
    for (const target of outEdges.get(currId)!) {
      inDegree.set(target, inDegree.get(target)! - 1);
      if (inDegree.get(target) === 0) {
        queue.push(target);
      }
    }
  }
  
  return { ...graph, nodes: newNodes };
}

export function backwardPass(graph: Graph): Graph {
  const newNodes = [...graph.nodes];
  const nodeMap = new Map<string, AppNode>();
  newNodes.forEach(n => nodeMap.set(n.id, n));
  
  // Reset gradients
  newNodes.forEach(n => {
    n.data.globalGradient = 0; // initialize to 0
    n.data.localGradients = {};
    n.data.gradientContributions = [];
  });
  
  // Find output node (outDegree == 0)
  const outDegree = new Map<string, number>();
  newNodes.forEach(n => outDegree.set(n.id, 0));
  graph.edges.forEach(e => {
    outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1);
  });
  
  const outputNodes = newNodes.filter(n => outDegree.get(n.id) === 0);
  
  // Set output gradient to 1
  outputNodes.forEach(n => {
    n.data.globalGradient = 1;
  });
  
  // Topological sort from output to inputs
  // We can reuse inDegree from forward pass but reverse it
  const inDegree = new Map<string, number>();
  const inEdges = new Map<string, string[]>(); // node -> sources (children)
  
  newNodes.forEach(n => {
    inDegree.set(n.id, outDegree.get(n.id)!); // dependencies are now out edges
    inEdges.set(n.id, []);
  });
  
  graph.edges.forEach(e => {
    inEdges.get(e.target)!.push(e.source);
  });
  
  const queue: string[] = [...outputNodes.map(n => n.id)];
  
  while (queue.length > 0) {
    const currId = queue.shift()!;
    const currNode = nodeMap.get(currId)!;
    
    // For the current node, compute local gradients for its inputs (children)
    // and accumulate global gradient to them.
    const children = inEdges.get(currId)!;
    
    if (children.length > 0) {
      if (currNode.data.type === 'operator') {
        const [leftId, rightId] = children;
        const leftNode = nodeMap.get(leftId);
        const rightNode = nodeMap.get(rightId);
        
        let dL_dLeft = 0;
        let dL_dRight = 0;
        let dLeftStr = '';
        let dRightStr = '';
        let dLeftSubst = '';
        let dRightSubst = '';
        
        const fmt = (n: number) => n < 0 ? `(${n.toFixed(4)})` : n.toFixed(4);
        
        switch (currNode.data.label) {
          case '+':
            dL_dLeft = 1; dLeftStr = '1'; dLeftSubst = '1';
            dL_dRight = 1; dRightStr = '1'; dRightSubst = '1';
            break;
          case '-':
            dL_dLeft = 1; dLeftStr = '1'; dLeftSubst = '1';
            dL_dRight = -1; dRightStr = '-1'; dRightSubst = '-1';
            break;
          case '*':
            dL_dLeft = rightNode?.data.value || 0; dLeftStr = rightNode?.data.vName || ''; dLeftSubst = `${fmt(dL_dLeft)}`;
            dL_dRight = leftNode?.data.value || 0; dRightStr = leftNode?.data.vName || ''; dRightSubst = `${fmt(dL_dRight)}`;
            break;
          case '/':
            const vLeft = leftNode?.data.value || 0;
            const vRight = rightNode?.data.value || 1;
            dL_dLeft = 1 / vRight; dLeftStr = `\\frac{1}{${rightNode?.data.vName}}`; dLeftSubst = `\\frac{1}{${fmt(vRight)}}`;
            dL_dRight = -vLeft / (vRight * vRight); dRightStr = `-\\frac{${leftNode?.data.vName}}{{${rightNode?.data.vName}}^2}`; dRightSubst = `-\\frac{${fmt(vLeft)}}{${fmt(vRight)}^2}`;
            break;
          case '^':
            const base = leftNode?.data.value || 0;
            const exp = rightNode?.data.value || 0;
            dL_dLeft = exp * Math.pow(base, exp - 1);
            dLeftStr = `${exp} \\cdot {${leftNode?.data.vName}}^{${exp}-1}`; dLeftSubst = `${fmt(exp)} \\cdot {${fmt(base)}}^{${fmt(exp)}-1}`;
            dL_dRight = Math.pow(base, exp) * Math.log(base);
            dRightStr = `{${leftNode?.data.vName}}^{${exp}} \\cdot \\ln(${leftNode?.data.vName})`; dRightSubst = `{${fmt(base)}}^{${fmt(exp)}} \\cdot \\ln(${fmt(base)})`;
            break;
        }
        
        if (leftNode) {
          currNode.data.localGradients[leftId] = dLeftStr;
          leftNode.data.globalGradient! += currNode.data.globalGradient! * dL_dLeft;
          leftNode.data.gradientContributions!.push({
            parentVName: currNode.data.vName!,
            parentForwardEquation: currNode.data.forwardEquation || '',
            dL_dParent: currNode.data.globalGradient!,
            dParent_dChild: dL_dLeft,
            formula: dLeftStr,
            substitutedFormula: dLeftSubst
          });
        }
        if (rightNode) {
          currNode.data.localGradients[rightId] = dRightStr;
          rightNode.data.globalGradient! += currNode.data.globalGradient! * dL_dRight;
          rightNode.data.gradientContributions!.push({
            parentVName: currNode.data.vName!,
            parentForwardEquation: currNode.data.forwardEquation || '',
            dL_dParent: currNode.data.globalGradient!,
            dParent_dChild: dL_dRight,
            formula: dRightStr,
            substitutedFormula: dRightSubst
          });
        }
      } else if (currNode.data.type === 'function') {
        const childId = children[0];
        const childNode = nodeMap.get(childId);
        const v = childNode?.data.value || 0;
        
        let dL = 0;
        let dStr = '';
        let dSubst = '';
        
        switch (currNode.data.label) {
          case 'sin': dL = Math.cos(v); dStr = `\\cos(${childNode?.data.vName})`; dSubst = `\\cos(${fmt(v)})`; break;
          case 'cos': dL = -Math.sin(v); dStr = `-\\sin(${childNode?.data.vName})`; dSubst = `-\\sin(${fmt(v)})`; break;
          case 'tan': dL = 1 / (Math.cos(v) * Math.cos(v)); dStr = `\\frac{1}{\\cos^2(${childNode?.data.vName})}`; dSubst = `\\frac{1}{\\cos^2(${fmt(v)})}`; break;
          case 'exp': dL = Math.exp(v); dStr = `\\exp(${childNode?.data.vName})`; dSubst = `\\exp(${fmt(v)})`; break;
          case 'log': dL = 1 / v; dStr = `\\frac{1}{${childNode?.data.vName}}`; dSubst = `\\frac{1}{${fmt(v)}}`; break;
        }
        
        if (childNode) {
          currNode.data.localGradients[childId] = dStr;
          childNode.data.globalGradient! += currNode.data.globalGradient! * dL;
          childNode.data.gradientContributions!.push({
            parentVName: currNode.data.vName!,
            parentForwardEquation: currNode.data.forwardEquation || '',
            dL_dParent: currNode.data.globalGradient!,
            dParent_dChild: dL,
            formula: dStr,
            substitutedFormula: dSubst
          });
        }
      } else if (currNode.data.type === 'output') {
        const children = inEdges.get(currId)!;
        const childNode = nodeMap.get(children[0]);
        if (childNode) {
          childNode.data.globalGradient! += currNode.data.globalGradient! * 1;
          childNode.data.gradientContributions!.push({
            parentVName: currNode.data.vName!,
            parentForwardEquation: currNode.data.forwardEquation || '',
            dL_dParent: currNode.data.globalGradient!,
            dParent_dChild: 1,
            formula: '1',
            substitutedFormula: '1'
          });
        }
      }
    }
    
    // topological sort for reverse graph:
    // dependencies are parents. So we need to decrement inDegree of CHILDREN.
    for (const child of children) {
      inDegree.set(child, inDegree.get(child)! - 1);
      if (inDegree.get(child) === 0) {
        queue.push(child);
      }
    }
  }
  
  return { ...graph, nodes: newNodes };
}
