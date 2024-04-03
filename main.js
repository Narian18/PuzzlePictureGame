import { PuzzleGame } from "./puzzle-game";

    
const game = new PuzzleGame('favicon.png', 5);

window.addEventListener('mousedown', (event) => (game.onMouseDown(event)));
window.addEventListener('dragend', (event) => (game.onDragEnd(event)));
window.addEventListener('resize', () => (game.onWindowResize));
game.start();
