"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"

interface CustomDraggableTextProps {
  text: string
  position: { x: number; y: number }
  onPositionChange: (position: { x: number; y: number }) => void
  style: React.CSSProperties
  defaultPosition: "top" | "bottom"
}

export default function CustomDraggableText({
  text,
  position,
  onPositionChange,
  style,
  defaultPosition,
}: CustomDraggableTextProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const textRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Only enable dragging on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle mouse down event to start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!textRef.current) return

    // Prevent default behavior and text selection
    e.preventDefault()

    // Calculate the offset between mouse position and element position
    const rect = textRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    setDragOffset({ x: offsetX, y: offsetY })
    setIsDragging(true)
  }

  // Handle mouse move event during dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !textRef.current) return

    const parentElement = textRef.current.closest(".meme-container")
    if (!parentElement) return

    const parentRect = parentElement.getBoundingClientRect()

    // Calculate new position relative to the parent container
    const newX = e.clientX - parentRect.left - dragOffset.x
    const newY = e.clientY - parentRect.top - dragOffset.y

    // Apply bounds to keep text within parent container
    const maxX = parentRect.width - (textRef.current.offsetWidth || 0)
    const maxY = parentRect.height - (textRef.current.offsetHeight || 0)

    const boundedX = Math.max(0, Math.min(newX, maxX))
    const boundedY = Math.max(0, Math.min(newY, maxY))

    onPositionChange({ x: boundedX, y: boundedY })
  }

  // Handle mouse up event to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add and remove event listeners
  useEffect(() => {
    if (mounted) {
      if (isDragging) {
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)
      }

      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, mounted])

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!textRef.current) return

    // Prevent default behavior
    e.preventDefault()

    // Calculate the offset between touch position and element position
    const rect = textRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const offsetX = touch.clientX - rect.left
    const offsetY = touch.clientY - rect.top

    setDragOffset({ x: offsetX, y: offsetY })
    setIsDragging(true)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !textRef.current) return

    // Prevent default to stop scrolling while dragging
    e.preventDefault()

    const parentElement = textRef.current.closest(".meme-container")
    if (!parentElement) return

    const parentRect = parentElement.getBoundingClientRect()

    // Calculate new position relative to the parent container
    const touch = e.touches[0]
    const newX = touch.clientX - parentRect.left - dragOffset.x
    const newY = touch.clientY - parentRect.top - dragOffset.y

    // Apply bounds to keep text within parent container
    const maxX = parentRect.width - (textRef.current.offsetWidth || 0)
    const maxY = parentRect.height - (textRef.current.offsetHeight || 0)

    const boundedX = Math.max(0, Math.min(newX, maxX))
    const boundedY = Math.max(0, Math.min(newY, maxY))

    onPositionChange({ x: boundedX, y: boundedY })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Add and remove touch event listeners
  useEffect(() => {
    if (mounted) {
      if (isDragging) {
        window.addEventListener("touchmove", handleTouchMove, { passive: false })
        window.addEventListener("touchend", handleTouchEnd)
      }

      return () => {
        window.removeEventListener("touchmove", handleTouchMove)
        window.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isDragging, mounted])

  return (
    <motion.div
      ref={textRef}
      style={{
        ...style,
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 10,
        padding: "8px",
        maxWidth: "90%",
        textAlign: "center",
        cursor: "move",
        userSelect: "none",
        touchAction: "none",
      }}
      onMouseDown={mounted ? handleMouseDown : undefined}
      onTouchStart={mounted ? handleTouchStart : undefined}
      className={`draggable-text ${isDragging ? "dragging" : ""}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: isDragging ? "0 0 0 2px rgba(255,255,255,0.3)" : "none",
      }}
      transition={{ duration: 0.2 }}
      whileTap={{ scale: 1.05 }}
    >
      {text}
    </motion.div>
  )
}
