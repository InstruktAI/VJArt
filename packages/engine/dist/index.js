export class VJEngine {
    currentState = null;
    grid = [];
    width = 80;
    height = 40;
    constructor(width = 80, height = 40) {
        this.width = width;
        this.height = height;
        this.initGrid();
    }
    initGrid() {
        this.grid = Array.from({ length: this.height }, () => Array.from({ length: this.width }, () => ' '));
    }
    applyWorkload(workload) {
        this.currentState = workload.state;
        // This is where the magic happens: generators, coupling, etc.
        // For now, let's just do a simple NCA-like update stub
        this.update();
    }
    drawUI() {
        if (!this.currentState?.ui)
            return;
        this.currentState.ui.forEach(sprite => {
            const { rect } = sprite.region;
            const startX = Math.floor(rect[0] * this.width);
            const startY = Math.floor(rect[1] * this.height);
            sprite.render.glyph_rows.forEach((row, dy) => {
                for (let dx = 0; dx < row.length; dx++) {
                    const x = startX + dx;
                    const y = startY + dy;
                    if (x < this.width && y < this.height) {
                        this.grid[y][x] = row[dx];
                    }
                }
            });
        });
    }
    update() {
        if (!this.currentState)
            return;
        // Minimal generator simulation
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const noise = Math.random();
                const weight = this.currentState.field_program.generators[0]?.weight || 0.5;
                if (noise < weight * 0.1) {
                    this.grid[y][x] = '#';
                }
                else if (noise > 0.9) {
                    this.grid[y][x] = '.';
                }
                else {
                    this.grid[y][x] = ' ';
                }
            }
        }
        this.drawUI();
    }
    getGrid() {
        return this.grid;
    }
}
//# sourceMappingURL=index.js.map