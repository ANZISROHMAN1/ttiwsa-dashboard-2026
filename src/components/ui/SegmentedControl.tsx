"use client";

import { useRef, useEffect, useState } from "react";

interface SegmentedControlProps<T extends string> {
  segments: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState<React.CSSProperties>({});

  // Update slider position when value changes
  useEffect(() => {
    if (!containerRef.current) return;
    const activeIndex = segments.findIndex((s) => s.value === value);
    const buttons = containerRef.current.querySelectorAll("button");
    const activeButton = buttons[activeIndex];

    if (activeButton) {
      setSliderStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [value, segments]);

  return (
    <div
      ref={containerRef}
      className={`segmented-control ${className || ""}`}
      role="tablist"
    >
      <div className="segmented-slider" style={sliderStyle} />
      {segments.map((segment) => (
        <button
          key={segment.value}
          role="tab"
          aria-selected={value === segment.value}
          className={value === segment.value ? "active" : ""}
          onClick={() => onChange(segment.value)}
        >
          {segment.label}
        </button>
      ))}
    </div>
  );
}
