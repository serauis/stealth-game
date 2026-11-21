// input.js — keyboard + mouse state, and click-through buttons.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // keys pressed since the last frame was consumed
    this.mouse = { x: 0, y: 0, clicked: false };
    this.onFirstGesture = null;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (this.onFirstGesture) this.onFirstGesture();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.mouse.clicked = true;
      if (this.onFirstGesture) this.onFirstGesture();
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  down(code) {
    return this.keys.has(code);
  }

  // True once, on the frame the key went down.
  wasPressed(code) {
    return this.pressed.has(code);
  }

  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }

  // Returns the clicked button (from a list of {x,y,w,h}) or null.
  clickedButton(buttons) {
    if (!this.mouse.clicked) return null;
    for (const b of buttons) {
      if (
        this.mouse.x >= b.x &&
        this.mouse.x <= b.x + b.w &&
        this.mouse.y >= b.y &&
        this.mouse.y <= b.y + b.h
      ) {
        return b;
      }
    }
    return null;
  }
}
