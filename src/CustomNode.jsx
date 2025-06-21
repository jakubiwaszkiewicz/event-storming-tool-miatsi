import React from "react";
import { Handle, Position } from "reactflow";

const CustomNode = ({ id, data }) => {
  const handleInputChange = (e) => {
    data.onChange?.(e.target.value);
  };

  const handleNoteClick = (e) => {
    e.stopPropagation();
    data.onOpenNotePopup?.(id, data.note || "");
  };

  return (
    <div
      title={data.note}
      style={{
        background: data.color || "#fff",
        padding: 10,
        borderRadius: 10,
        minWidth: 120,
        minHeight: 60,
        position: "relative",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#555" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#555" }}
      />

      <button
        onClick={data.onDelete}
        style={{
          position: "absolute",
          top: 4,
          right: 6,
          border: "none",
          background: "transparent",
          color: "#333",
          fontWeight: "bold",
          cursor: "pointer",
        }}
        title="Usuń"
      >
        ×
      </button>

      <textarea
        value={data.label}
        onChange={handleInputChange}
        style={{
          width: "100%",
          border: "none",
          resize: "none",
          background: "transparent",
          fontSize: 14,
          fontWeight: "bold",
          outline: "none",
          color: data.textColor || "#000000",
        }}
      />

      <div
        onClick={handleNoteClick}
        title="Edytuj notatkę"
        style={{
          position: "absolute",
          bottom: 4,
          right: 6,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "radial-gradient(circle, white 30%, #666 100%)",
          border: "1px solid #333",
          boxShadow: "0 0 4px rgba(0,0,0,0.3)",
          cursor: "pointer",
        }}
      />
    </div>
  );
};

export default CustomNode;
