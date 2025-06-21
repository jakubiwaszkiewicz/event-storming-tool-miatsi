// src/App.jsx
import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import CustomNode from "./CustomNode";
import { addEdge, MarkerType } from "reactflow";
import CustomEdge from "./CustomEdge";
import NotePopup from "./NotePopup";
import { useMemo } from "react";

function FlowCanvas({ nodeTypesList }) {
  const nodeTypeMap = useMemo(() => {
    const map = {};
    nodeTypesList.forEach(({ type, color, textColor }) => {
      map[type] = { color, textColor };
    });
    return map;
  }, [nodeTypesList]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { getSelectedNodes } = useReactFlow();
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedNoteValue, setSelectedNoteValue] = useState("");

  const handleOpenNotePopup = (id, note) => {
    setSelectedNote({ id, type: "node" }); // 👈 dodaj typ
    setSelectedNoteValue(note);
  };

  const handleExportXMI = () => {
    const xmiHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<xmi:XMI xmlns:xmi="http://www.omg.org/XMI" xmlns:es="http://eventstorming">`;
    const xmiFooter = `</xmi:XMI>`;

    const nodeXml = nodes
      .map((node) => {
        return `  <es:StickyNote xmi:id="${node.id}" type="${node.data.label}" text="${node.data.label}" positionX="${node.position.x}" positionY="${node.position.y}" />`;
      })
      .join("\n");

    const edgeXml = edges
      .map(
        (edge) =>
          `  <es:Connection xmi:id="${edge.id}" source="${edge.source}" target="${edge.target}" />`
      )
      .join("\n");

    const fullXml = `${xmiHeader}\n${nodeXml}\n${edgeXml}\n${xmiFooter}`;
    const blob = new Blob([fullXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "event-storming.xmi";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      const bounds = event.target.getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
      const { color = "#cccccc", textColor = "#000000" } =
        nodeTypeMap[type] || {};
      const id = `${+new Date()}`;
      const newNode = {
        id,
        type: "custom",
        position,
        data: {
          label: type,
          subtype: type,
          color: color,
          textColor: textColor,
          onChangeNote: (val) =>
            setNodes((nds) =>
              nds.map((n) =>
                n.id === id ? { ...n, data: { ...n.data, note: val } } : n
              )
            ),
          onOpenNote: (id, note) => {
            setSelectedNote({ id, type: "node" });
            setSelectedNoteValue(note);
          },
          onOpenNotePopup: handleOpenNotePopup,
          onChange: (val) =>
            setNodes((nds) =>
              nds.map((n) =>
                n.id === id ? { ...n, data: { ...n.data, label: val } } : n
              )
            ),
          onDelete: () => setNodes((nds) => nds.filter((n) => n.id !== id)),
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodeTypeMap, setNodes]
  );

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "custom",
            data: {
              note: "",
              onChangeNote: (id, newNote) =>
                setEdges((edges) =>
                  edges.map((e) =>
                    e.id === id
                      ? { ...e, data: { ...e.data, note: newNote } }
                      : e
                  )
                ),
              onOpenNote: (id, note) => {
                setSelectedNote({ id, type: "edge" });
                setSelectedNoteValue(note);
              },
              onOpenNotePopup: (id, note) => {
                setSelectedNote({ id, type: "edge" });
                setSelectedNoteValue(note);
              },
            },
            markerEnd: {
              type: MarkerType.Arrow,
              color: "#333",
            },
            style: { strokeWidth: 3, stroke: "#333" },
          },
          eds
        )
      ),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete") {
        const selectedNodes = getSelectedNodes();
        const selectedEdges = edges.filter((e) => e.selected);

        if (selectedNodes.length > 0) {
          setNodes((nds) =>
            nds.filter((n) => !selectedNodes.find((s) => s.id === n.id))
          );
        }

        if (selectedEdges.length > 0) {
          setEdges((eds) =>
            eds.filter((e) => !selectedEdges.find((s) => s.id === e.id))
          );
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [getSelectedNodes, edges, setNodes, setEdges]);

  const handleExport = () => {
    const data = {
      nodes: nodes.map(({ data, ...rest }) => ({
        ...rest,
        data: {
          label: data.label,
          color: data.color,
          textColor: data.textColor,
          note: data.note || "",
        },
      })),

      edges: edges.map(({ data, ...rest }) => ({
        ...rest,
        data: {
          note: data?.note || "",
        },
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "event-storming.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!Array.isArray(data.nodes)) {
          alert("Niepoprawny format JSON.");
          return;
        }

        const fixedNodes = data.nodes.map((n) => ({
          ...n,
          data: {
            ...n.data,
            color: n.data?.color || "#cccccc",
            textColor: n.data?.textColor || "#000000",
            onChange: (val) =>
              setNodes((nds) =>
                nds.map((node) =>
                  node.id === n.id
                    ? { ...node, data: { ...node.data, label: val } }
                    : node
                )
              ),
            onChangeNote: (val) =>
              setNodes((nds) =>
                nds.map((node) =>
                  node.id === n.id
                    ? { ...node, data: { ...node.data, note: val } }
                    : node
                )
              ),
            onOpenNotePopup: (id, note) => {
              setSelectedNote({ id, type: "edge" });
              setSelectedNoteValue(note);
            },
            onOpenNote: (id, note) => {
              setSelectedNote({ id, type: "node" });
              setSelectedNoteValue(note);
            },
            onDelete: () =>
              setNodes((nds) => nds.filter((node) => node.id !== n.id)),
          },
        }));

        const fixedEdges = (data.edges || []).map((e) => ({
          ...e,
          data: {
            note: e.data?.note || "",
            onChangeNote: (id, newNote) =>
              setEdges((eds) =>
                eds.map((edge) =>
                  edge.id === id
                    ? { ...edge, data: { ...edge.data, note: newNote } }
                    : edge
                )
              ),
            onOpenNote: (id, note) => {
              setSelectedNote({ id, type: "edge" });
              setSelectedNoteValue(note);
            },
          },
        }));

        setNodes(fixedNodes);
        setEdges(fixedEdges);
      } catch (error) {
        alert(`Błąd podczas importu JSON: ${error.message}`);
      }
    };

    fileReader.readAsText(file);
  };

  return (
    <div style={{ flex: 1, height: "100vh", position: "relative" }}>
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}>
        <button onClick={handleExport} style={{ marginRight: 8 }}>
          Eksportuj JSON
        </button>
        <input type="file" accept="application/json" onChange={handleImport} />
        <button onClick={handleExportXMI} style={{ marginRight: 8 }}>
          Eksportuj XMI
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edgeTypes={edgeTypes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        edgesUpdatable={true}
        elementsSelectable={true}
      >
        <NotePopup
          isOpen={selectedNote !== null}
          note={selectedNoteValue}
          onChange={(val) => {
            setSelectedNoteValue(val);
            if (selectedNote?.type === "node") {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === selectedNote.id
                    ? { ...n, data: { ...n.data, note: val } }
                    : n
                )
              );
            } else if (selectedNote?.type === "edge") {
              setEdges((eds) =>
                eds.map((e) =>
                  e.id === selectedNote.id
                    ? { ...e, data: { ...e.data, note: val } }
                    : e
                )
              );
            }
          }}
          onClose={() => {
            if (selectedNote?.type === "node") {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === selectedNote.id
                    ? { ...n, data: { ...n.data, note: selectedNoteValue } }
                    : n
                )
              );
            } else if (selectedNote?.type === "edge") {
              setEdges((eds) =>
                eds.map((e) =>
                  e.id === selectedNote.id
                    ? { ...e, data: { ...e.data, note: selectedNoteValue } }
                    : e
                )
              );
            }

            setSelectedNote(null);
            setSelectedNoteValue("");
          }}
        />
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function Sidebar({ nodeTypesList, setNodeTypesList }) {
  const [newTextColor, setNewTextColor] = useState("#000000");
  const [newType, setNewType] = useState("");
  const [newColor, setNewColor] = useState("#cccccc");

  const onDragStart = (event, type) => {
    event.dataTransfer.setData("application/reactflow", type);
    event.dataTransfer.effectAllowed = "move";
  };

  const addNewType = () => {
    if (newType.trim()) {
      setNodeTypesList((prev) => [
        ...prev,
        { type: newType, color: newColor, textColor: newTextColor },
      ]);
      setNewType("");
    }
  };

  const removeType = (typeToRemove) => {
    setNodeTypesList((prev) =>
      prev.filter(({ type }) => type !== typeToRemove)
    );
  };

  return (
    <div style={{ width: 200, padding: 10, background: "#eee" }}>
      <h4>Kartki:</h4>
      {nodeTypesList.map(({ type, color, textColor = "#000000" }) => (
        <div
          key={type}
          draggable
          onDragStart={(e) => onDragStart(e, type)}
          style={{
            background: color,
            padding: 8,
            marginBottom: 8,
            borderRadius: 6,
            cursor: "grab",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: textColor,
          }}
        >
          <span style={{ color: textColor }}>{type}</span>
          <button onClick={() => removeType(type)} style={{ marginLeft: 5 }}>
            ❌
          </button>
        </div>
      ))}

      <div style={{ marginTop: 12 }}>
        <input
          type="text"
          value={newType}
          placeholder="Nazwa"
          onChange={(e) => setNewType(e.target.value)}
          style={{ width: "100%", marginBottom: 4 }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <button
            onClick={() => setNewTextColor("#000000")}
            style={{
              flex: 1,
              backgroundColor: newTextColor === "#000000" ? "#ddd" : "#fff",
              color: "#000",
              marginRight: 4,
            }}
          >
            Czarny tekst
          </button>
          <button
            onClick={() => setNewTextColor("#ffffff")}
            style={{
              flex: 1,
              backgroundColor: newTextColor === "#ffffff" ? "#ddd" : "#fff",
              color: "#000",
            }}
          >
            Biały tekst
          </button>
        </div>

        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          style={{ width: "100%", marginBottom: 4 }}
        />
        <button onClick={addNewType} style={{ width: "100%" }}>
          Dodaj
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [nodeTypesList, setNodeTypesList] = useState([
    { type: "Aktor", color: "#99ccff", textColor: "#000000" },
    { type: "Zdarzenie", color: "#ffd580", textColor: "#000000" },
    { type: "Hotspot", color: "#ff9999", textColor: "#000000" },
    { type: "Komenda", color: "#f6ce60", textColor: "#000000" },
    { type: "Read model", color: "#9256f9", textColor: "#ffffff" },
    { type: "Agregat", color: "#a6a6a6", textColor: "#000000" },
    { type: "External system", color: "#00c76f", textColor: "#000000" },
  ]);

  return (
    <ReactFlowProvider>
      <div style={{ display: "flex" }}>
        <Sidebar
          nodeTypesList={nodeTypesList}
          setNodeTypesList={setNodeTypesList}
        />
        <FlowCanvas nodeTypesList={nodeTypesList} />
      </div>
    </ReactFlowProvider>
  );
}
