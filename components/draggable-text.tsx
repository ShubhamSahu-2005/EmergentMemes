"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Draggable from "react-draggable"

interface DraggableTextProps {
  text: string
  position: { x: number; y: number }
  onPositionChange: (position: { x: number; y: number }) => void
  style: React.CSSProperties
  defaultPosition: "top" | "bottom"
}

export default function DraggableText({
  text,
  position,
  onPositionChange,
  style,
  defaultPosition,
}: DraggableTextProps) {
  const [mounted, setMounted] = useState(false)

  // Only render the draggable component on the client side
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder with the same styling but not draggable
    return (
      <div
        className={`absolute ${defaultPosition === "top" ? "top-0" : "bottom-0"} left-0 right-0 p-2 text-center`}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        <p style={style}>{text}</p>
      </div>
    )
  }

  return (
    <Draggable bounds="parent" position={position} onStop={(e, data) => onPositionChange({ x: data.x, y: data.y })}>
      <div className="absolute p-2 text-center cursor-move" style={{ zIndex: 10 }}>
        <p style={style}>{text}</p>
      </div>
    </Draggable>
  )
}
