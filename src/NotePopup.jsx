import React from "react";

export default function NotePopup({ isOpen, note, onChange, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          width: "300px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Notatka</h3>
        <textarea
          value={note}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          style={{ width: "100%", borderRadius: 8, padding: 8 }}
        />
        <div style={{ marginTop: 10, textAlign: "right" }}>
          <button onClick={onClose} style={{ padding: "6px 12px" }}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
