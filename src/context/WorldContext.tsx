import {

  createContext,

  useCallback,

  useContext,

  useEffect,

  useMemo,

  useRef,

  useState,

  type ReactNode,

} from "react";

import { getEngineBridge } from "@/engine/bridge";

import { getNetworkSession } from "@/network/session";

import { detectStorageCapabilities } from "@/storage/capabilities";

import {

  openWorldFromFilePicker,

  saveWorldAsFile,

  saveWorldToFile,

} from "@/storage/fileAccess";

import {

  autosaveWorld,

  getLastOpenedProjectId,

  loadProjectFromIndexedDB,

  setLastOpenedProjectId,

} from "@/storage/indexeddb";

import type { ProjectDocument, StorageCapability } from "@/types/storage";

import type { NetworkSessionState } from "@/types/network";

import type {

  EditorState,

  CraftyPlayWorldExport,

  WorldObject,

  WorldScript,

} from "@/types/world";

import { createDefaultWorld, wouldCreateCycle } from "@/utils/world";



const AUTOSAVE_MS = 5000;



interface WorldContextValue {

  world: CraftyPlayWorldExport;

  document: ProjectDocument;

  editor: EditorState;

  engineReady: boolean;

  wasmLoaded: boolean;

  storage: StorageCapability;

  network: NetworkSessionState;

  selectedObject: WorldObject | null;

  activeScript: WorldScript | null;

  selectObject: (id: string | null) => void;

  updateObject: (id: string, patch: Partial<WorldObject>) => void;

  reparentObject: (id: string, newParentId: string | null) => void;

  createObject: (type: WorldObject["type"]) => void;

  deleteObject: (id: string) => void;

  updateScript: (id: string, source: string) => void;

  setMode: (mode: EditorState["mode"]) => void;

  openWorld: () => Promise<void>;

  saveWorld: () => Promise<void>;

  saveWorldAs: () => Promise<void>;

  connectWebSocket: (url: string) => void;

  connectWebRTC: (signalingUrl: string) => void;

  disconnectNetwork: () => void;

  exportJson: () => string;

}



const WorldContext = createContext<WorldContextValue | null>(null);



function createInitialDocument(): ProjectDocument {

  const projectId = crypto.randomUUID();

  return {

    world: createDefaultWorld(),

    fileName: null,

    fileHandle: null,

    projectId,

    source: "new",

  };

}



