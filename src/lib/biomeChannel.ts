export type BiomeListener = (opacities: number[], blendedColor?: string) => void;

let currentOpacities: number[] = [1, 0, 0, 0, 0];
let currentBlendedColor: string = 'rgba(224, 242, 254, 0.4)';
const listeners = new Set<BiomeListener>();

export const biomeChannel = {
  subscribe(fn: BiomeListener): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  emit(opacities: number[], blendedColor?: string) {
    currentOpacities = opacities;
    if (blendedColor) currentBlendedColor = blendedColor;
    listeners.forEach((fn) => {
      try {
        fn(opacities, blendedColor);
      } catch (err) {
        console.error('Error in biome listener:', err);
      }
    });
  },
  getOpacities(): number[] {
    return currentOpacities;
  },
  getBlendedColor(): string {
    return currentBlendedColor;
  }
};
