import type {

  EditorCommand,

  EngineEvent,

  CraftyPlayWorldExport,

  WorldObject,

} from "@/types/world";

import { loadWasmEngine } from "@/engine/wasmLoader";



export interface EngineBridge {

  send(command: EditorCommand): void;

  onEvent(handler: (event: EngineEvent) => void): () => void;

  loadWorld(world: CraftyPlayWorldExport): void;

  syncObject(object: WorldObject): void;

  isReady(): boolean;

  /** true = 実 WASM モジュール, false = ブラウザ内モック */

  isWasmLoaded(): boolean;

}



type EventHandler = (event: EngineEvent) => void;



class MockEngineBridge implements EngineBridge {

  private handlers = new Set<EventHandler>();

  private ready = false;

  private wasmLoaded = false;



  constructor() {

    void loadWasmEngine().then((mod) => {

      this.wasmLoaded = mod?.ready ?? false;

      this.ready = true;

      this.emit({ type: "scene:ready" });

    });

  }



  send(command: EditorCommand): void {

    console.debug("[Engine/Mock]", command.cmd);

    if (command.cmd === "selectObject" && command.id) {

      this.emit({ type: "object:selected", id: command.id });

    }

    if (command.cmd === "startPreview") this.emit({ type: "preview:started" });

    if (command.cmd === "stopPreview") this.emit({ type: "preview:stopped" });

  }



  onEvent(handler: EventHandler): () => void {

    this.handlers.add(handler);

    return () => this.handlers.delete(handler);

  }



  loadWorld(world: CraftyPlayWorldExport): void {

    this.send({ cmd: "loadWorld", payload: world });

  }



  syncObject(object: WorldObject): void {

    this.emit({

      type: "object:transformed",

      id: object.id,

      transform: object.transform,

    });

  }



  isReady(): boolean {

    return this.ready;

  }



  isWasmLoaded(): boolean {

    return this.wasmLoaded;

  }



  private emit(event: EngineEvent): void {

    this.handlers.forEach((h) => h(event));

  }

}



let bridgeInstance: EngineBridge | null = null;



export function getEngineBridge(): EngineBridge {

  if (!bridgeInstance) {

    bridgeInstance = new MockEngineBridge();

  }

  return bridgeInstance;

}


