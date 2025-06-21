import { BaseEdge, getBezierPath } from "reactflow";

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const handleEditNote = (e) => {
    e.stopPropagation();
    data.onOpenNotePopup?.(id, data.note || "");
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <foreignObject
        x={labelX - 6}
        y={labelY - 6}
        width={12}
        height={12}
        style={{ overflow: "visible" }}
      >
        <div
          onClick={handleEditNote}
          title={data.note}
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "radial-gradient(circle, white 30%, #666 100%)",
            border: "1px solid #333",
            boxShadow: "0 0 4px rgba(0,0,0,0.3)",
            cursor: "pointer",
          }}
        />
      </foreignObject>
    </>
  );
}
