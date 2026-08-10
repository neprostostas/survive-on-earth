import "./styles.css";
import { Logger } from "@babylonjs/core/Misc/logger";
import { Game } from "./app/Game";

// Silence BJS engine banner (WebGL / shader compile messages); keep real errors.
Logger.LogLevels = Logger.ErrorLogLevel;

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const uiRoot = document.querySelector<HTMLElement>("#ui-root");

if (!canvas || !uiRoot) throw new Error("Game mount elements are missing");

const game = new Game(canvas, uiRoot);
void game.start();
