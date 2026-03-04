import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useEffect } from "react";

function Avatar() {
  const gltf = useGLTF("/models/girl_with_glasses.glb");
  useEffect(() => {
    let disposed = false;
    const timers: number[] = [];

    // Collect meshes that actually have morph targets
    const meshes: THREE.Mesh[] = [];
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.morphTargetDictionary && m.morphTargetInfluences) {
        meshes.push(m);
      }
    });

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    const setMorph = (key: string, value: number) => {
      for (const m of meshes) {
        const idx = m.morphTargetDictionary?.[key];
        if (idx === undefined) continue;
        m.morphTargetInfluences![idx] = clamp01(value);
      }
    };

    const clearMouth = () => {
      for (const m of meshes) {
        const dict = m.morphTargetDictionary;
        const inf = m.morphTargetInfluences;
        if (!dict || !inf) continue;

        // Clear only mouth-ish keys (so we don't zero eyes/brows)
        for (const [name, idx] of Object.entries(dict)) {
          const n = name.toLowerCase();
          const isMouth =
            n.includes("mth") ||
            n.includes("mouth") ||
            /(^|[_-])(aa|ih|uh|ou|ee|oh|a|i|u|e|o)($|[_-])/.test(n);

          if (isMouth) inf[idx] = 0;
        }
      }
    };

    // Find best matching mouth keys for A/E/I/O/U
    const pickMouthKey = (vowel: "a" | "e" | "i" | "o" | "u") => {
      // Preference order for common naming conventions
      const patterns: Record<typeof vowel, RegExp[]> = {
        a: [/(^|[_-])aa($|[_-])/, /(mth.*a)\b/, /(^|[_-])a($|[_-])/],
        e: [/(^|[_-])ee($|[_-])/, /(mth.*e)\b/, /(^|[_-])e($|[_-])/],
        i: [/(^|[_-])ih($|[_-])/, /(mth.*i)\b/, /(^|[_-])i($|[_-])/],
        o: [/(^|[_-])oh($|[_-])/, /(mth.*o)\b/, /(^|[_-])o($|[_-])/],
        u: [/(^|[_-])ou($|[_-])/, /(mth.*u)\b/, /(^|[_-])u($|[_-])/],
      };

      for (const m of meshes) {
        const dict = m.morphTargetDictionary;
        if (!dict) continue;

        const keys = Object.keys(dict);
        for (const re of patterns[vowel]) {
          const found = keys.find((k) => re.test(k.toLowerCase()));
          if (found) return found;
        }
      }
      return null;
    };

    const mouthKeys = {
      a: pickMouthKey("a"),
      e: pickMouthKey("e"),
      i: pickMouthKey("i"),
      o: pickMouthKey("o"),
      u: pickMouthKey("u"),
    };

    const hasAnyMouth =
      mouthKeys.a || mouthKeys.e || mouthKeys.i || mouthKeys.o || mouthKeys.u;

    // Optional blink while speaking (uses your VRoid eye close)
    const blinkOnce = () => {
      setMorph("Fcl_EYE_Close", 1);
      const t = window.setTimeout(() => setMorph("Fcl_EYE_Close", 0), 120);
      timers.push(t);
    };

    const scheduleBlink = () => {
      if (disposed) return;
      blinkOnce();
      const next = 2500 + Math.random() * 2500;
      const t = window.setTimeout(scheduleBlink, next);
      timers.push(t);
    };
    scheduleBlink();

    // Your requested “script”
    // (space = short transition, comma = pause)
    const script = "ao ao i i i ue ue oi oi ao , ii ii ii ao ao aoao ao uuuu";

    // Expand "ao" -> ['a','o'] etc.
    const expandToken = (tok: string): ("a" | "e" | "i" | "o" | "u")[] => {
      const out: any[] = [];
      for (const ch of tok.toLowerCase()) {
        if ("aeiou".includes(ch)) out.push(ch);
      }
      return out;
    };

    // Build phoneme timeline
    const timeline: (
      | { kind: "vowel"; v: "a" | "e" | "i" | "o" | "u" }
      | { kind: "pause"; ms: number }
    )[] = [];

    for (const raw of script.split(/\s+/)) {
      if (!raw) continue;

      if (raw === "," || raw.includes(",")) {
        // token may be "ao," or ","
        const cleaned = raw.replace(/,/g, "");
        if (cleaned) {
          for (const v of expandToken(cleaned))
            timeline.push({ kind: "vowel", v });
        }
        timeline.push({ kind: "pause", ms: 450 });
        continue;
      }

      const vowels = expandToken(raw);
      if (vowels.length === 0) continue;

      for (const v of vowels) timeline.push({ kind: "vowel", v });
    }

    // Speaking engine
    let step = 0;

    const speakStep = () => {
      if (disposed) return;
      if (step >= timeline.length) {
        // end
        clearMouth();
        setMorph("Fcl_ALL_Joy", 0);
        setMorph("Fcl_ALL_Neutral", 1);
        return;
      }

      const item = timeline[step++];
      if (item.kind === "pause") {
        clearMouth();
        // small idle expression during pause
        if (!hasAnyMouth) {
          setMorph("Fcl_ALL_Joy", 0);
          setMorph("Fcl_ALL_Neutral", 1);
        }
        const t = window.setTimeout(speakStep, item.ms);
        timers.push(t);
        return;
      }

      // vowel
      clearMouth();

      if (hasAnyMouth) {
        // drive mouth morph
        const key = mouthKeys[item.v];
        if (key) setMorph(key, 1.0);

        // small naturalism: tiny joy while speaking
        setMorph("Fcl_ALL_Joy", 0.15);
        setMorph("Fcl_ALL_Neutral", 0);
      } else {
        // fallback: no mouth shapes → pulse Joy to simulate speech
        const pulse = item.v === "i" ? 0.55 : item.v === "u" ? 0.45 : 0.5;
        setMorph("Fcl_ALL_Joy", pulse);
        setMorph("Fcl_ALL_Neutral", 0);
      }

      // Duration per phoneme
      const duration = item.v === "u" ? 180 : 130;
      const t = window.setTimeout(() => {
        // release quickly
        if (hasAnyMouth) {
          const key = mouthKeys[item.v];
          if (key) setMorph(key, 0);
        }
        speakStep();
      }, duration);
      timers.push(t);
    };

    // Initialize face
    setMorph("Fcl_ALL_Neutral", 1);
    setMorph("Fcl_ALL_Joy", 0);

    // Log what it found (so you can verify)
    console.log("Detected mouth keys:", mouthKeys);

    speakStep();

    return () => {
      disposed = true;
      for (const t of timers) window.clearTimeout(t);
    };
  }, [gltf]);

  return <primitive object={gltf.scene} />;
}

export default function AvatarCanvas() {
  return (
    <Canvas camera={{ position: [0, 1.4, 2.2], fov: 35 }}>
      <hemisphereLight args={[0xffffff, 0x444444, 1]} />
      <Avatar />
      <OrbitControls target={[0, 1.2, 0]} />
    </Canvas>
  );
}

useGLTF.preload("/models/avatar.glb");
