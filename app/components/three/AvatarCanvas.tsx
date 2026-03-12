import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useCallback, useEffect, useMemo, useRef } from "react";

type AvatarPhase = "idle" | "reasoning" | "speaking" | "done";
type AvatarProps = {
  phase: AvatarPhase;
  expressionWeights: Record<string, number>;
  speakingText: string;
  streamCompleted: boolean;
  onSpeechDrained?: () => void;
};

function Avatar({
  phase,
  expressionWeights,
  speakingText,
  streamCompleted,
  onSpeechDrained,
}: AvatarProps) {
  const gltf = useGLTF("/models/cool_man_avatar.vrm");
  const speechQueueRef = useRef<string[]>([]);
  const spokenLengthRef = useRef(0);
  const activeExpressionKeysRef = useRef<Set<string>>(new Set());
  const drainNotifiedRef = useRef(false);
  const unresolvedChannelLogRef = useRef<Set<string>>(new Set());

  const allMorphKeys = useMemo(() => {
    const keys = new Set<string>();
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.morphTargetDictionary) return;
      for (const key of Object.keys(m.morphTargetDictionary)) {
        keys.add(key);
      }
    });
    return Array.from(keys);
  }, [gltf]);

  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  const setMorph = useCallback(
    (key: string, value: number) => {
      gltf.scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh || !m.morphTargetDictionary || !m.morphTargetInfluences) {
          return;
        }
        const idx = m.morphTargetDictionary?.[key];
        if (idx === undefined) return;
        m.morphTargetInfluences![idx] = clamp01(value);
      });
    },
    [gltf],
  );

  const clearMouth = useCallback(() => {
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const dict = m.morphTargetDictionary;
      const inf = m.morphTargetInfluences;
      if (!dict || !inf) return;

      for (const [name, idx] of Object.entries(dict)) {
        const n = name.toLowerCase();
        const isMouth =
          n.includes("mth") ||
          n.includes("mouth") ||
          /(^|[_-])(aa|ih|uh|ou|ee|oh|a|i|u|e|o)($|[_-])/.test(n);
        if (isMouth) inf[idx] = 0;
      }
    });
  }, [gltf]);

  const mouthKeys = useMemo(() => {
    const pickMouthKey = (vowel: "a" | "e" | "i" | "o" | "u") => {
      const patterns: Record<typeof vowel, RegExp[]> = {
        a: [/(^|[_-])aa($|[_-])/, /mth.*a/, /(^|[_-])a($|[_-])/],
        e: [/(^|[_-])ee($|[_-])/, /mth.*e/, /(^|[_-])e($|[_-])/],
        i: [/(^|[_-])ih($|[_-])/, /mth.*i/, /(^|[_-])i($|[_-])/],
        o: [/(^|[_-])oh($|[_-])/, /mth.*o/, /(^|[_-])o($|[_-])/],
        u: [/(^|[_-])ou($|[_-])/, /mth.*u/, /(^|[_-])u($|[_-])/],
      };

      const lowerKeys = allMorphKeys.map((key) => ({
        key,
        lower: key.toLowerCase(),
      }));
      for (const re of patterns[vowel]) {
        const found = lowerKeys.find(({ lower }) => re.test(lower));
        if (found) return found.key;
      }
      return null;
    };

    return {
      a: pickMouthKey("a"),
      e: pickMouthKey("e"),
      i: pickMouthKey("i"),
      o: pickMouthKey("o"),
      u: pickMouthKey("u"),
    };
  }, [allMorphKeys]);

  const expressionMorphMap = useMemo(() => {
    const lowerKeys = allMorphKeys.map((key) => ({
      key,
      lower: key.toLowerCase(),
    }));
    const findExact = (...candidates: string[]) => {
      for (const candidate of candidates) {
        const found = lowerKeys.find(({ lower }) => lower === candidate);
        if (found) return found.key;
      }
      return null;
    };
    const findRegex = (patterns: RegExp[]) => {
      for (const pattern of patterns) {
        const found = lowerKeys.find(({ lower }) => pattern.test(lower));
        if (found) return found.key;
      }
      return null;
    };

    const neutral =
      findExact("fcl_all_neutral", "neutral") ??
      findRegex([/neutral/, /default/, /relax/]);
    const happy =
      findExact("fcl_all_joy", "joy", "happy") ??
      findRegex([/joy/, /smile/, /happy/]);
    const angry =
      findExact("fcl_all_angry", "angry", "anger") ??
      findRegex([/angry/, /anger/]);
    const sad =
      findExact("fcl_all_sorrow", "sorrow", "sad") ??
      findRegex([/sorrow/, /sad/]);
    const surprised =
      findExact("fcl_all_surprised", "surprised", "surprise") ??
      findRegex([/surprise/, /surprised/, /open/]);
    const thinking =
      findExact("fcl_all_serious", "thinking", "serious") ??
      findRegex([/think/, /serious/, /focus/]) ??
      neutral;

    return { neutral, happy, angry, sad, surprised, thinking };
  }, [allMorphKeys]);

  const resolveExpressionMorphKey = useCallback(
    (channel: string) => {
      const normalized = channel.toLowerCase();
      const mapped =
        expressionMorphMap[normalized as keyof typeof expressionMorphMap];
      if (mapped) return mapped;

      const exact = allMorphKeys.find(
        (key) => key.toLowerCase() === normalized,
      );
      if (exact) return exact;

      return null;
    },
    [allMorphKeys, expressionMorphMap],
  );

  useEffect(() => {
    if (allMorphKeys.length === 0) return;
    console.log("Avatar morph parameters:", allMorphKeys);
    console.log("Resolved expression mapping:", expressionMorphMap);
  }, [allMorphKeys, expressionMorphMap]);

  useEffect(() => {
    if (speakingText.length < spokenLengthRef.current) {
      speechQueueRef.current = [];
      spokenLengthRef.current = 0;
      drainNotifiedRef.current = false;
    }

    const delta = speakingText.slice(spokenLengthRef.current);
    spokenLengthRef.current = speakingText.length;
    if (delta.length > 0) {
      speechQueueRef.current.push(...delta.split(""));
      drainNotifiedRef.current = false;
    }
  }, [speakingText]);

  useEffect(() => {
    const timers: number[] = [];

    const intervalId = window.setInterval(() => {
      const isSpeechMode = phase === "speaking" || streamCompleted;
      if (!isSpeechMode && speechQueueRef.current.length === 0) {
        return;
      }

      const char = speechQueueRef.current.shift();
      if (!char) {
        clearMouth();
        if (streamCompleted && !drainNotifiedRef.current) {
          drainNotifiedRef.current = true;
          onSpeechDrained?.();
        }
        return;
      }

      const lower = char.toLowerCase();
      if ("aeiou".includes(lower)) {
        clearMouth();
        const key = mouthKeys[lower as "a" | "e" | "i" | "o" | "u"];
        if (key) {
          setMorph(key, 1);
          const release = window.setTimeout(() => setMorph(key, 0), 70);
          timers.push(release);
        } else {
          setMorph("Fcl_ALL_Joy", 0.45);
          const release = window.setTimeout(
            () => setMorph("Fcl_ALL_Joy", 0.2),
            70,
          );
          timers.push(release);
        }
      } else {
        // brief rest for consonants/space to avoid nonstop wide-open mouth
        clearMouth();
      }
    }, 85);

    return () => {
      window.clearInterval(intervalId);
      for (const t of timers) window.clearTimeout(t);
      clearMouth();
    };
  }, [
    phase,
    streamCompleted,
    mouthKeys,
    clearMouth,
    setMorph,
    onSpeechDrained,
  ]);

  useEffect(() => {
    const nextAppliedKeys = new Set<string>();
    for (const [channel, value] of Object.entries(expressionWeights)) {
      const resolved = resolveExpressionMorphKey(channel);
      if (!resolved) {
        if (!unresolvedChannelLogRef.current.has(channel)) {
          unresolvedChannelLogRef.current.add(channel);
          console.warn(`No morph mapping for expression channel: ${channel}`);
        }
        continue;
      }
      setMorph(resolved, value);
      nextAppliedKeys.add(resolved);
    }

    for (const previousKey of activeExpressionKeysRef.current) {
      if (!nextAppliedKeys.has(previousKey)) {
        setMorph(previousKey, 0);
      }
    }
    activeExpressionKeysRef.current = nextAppliedKeys;
  }, [expressionWeights, allMorphKeys, resolveExpressionMorphKey, setMorph]);

  useEffect(() => {
    const timers: number[] = [];
    let disposed = false;

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

    return () => {
      disposed = true;
      for (const t of timers) window.clearTimeout(t);
    };
  }, [gltf, phase, setMorph]);

  return <primitive object={gltf.scene} />;
}

type AvatarCanvasProps = {
  phase: AvatarPhase;
  expressionWeights: Record<string, number>;
  speakingText: string;
  streamCompleted: boolean;
  onSpeechDrained?: () => void;
};

export default function AvatarCanvas({
  phase,
  expressionWeights,
  speakingText,
  streamCompleted,
  onSpeechDrained,
}: AvatarCanvasProps) {
  return (
    <Canvas camera={{ fov: 4 }}>
      <hemisphereLight args={[0xffffff, 0x444444, 1]} />
      <Avatar
        phase={phase}
        expressionWeights={expressionWeights}
        speakingText={speakingText}
        streamCompleted={streamCompleted}
        onSpeechDrained={onSpeechDrained}
      />
      <OrbitControls target={[0, 0.5, 0]} />
    </Canvas>
  );
}

useGLTF.preload("/models/cool_man_avatar.vrm");
