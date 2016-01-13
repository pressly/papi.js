import Model from '../model';
import {every, pick, isEmpty} from 'lodash';

var DISPLAY_STATES = {
  VISIBLE:      1,
  FEATURED:     2,
  HIGHLIGHTED:  4,
  LOCKED:       8
};

export default class Asset extends Model {
  isVisible() {
    return (this.display_state & DISPLAY_STATES.VISIBLE) === DISPLAY_STATES.VISIBLE;
  }

  isHidden() {
    return (this.display_state & DISPLAY_STATES.VISIBLE) !== DISPLAY_STATES.VISIBLE;
  }

  isFeatured() {
    return (this.display_state & DISPLAY_STATES.FEATURED) === DISPLAY_STATES.FEATURED;
  }

  isHighlighted() {
    return (this.display_state & DISPLAY_STATES.HIGHLIGHTED) === DISPLAY_STATES.HIGHLIGHTED;
  }

  isLocked() {
    return (this.display_state & DISPLAY_STATES.LOCKED) === DISPLAY_STATES.LOCKED;
  }

  isOriginal() {
    return every(pick(this.source, 'network', 'uid', 'url'), isEmpty);
  }
}
