import React from "react";

export type IconDef = {
  id: string;
  label: string;
  svg: (color: string, size: number) => React.ReactElement;
};

export type IllustrationDef = {
  id: string;
  label: string;
  svg: (color: string) => React.ReactElement;
};

export const ICONS: IconDef[] = [
  {
    id: "dove",
    label: "Dove",
    svg: (color, size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C10.5 4 7 5.5 4 6C4 6 2 8 2 11C2 14 4 16 4 16L8 18L12 22L14 18C14 18 20 16 22 12C22 10 20 8 18 7C16 6 14 3 12 2Z" fill={color} opacity="0.9"/>
        <path d="M8 10C8 10 10 9 12 10" stroke={color} strokeWidth="0.5" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: "cross",
    label: "Cross",
    svg: (color, size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="2" width="4" height="20" rx="0.5" fill={color}/>
        <rect x="5" y="6" width="14" height="4" rx="0.5" fill={color}/>
      </svg>
    ),
  },
  {
    id: "candle",
    label: "Candle",
    svg: (color, size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C12 2 10 5 10 7C10 8.1 10.9 9 12 9C13.1 9 14 8.1 14 7C14 5 12 2 12 2Z" fill={color} opacity="0.8"/>
        <rect x="11" y="9" width="2" height="11" fill={color}/>
        <rect x="9" y="20" width="6" height="2" rx="0.5" fill={color}/>
      </svg>
    ),
  },
  {
    id: "flower",
    label: "Flower",
    svg: (color, size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="3" fill={color} opacity="0.6"/>
        <circle cx="9" cy="10" r="3" fill={color} opacity="0.5"/>
        <circle cx="15" cy="10" r="3" fill={color} opacity="0.5"/>
        <circle cx="10" cy="13" r="3" fill={color} opacity="0.4"/>
        <circle cx="14" cy="13" r="3" fill={color} opacity="0.4"/>
        <circle cx="12" cy="11" r="2" fill={color}/>
        <rect x="11.5" y="14" width="1" height="8" fill={color} opacity="0.7"/>
      </svg>
    ),
  },
  {
    id: "tree",
    label: "Tree",
    svg: (color, size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L6 10H9L5 16H10L7 22H17L14 16H19L15 10H18L12 2Z" fill={color} opacity="0.8"/>
        <rect x="11" y="18" width="2" height="4" fill={color}/>
      </svg>
    ),
  },
  {
    id: "heart",
    label: "Heart",
    svg: (color, size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" fill={color}/>
      </svg>
    ),
  },
  {
    id: "praying-hands",
    label: "Praying Hands",
    svg: (color, size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L10 8L7 14L10 16L12 22L14 16L17 14L14 8L12 2Z" fill={color} opacity="0.8"/>
        <path d="M10 8C10 8 8 10 8 12" stroke={color} strokeWidth="1" opacity="0.5"/>
        <path d="M14 8C14 8 16 10 16 12" stroke={color} strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: "sunrise",
    label: "Sunrise",
    svg: (color, size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8C8.69 8 6 10.69 6 14H18C18 10.69 15.31 8 12 8Z" fill={color} opacity="0.7"/>
        <rect x="2" y="14" width="20" height="1" fill={color} opacity="0.5"/>
        <line x1="12" y1="2" x2="12" y2="5" stroke={color} strokeWidth="1.5"/>
        <line x1="4.22" y1="7.22" x2="5.64" y2="8.64" stroke={color} strokeWidth="1.5"/>
        <line x1="19.78" y1="7.22" x2="18.36" y2="8.64" stroke={color} strokeWidth="1.5"/>
        <line x1="1" y1="14" x2="3" y2="14" stroke={color} strokeWidth="1.5"/>
        <line x1="21" y1="14" x2="23" y2="14" stroke={color} strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: "leaf",
    label: "Leaf",
    svg: (color, size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22.23C7.76 17.07 9.5 11.67 17 8Z" fill={color} opacity="0.6"/>
        <path d="M20.5 3.5C15 3.5 11 7 11 12C11 17 15 20.5 20.5 20.5C20.5 20.5 22 3.5 20.5 3.5Z" fill={color} opacity="0.8"/>
      </svg>
    ),
  },
  {
    id: "star",
    label: "Star",
    svg: (color, size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={color}/>
      </svg>
    ),
  },
];

export const ILLUSTRATIONS: IllustrationDef[] = [
  {
    id: "floral-corner",
    label: "Floral Corner",
    svg: (color) => (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M120 120C100 100 80 110 60 100C40 90 30 70 20 50C10 30 0 10 0 0" stroke={color} strokeWidth="1" fill="none" opacity="0.4"/>
        <circle cx="60" cy="100" r="8" fill={color} opacity="0.2"/>
        <circle cx="40" cy="80" r="6" fill={color} opacity="0.15"/>
        <circle cx="20" cy="50" r="5" fill={color} opacity="0.1"/>
        <path d="M80 110C75 105 85 95 90 100C95 105 85 115 80 110Z" fill={color} opacity="0.2"/>
        <path d="M50 85C45 80 55 70 60 75C65 80 55 90 50 85Z" fill={color} opacity="0.15"/>
      </svg>
    ),
  },
  {
    id: "wave-pattern",
    label: "Wave Pattern",
    svg: (color) => (
      <svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 30C20 10 40 10 60 30C80 50 100 50 120 30C140 10 160 10 180 30C200 50 200 50 200 30" stroke={color} strokeWidth="1" fill="none" opacity="0.3"/>
        <path d="M0 40C20 20 40 20 60 40C80 60 100 60 120 40C140 20 160 20 180 40C200 60 200 60 200 40" stroke={color} strokeWidth="0.5" fill="none" opacity="0.15"/>
      </svg>
    ),
  },
  {
    id: "leaf-pattern",
    label: "Leaf Pattern",
    svg: (color) => (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 0C50 0 60 20 50 40C40 60 50 80 50 100" stroke={color} strokeWidth="1" opacity="0.3"/>
        <path d="M50 20C40 15 35 25 40 30C45 35 55 25 50 20Z" fill={color} opacity="0.15"/>
        <path d="M50 40C60 35 65 45 60 50C55 55 45 45 50 40Z" fill={color} opacity="0.12"/>
        <path d="M50 60C40 55 35 65 40 70C45 75 55 65 50 60Z" fill={color} opacity="0.1"/>
      </svg>
    ),
  },
  {
    id: "abstract-lines",
    label: "Abstract Lines",
    svg: (color) => (
      <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="0" x2="150" y2="150" stroke={color} strokeWidth="0.5" opacity="0.15"/>
        <line x1="30" y1="0" x2="150" y2="120" stroke={color} strokeWidth="0.5" opacity="0.12"/>
        <line x1="60" y1="0" x2="150" y2="90" stroke={color} strokeWidth="0.5" opacity="0.1"/>
        <line x1="0" y1="30" x2="120" y2="150" stroke={color} strokeWidth="0.5" opacity="0.12"/>
        <line x1="0" y1="60" x2="90" y2="150" stroke={color} strokeWidth="0.5" opacity="0.1"/>
      </svg>
    ),
  },
  {
    id: "dots-pattern",
    label: "Dots Pattern",
    svg: (color) => (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {[0, 20, 40, 60, 80].map((x) =>
          [0, 20, 40, 60, 80].map((y) => (
            <circle key={`${x}-${y}`} cx={x + 10} cy={y + 10} r="2" fill={color} opacity={0.1 + Math.random() * 0.1}/>
          ))
        )}
      </svg>
    ),
  },
  {
    id: "gentle-arch",
    label: "Gentle Arch",
    svg: (color) => (
      <svg width="200" height="100" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 100C0 100 50 20 100 20C150 20 200 100 200 100" stroke={color} strokeWidth="1" fill="none" opacity="0.25"/>
        <path d="M20 100C20 100 60 40 100 40C140 40 180 100 180 100" stroke={color} strokeWidth="0.5" fill="none" opacity="0.15"/>
      </svg>
    ),
  },
];

export function getIconById(id: string): IconDef | undefined {
  return ICONS.find((icon) => icon.id === id);
}

export function getIllustrationById(id: string): IllustrationDef | undefined {
  return ILLUSTRATIONS.find((ill) => ill.id === id);
}
