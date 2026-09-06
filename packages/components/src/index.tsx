import type {
  CSSProperties,
  HTMLAttributes,
  ImgHTMLAttributes,
  ReactNode,
} from "react";

export interface ComponentProps
  extends HTMLAttributes<HTMLElement> {
  styles?: CSSProperties;
  children?: ReactNode;
}

export function Container({
  styles,
  children,
  ...props
}: ComponentProps) {
  return (
    <div style={styles} {...props}>
      {children}
    </div>
  );
}

export function Heading({
  styles,
  children,
  ...props
}: ComponentProps) {
  return (
    <h1 style={styles} {...props}>
      {children}
    </h1>
  );
}

export function Text({
  styles,
  children,
  ...props
}: ComponentProps) {
  return (
    <p style={styles} {...props}>
      {children}
    </p>
  );
}

export function Button({
  styles,
  children,
  ...props
}: ComponentProps) {
  return (
    <button style={styles} {...props}>
      {children}
    </button>
  );
}

export function Image({
  styles,
  src,
  alt,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & {
  styles?: CSSProperties;
}) {
  return (
    <img
      src={src}
      alt={alt ?? ""}
      style={styles}
      {...props}
    />
  );
}