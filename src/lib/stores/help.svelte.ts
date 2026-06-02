class HelpState {
  open = $state(false);
  toggle(): void { this.open = !this.open; }
  show(): void { this.open = true; }
  hide(): void { this.open = false; }
}

export const help = new HelpState();
