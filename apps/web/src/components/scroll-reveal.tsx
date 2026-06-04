"use client";
import { useEffect, useRef } from "react";

/**
 * Attaches an IntersectionObserver to a container element.
 * All children with class "reveal" or "reveal-left" inside
 * the container get "is-visible" added when they scroll into view.
 */
export function useScrollReveal(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!containerRef.current) return;

    const targets = containerRef.current.querySelectorAll(".reveal, .reveal-left");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -32px 0px" }
    );

    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [containerRef]);
}

/**
 * A self-contained scroll-reveal wrapper.
 * Usage: <ScrollReveal delay={200}>...</ScrollReveal>
 */
export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -32px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${direction === "left" ? "reveal-left" : "reveal"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
