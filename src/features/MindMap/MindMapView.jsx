// frontend/src/features/MindMap/MindMapView.jsx
import React, { useEffect } from 'react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import './MindMapView.css';

// Initialize the Dagre layout graph
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// The magic function that calculates perfect x/y coordinates so lines don't cross
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 60 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: 'top',
      sourcePosition: 'bottom',
      position: {
        x: nodeWithPosition.x - 100, // Centers the node on the calculated X
        y: nodeWithPosition.y - 30,  // Centers the node on the calculated Y
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function MindMapView({ mapData }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!mapData || !mapData.nodes || !mapData.edges) return;

    // 1. Apply premium styles to the raw AI nodes
    const styledNodes = mapData.nodes.map((node) => ({
      ...node,
      style: {
        background: '#ffffff',
        border: '2px solid #4f46e5',
        borderRadius: '12px',
        padding: '12px 10px',
        fontWeight: '700',
        color: '#1e293b',
        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.15)',
        width: 200,
        textAlign: 'center',
        fontSize: '0.9rem',
        letterSpacing: '-0.01em'
      }
    }));

    // 2. Style the edges so they are smooth and modern
    const styledEdges = mapData.edges.map((edge) => ({
      ...edge,
      type: 'smoothstep', // Gives the lines clean, curved 90-degree angles
      animated: true,     // Adds a cool flowing animation to the connections
      style: { stroke: '#94a3b8', strokeWidth: 2 }
    }));

    // 3. Run the nodes and edges through the Dagre layout algorithm (TB = Top-to-Bottom)
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      styledNodes,
      styledEdges,
      'TB' 
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [mapData, setNodes, setEdges]);

  if (!mapData) return null;

  return (
    <div className="mindmap-section">
      <div className="map-header">
        <div className="map-icon">🕸️</div>
        <h2 className="map-title">Concept Map</h2>
      </div>
      
      <div className="map-canvas-container">
        <ReactFlow 
          nodes={nodes} 
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="#cbd5e1" gap={16} size={2} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}