import { expect, test, describe } from 'vitest';
import { buildGraph } from './GraphBuilder';
import { forwardPass, backwardPass } from './ComputeEngine';

describe('ComputeEngine', () => {
  test('Addition and Multiplication: f(x, y) = x * y + x', () => {
    const graph = buildGraph('x * y + x');
    expect(graph.variables.sort()).toEqual(['x', 'y']);
    
    // x = 2, y = 3
    const fGraph = forwardPass(graph, { x: 2, y: 3 });
    
    // Find output node (+)
    const outputNode = fGraph.nodes.find(n => n.data.label === '+');
    expect(outputNode).toBeDefined();
    expect(outputNode!.data.value).toBe(8); // 2 * 3 + 2 = 8
    
    const bGraph = backwardPass(fGraph);
    
    // dL/dx = y + 1 = 3 + 1 = 4
    // dL/dy = x = 2
    const xNode = bGraph.nodes.find(n => n.data.label === 'x' && n.data.type === 'variable');
    const yNode = bGraph.nodes.find(n => n.data.label === 'y' && n.data.type === 'variable');
    
    expect(xNode!.data.globalGradient).toBe(4);
    expect(yNode!.data.globalGradient).toBe(2);
  });

  test('Power and Constant: f(x) = x^2 + 5', () => {
    const graph = buildGraph('x^2 + 5');
    const fGraph = forwardPass(graph, { x: 3 });
    
    const outputNode = fGraph.nodes.find(n => n.data.label === '+');
    expect(outputNode!.data.value).toBe(14); // 3^2 + 5 = 14
    
    const bGraph = backwardPass(fGraph);
    
    // dL/dx = 2 * x = 2 * 3 = 6
    const xNode = bGraph.nodes.find(n => n.data.label === 'x' && n.data.type === 'variable');
    expect(xNode!.data.globalGradient).toBe(6);
  });

  test('Trigonometry and Chain Rule: f(x) = sin(x^2)', () => {
    const graph = buildGraph('sin(x^2)');
    const fGraph = forwardPass(graph, { x: Math.sqrt(Math.PI) });
    
    const outputNode = fGraph.nodes.find(n => n.data.label === 'sin');
    // sin(PI) is approximately 0
    expect(outputNode!.data.value).toBeCloseTo(0, 5);
    
    const bGraph = backwardPass(fGraph);
    
    // dL/dx = cos(x^2) * 2x = cos(PI) * 2*sqrt(PI) = -1 * 2*sqrt(PI)
    const expectedGrad = -1 * 2 * Math.sqrt(Math.PI);
    const xNode = bGraph.nodes.find(n => n.data.label === 'x' && n.data.type === 'variable');
    expect(xNode!.data.globalGradient).toBeCloseTo(expectedGrad, 5);
  });

  test('Logarithm and Division: f(x) = log(x) / x', () => {
    const graph = buildGraph('log(x) / x');
    const fGraph = forwardPass(graph, { x: Math.E });
    
    const outputNode = fGraph.nodes.find(n => n.data.label === '/');
    // log(E) / E = 1 / E
    expect(outputNode!.data.value).toBeCloseTo(1 / Math.E, 5);
    
    const bGraph = backwardPass(fGraph);
    
    // dL/dx = ( (1/x)*x - log(x)*1 ) / x^2 = (1 - log(x)) / x^2
    // For x = E, (1 - 1) / E^2 = 0
    const xNode = bGraph.nodes.find(n => n.data.label === 'x' && n.data.type === 'variable');
    expect(xNode!.data.globalGradient).toBeCloseTo(0, 5);
  });
});
