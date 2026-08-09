import "./styles.css";
import { Game } from "./app/Game";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const uiRoot = document.querySelector<HTMLElement>("#ui-root");

if (!canvas || !uiRoot) throw new Error("Game mount elements are missing");

const game = new Game(canvas, uiRoot);
void game.start();
