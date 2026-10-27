/** Populate with factories authored from this project's real components.
 * Each factory receives { frame, content, width, height } at layout time.
 * Import blueprintFor/rectFor/svgFor from your installed runtime directory.
 * The skill replaces this empty registry with grounded component definitions.
 */
import {blueprintFor} from '../../codex/blueprint-reveal/assets/runtime/blueprint-geometry.js';
export const blueprints = {
  'trend-card': ({frame,content})=>blueprintFor(frame,content,{text:true,anchors:[{selector:'[data-part="plot"]',kind:'svg'}]}),
  'note-card': ({frame,content})=>blueprintFor(frame,content,{text:true,anchors:[{selector:'.live-button',kind:'rect'}]})
};
