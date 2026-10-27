/** Single project-wide source of truth. Runtime panel changes are temporary. */
export default {
  version: 1,
  defaults: {
    enabled: true,
    direction: 'diagonal',
    material: 'hybrid',
    density: 8,
    duration: 1800,
    speed: 1,
    guides: true,
    movement: true,
    color: '#111111',
    seed: 127
  },
  playback: { trigger: 'visible', activation: 'center', viewportBand: 0.2, once: true, stagger: 70, maxStagger: 280, threshold: 0, loop: false, loopDelay: 1200 },
  controls: { enabled: true, developmentOnly: true },
  groups: {},
  components: {}
};