export function WorldProvider({ children }: { children: ReactNode }) {

  const [doc, setDoc] = useState<ProjectDocument>(createInitialDocument);

  const [editor, setEditor] = useState<EditorState>({

    selectedId: null,

    activeScriptId: null,

    mode: "edit",

    isDirty: false,

    fileName: null,

    lastSavedAt: null,

  });

  const [engineReady, setEngineReady] = useState(false);

  const [wasmLoaded, setWasmLoaded] = useState(false);

  const [network, setNetwork] = useState<NetworkSessionState>(

    getNetworkSession().getState(),

  );

  const [storage] = useState<StorageCapability>(detectStorageCapabilities());

  const [hydrated, setHydrated] = useState(false);



  const bridge = useMemo(() => getEngineBridge(), []);

  const netSession = useMemo(() => getNetworkSession(), []);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyingRemote = useRef(false);



  const world = doc.world;



  // IndexedDB から前回セッションを復元

  useEffect(() => {

    if (!storage.indexedDB) {

      setHydrated(true);

      return;

    }



    void (async () => {

      const lastId = await getLastOpenedProjectId();

      if (lastId) {

        const stored = await loadProjectFromIndexedDB(lastId);

        if (stored) {

          setDoc((d) => ({

            ...d,

            world: stored.world,

            projectId: stored.id,

            source: "indexeddb",

          }));

          setEditor((e) => ({

            ...e,

            fileName: stored.fileHandleKey ? stored.name : null,

            lastSavedAt: stored.updatedAt,

          }));

        }

      }

      setHydrated(true);

    })();

  }, [storage.indexedDB]);



  useEffect(() => {

    if (!hydrated) return;

    bridge.loadWorld(world);

    const unsub = bridge.onEvent((event) => {

      if (event.type === "scene:ready") {

        setEngineReady(true);

        setWasmLoaded(bridge.isWasmLoaded());

      }

      if (event.type === "object:selected") {

        setEditor((e) => ({ ...e, selectedId: event.id }));

      }

    });

    return unsub;

  }, [bridge, hydrated]);



  useEffect(() => {

    const unsubState = netSession.onStateChange(setNetwork);

    const unsubWorld = netSession.onWorldSync((remoteWorld, from) => {

      if (applyingRemote.current) return;

      applyingRemote.current = true;

      setDoc((d) => ({ ...d, world: remoteWorld, source: "network" }));

      bridge.loadWorld(remoteWorld);

      setEditor((e) => ({

        ...e,

        isDirty: true,

        fileName: `synced-from-${from.slice(0, 6)}`,

      }));

      applyingRemote.current = false;

    });

    const unsubPatch = netSession.onPatch((objectId, patch) => {

      if (applyingRemote.current) return;

      setDoc((d) => ({

        ...d,

        world: {

          ...d.world,

          objects: d.world.objects.map((o) =>

            o.id === objectId ? { ...o, ...patch } : o,

          ),

        },

      }));

    });

    return () => {

      unsubState();

      unsubWorld();

      unsubPatch();

    };

  }, [bridge, netSession]);



  // IndexedDB 自動保存（ブラウザ内完結）

  useEffect(() => {

    if (!hydrated || !editor.isDirty || !storage.indexedDB) return;



    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(() => {

      void autosaveWorld(doc.projectId, world);

      void setLastOpenedProjectId(doc.projectId);

      setEditor((e) => ({ ...e, lastSavedAt: new Date().toISOString() }));

    }, AUTOSAVE_MS);



    return () => {

      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    };

  }, [world, editor.isDirty, doc.projectId, hydrated, storage.indexedDB]);



  const selectedObject = useMemo(

    () => world.objects.find((o) => o.id === editor.selectedId) ?? null,

    [world.objects, editor.selectedId],

  );



  const activeScript = useMemo(() => {

    if (editor.activeScriptId) {

      return world.scripts.find((s) => s.id === editor.activeScriptId) ?? null;

    }

    if (selectedObject?.scriptId) {

      return world.scripts.find((s) => s.id === selectedObject.scriptId) ?? null;

    }

    return null;

  }, [world.scripts, editor.activeScriptId, selectedObject]);



  const markDirty = useCallback(() => {

    setEditor((e) => ({ ...e, isDirty: true }));

  }, []);



  const selectObject = useCallback(

    (id: string | null) => {

      setEditor((e) => ({ ...e, selectedId: id, activeScriptId: null }));

      bridge.send({ cmd: "selectObject", id });

    },

    [bridge],

  );



  const updateObject = useCallback(

    (id: string, patch: Partial<WorldObject>) => {

      setDoc((d) => {

        const objects = d.world.objects.map((o) =>

          o.id === id ? { ...o, ...patch } : o,

        );

        const updated = objects.find((o) => o.id === id);

        if (updated) bridge.syncObject(updated);

        if (network.status === "connected") {

          netSession.broadcastPatch(id, patch);

        }

        return { ...d, world: { ...d.world, objects } };

      });

      markDirty();

    },

    [bridge, markDirty, netSession, network.status],

  );



  const reparentObject = useCallback(

    (id: string, newParentId: string | null) => {

      if (wouldCreateCycle(world.objects, id, newParentId)) return;

      setDoc((d) => ({

        ...d,

        world: {

          ...d.world,

          objects: d.world.objects.map((o) =>

            o.id === id ? { ...o, parentId: newParentId } : o,

          ),

        },

      }));

      bridge.send({ cmd: "reparentObject", id, newParentId });

      markDirty();

    },

    [bridge, markDirty, world.objects],

  );



  const createObject = useCallback(

    (type: WorldObject["type"]) => {

      const id = crypto.randomUUID();

      const parentId =

        editor.selectedId ??

        world.objects.find((o) => o.parentId === null)?.id ??

        null;



      const base: WorldObject = {

        id,

        name: `${type}_${id.slice(0, 4)}`,

        type,

        parentId,

        transform: {

          position: { x: 0, y: 2, z: 0 },

          rotation: { x: 0, y: 0, z: 0 },

          scale: { x: 4, y: 4, z: 4 },

        },

        appearance:

          type === "Part" ? { color: "#6366f1", material: "plastic" } : undefined,

        visible: true,

      };



      setDoc((d) => ({

        ...d,

        world: { ...d.world, objects: [...d.world.objects, base] },

      }));

      bridge.send({ cmd: "createObject", object: base });

      selectObject(id);

      markDirty();

    },

    [bridge, editor.selectedId, markDirty, selectObject, world.objects],

  );



  const deleteObject = useCallback(

    (id: string) => {

      const root = world.objects.find((o) => o.parentId === null);

      if (root?.id === id) return;



      setDoc((d) => ({

        ...d,

        world: {

          ...d.world,

          objects: d.world.objects.filter((o) => o.id !== id && o.parentId !== id),

          scripts: d.world.scripts.filter((s) => s.attachedTo !== id),

        },

      }));

      bridge.send({ cmd: "deleteObject", id });

      if (editor.selectedId === id) selectObject(null);

      markDirty();

    },

    [bridge, editor.selectedId, markDirty, selectObject, world.objects],

  );



  const updateScript = useCallback(

    (id: string, source: string) => {

      setDoc((d) => ({

        ...d,

        world: {

          ...d.world,

          scripts: d.world.scripts.map((s) => (s.id === id ? { ...s, source } : s)),

        },

      }));

      markDirty();

    },

    [markDirty],

  );



  const setMode = useCallback(

    (mode: EditorState["mode"]) => {

      setEditor((e) => ({ ...e, mode }));

      bridge.send({ cmd: mode === "preview" ? "startPreview" : "stopPreview" });

    },

    [bridge],

  );



  const openWorld = useCallback(async () => {

    const opened = await openWorldFromFilePicker();

    setDoc(opened);

    bridge.loadWorld(opened.world);

    setEditor({

      selectedId: null,

      activeScriptId: null,

      mode: "edit",

      isDirty: false,

      fileName: opened.fileName,

      lastSavedAt: new Date().toISOString(),

    });

    if (storage.indexedDB) {

      await autosaveWorld(opened.projectId, opened.world);

      await setLastOpenedProjectId(opened.projectId);

    }

  }, [bridge, storage.indexedDB]);



  const saveWorld = useCallback(async () => {

    const updated = await saveWorldToFile(doc, world);

    setDoc(updated);

    if (storage.indexedDB) {

      await autosaveWorld(updated.projectId, world);

      await setLastOpenedProjectId(updated.projectId);

    }

    if (network.status === "connected") {

      netSession.broadcastWorld(world);

    }

    setEditor((e) => ({

      ...e,

      isDirty: false,

      fileName: updated.fileName,

      lastSavedAt: new Date().toISOString(),

    }));

  }, [doc, world, storage.indexedDB, network.status, netSession]);



  const saveWorldAs = useCallback(async () => {

    const updated = await saveWorldAsFile(world, doc);

    setDoc(updated);

    if (storage.indexedDB) {

      await autosaveWorld(updated.projectId, world);

      await setLastOpenedProjectId(updated.projectId);

    }

    setEditor((e) => ({

      ...e,

      isDirty: false,

      fileName: updated.fileName,

      lastSavedAt: new Date().toISOString(),

    }));

  }, [doc, world, storage.indexedDB]);



  const connectWebSocket = useCallback(

    (url: string) => netSession.connectWebSocket(url),

    [netSession],

  );



  const connectWebRTC = useCallback(

    (url: string) => netSession.connectWebRTC(url),

    [netSession],

  );



  const disconnectNetwork = useCallback(() => netSession.disconnect(), [netSession]);



  const exportJson = useCallback(() => JSON.stringify(world, null, 2), [world]);



  const value: WorldContextValue = {

    world,

    document: doc,

    editor,

    engineReady,

    wasmLoaded,

    storage,

    network,

    selectedObject,

    activeScript,

    selectObject,

    updateObject,

    reparentObject,

    createObject,

    deleteObject,

    updateScript,

    setMode,

    openWorld,

    saveWorld,

    saveWorldAs,

    connectWebSocket,

    connectWebRTC,

    disconnectNetwork,

    exportJson,

  };



  if (!hydrated) {

    return (

      <div className="flex h-screen items-center justify-center bg-surface-950 text-surface-400">

        Loading session…

      </div>

    );

  }



  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>;

}



export function useWorld(): WorldContextValue {

  const ctx = useContext(WorldContext);

  if (!ctx) throw new Error("useWorld must be used within WorldProvider");

  return ctx;

}


