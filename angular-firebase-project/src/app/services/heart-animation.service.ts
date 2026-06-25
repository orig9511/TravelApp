import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class HeartAnimationService {
  launch(sourceEvent: MouseEvent): void {
    const targetEl = document.getElementById("nav-heart-icon");
    if (!targetEl) return;

    const targetRect = targetEl.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    const heart = document.createElement("div");
    heart.textContent = "♥";
    heart.style.cssText = [
      "position: fixed",
      `left: ${sourceEvent.clientX}px`,
      `top: ${sourceEvent.clientY}px`,
      "transform: translate(-50%, -50%) scale(1)",
      "color: #e53935",
      "font-size: 2rem",
      "pointer-events: none",
      "z-index: 9999",
      "transition: none",
      "will-change: transform, left, top, opacity, font-size",
    ].join(";");

    document.body.appendChild(heart);

    const duration = 700;

    // Force reflow before starting transition
    heart.getBoundingClientRect();

    // Move towards target, stay fully visible during travel
    heart.style.transition = `left ${duration}ms cubic-bezier(0.4,0,0.2,1), top ${duration}ms cubic-bezier(0.4,0,0.2,1), font-size ${duration}ms ease, transform ${duration}ms ease`;
    heart.style.left = `${targetX}px`;
    heart.style.top = `${targetY}px`;
    heart.style.fontSize = "0.6rem";
    heart.style.transform = "translate(-50%, -50%) scale(0.7)";

    // Fade out only in the last 15% of the animation
    setTimeout(() => {
      heart.style.transition = "opacity 0.12s ease";
      heart.style.opacity = "0";
    }, duration * 0.85);

    setTimeout(() => heart.remove(), duration + 130);
  }
}
