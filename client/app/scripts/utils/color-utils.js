import { hsl } from 'd3-color';
import { scaleLinear, scaleOrdinal, schemeCategory10 } from 'd3-scale';
import {
  BEHAVIORAL_ANOMALY, CRITICAL_ALERT, DEFAULT, HIGH_ALERT, LOW_ALERT, MEDIUM_ALERT,
} from '../constants/alert-types';
import {
  BEHAVIORAL_ANOMALY_CHECKBOX, BEHAVIORAL_ANOMALY_CLASS, CRITICAL_SEVERITY,
  CRITICAL_SEVERITY_CHECKBOX, CRITICAL_SEVERITY_CLASS, FILES_RESOURCE,
  HIGH_SEVERITY, HIGH_SEVERITY_CHECKBOX, HIGH_SEVERITY_CLASS, LOW_SEVERITY,
  LOW_SEVERITY_CHECKBOX, LOW_SEVERITY_CLASS, MEDIUM_SEVERITY,
  MEDIUM_SEVERITY_CHECKBOX, MEDIUM_SEVERITY_CLASS, NETWORK_ANOMALY, NETWORK_ANOMALY_CHECKBOX,
  NETWORK_RESOURCE, PROCESSES_RESOURCE, RESPONSE_ANOMALY, SYSCALL_ANOMALY, SYSCALL_ANOMALY_CHECKBOX,
  SYSTEM_AUDIT, SYSTEM_AUDIT_ANOMALY_CHECKBOX
} from '../constants/naming';

const PSEUDO_COLOR = '#b1b1cb';

/* START :: DONUT SECTOR COLORS */
// SEVERITY
const CRITICAL_ALERT_COLOR = '#db2547';
const HIGH_ALERT_COLOR = '#e08a25';
const MEDIUM_ALERT_COLOR = '#e7d036';
const LOW_ALERT_COLOR = '#0276c9';

// TYPES
const NETWORK_ANAMOLY_COLOR = '#0276c9';
const BEHAVIORAL_ANOMALY_COLOR = '#db2547';
const RESPONSE_ANAMOLY_COLOR = '#db2547';
const SYSTEM_AUDIT_COLOR = '#e7d036';
const SYSCALL_ANOMALY_COLOR = '#e08a25';

// DEFAULT
const DEFAULT_COLOR = '#7f7e7e';
const DUMMY_BUBBLE_COLOR = 'rgba(127, 126, 126, 0.3)';

/* OPACITY :: 30% */
const DONUT_CRITICAL_SECTOR_BACKGROUND = '#580b1d';
const DONUT_HIGH_SECTOR_BACKGROUND = '#58350b';
const DONUT_MEDIUM_SECTOR_BACKGROUND = '#58481c';
const DONUT_LOW_SECTOR_BACKGROUND = '#0b3e58';
const DONUT_RESPONSE_ANOMALY_SECTOR_BACKGROUND = '#58481c';
const DONUT_NETWORK_ANOMALY_SECTOR_BACKGROUND = '#0b3e58';
const DONUT_BEHAVIORAL_ANOMALY_SECTOR_BACKGROUND = '#580b1d';
/* END :: DONUT SECTOR COLORS */


/* START :: SEVERITY BASED NODE COLORS */
const NODE_CRITICAL_BACKGROUND_COLOR = '#560518';
const NODE_HIGH_BACKGROUND_COLOR = '#57310a';
const NODE_MEDIUM_BACKGROUND_COLOR = '#57461a';
const NODE_LOW_BACKGROUND_COLOR = '#083c56';
const NODE_DEFAULT_BACKGROUND_COLOR = '#312d2d';
/* END :: SEVERITY BASED NODE COLORS */


const hueRange = [20, 330]; // exclude red
const hueScale = scaleLinear().range(hueRange);
const networkColorScale = scaleOrdinal(schemeCategory10);
// map hues to lightness
const lightnessScale = scaleLinear().domain(hueRange).range([0.5, 0.7]);
const startLetterRange = 'A'.charCodeAt();
const endLetterRange = 'Z'.charCodeAt();
const letterRange = endLetterRange - startLetterRange;

/**
 * Converts a text to a 360 degree value
 */
export function text2degree(text) {
  const input = text.substr(0, 2).toUpperCase();
  let num = 0;
  for (let i = 0; i < input.length; i += 1) {
    const charCode = Math.max(Math.min(input[i].charCodeAt(), endLetterRange), startLetterRange);
    num += Math.pow(letterRange, input.length - i - 1) * (charCode - startLetterRange);
  }
  hueScale.domain([0, Math.pow(letterRange, input.length)]);
  return hueScale(num);
}

export function colors(text, secondText) {
  let hue = text2degree(text);
  // skip green and shift to the end of the color wheel
  if (hue > 70 && hue < 150) {
    hue += 80;
  }
  const saturation = 0.6;
  let lightness = 0.5;
  if (secondText) {
    // reuse text2degree and feed degree to lightness scale
    lightness = lightnessScale(text2degree(secondText));
  }
  return hsl(hue, saturation, lightness);
}

export function getNeutralColor() {
  return PSEUDO_COLOR;
}

export function getNodeColor(text = '', secondText = '', isPseudo = false) {
  if (isPseudo) {
    return PSEUDO_COLOR;
  }
  return colors(text, secondText).toString();
}

export function getNodeColorDark(text = '', secondText = '', isPseudo = false) {
  if (isPseudo) {
    return PSEUDO_COLOR;
  }
  let color = hsl(colors(text, secondText));

  // ensure darkness
  if (color.h > 20 && color.h < 120) {
    color = color.darker(2);
  } else if (hsl.l > 0.7) {
    color = color.darker(1.5);
  } else {
    color = color.darker(1);
  }

  return color.toString();
}

export function getNetworkColor(text) {
  return networkColorScale(text);
}

export function brightenColor(c) {
  let color = hsl(c);
  if (hsl.l > 0.5) {
    color = color.brighter(0.5);
  } else {
    color = color.brighter(0.8);
  }
  return color.toString();
}

export function darkenColor(c) {
  let color = hsl(c);
  if (hsl.l < 0.5) {
    color = color.darker(0.5);
  } else {
    color = color.darker(0.8);
  }
  return color.toString();
}

export function getSectorStrokeColor(sectorName) {
  switch (sectorName) {
    case CRITICAL_ALERT: {
      return CRITICAL_ALERT_COLOR;
    }
    case HIGH_ALERT: {
      return HIGH_ALERT_COLOR;
    }
    case MEDIUM_ALERT: {
      return MEDIUM_ALERT_COLOR;
    }
    case LOW_ALERT: {
      return LOW_ALERT_COLOR;
    }
    case RESPONSE_ANOMALY: {
      return RESPONSE_ANAMOLY_COLOR;
    }
    case NETWORK_ANOMALY: {
      return NETWORK_ANAMOLY_COLOR;
    }
    case BEHAVIORAL_ANOMALY: {
      return BEHAVIORAL_ANOMALY_COLOR;
    }
    case SYSTEM_AUDIT: {
      return SYSTEM_AUDIT_COLOR;
    }
    case SYSCALL_ANOMALY: {
      return SYSCALL_ANOMALY_COLOR;
    }
    case PROCESSES_RESOURCE: {
      return CRITICAL_ALERT_COLOR;
    }
    case FILES_RESOURCE: {
      return HIGH_ALERT_COLOR;
    }
    case NETWORK_RESOURCE: {
      return LOW_ALERT_COLOR;
    }
    case DEFAULT: {
      return DEFAULT_COLOR;
    }
    default: {
      return DEFAULT_COLOR;
    }
  }
}

export function getSectorHoveredColor(sectorName) {
  switch (sectorName) {
    case CRITICAL_ALERT: {
      return 'rgba(219, 37, 71, 0.6)';
    }
    case HIGH_ALERT: {
      return 'rgba(224, 138, 37, 0.6)';
    }
    case MEDIUM_ALERT: {
      return 'rgba(231, 208, 54, 0.6)';
    }
    case LOW_ALERT: {
      return 'rgba(2, 118, 201, 0.6)';
    }
    case RESPONSE_ANOMALY: {
      return RESPONSE_ANAMOLY_COLOR;
    }
    case NETWORK_ANOMALY: {
      return 'rgba(2, 118, 201, 0.6)';
    }
    case BEHAVIORAL_ANOMALY: {
      return 'rgba(219, 37, 71, 0.6)';
    }
    case SYSTEM_AUDIT: {
      return 'rgba(231, 208, 54, 0.6)';
    }
    case SYSCALL_ANOMALY: {
      return 'rgba(224, 138, 37, 0.6)';
    }
    case PROCESSES_RESOURCE: {
      return 'rgba(219, 37, 71, 0.6)';
    }
    case FILES_RESOURCE: {
      return 'rgba(224, 138, 37, 0.6)';
    }
    case NETWORK_RESOURCE: {
      return 'rgba(2, 118, 201, 0.6)';
    }
    default: {
      return DEFAULT_COLOR;
    }
  }
}

export function getSectorBackgroundColor(type) {
  switch (type) {
    case CRITICAL_ALERT: {
      return DONUT_CRITICAL_SECTOR_BACKGROUND;
    }
    case HIGH_ALERT: {
      return DONUT_HIGH_SECTOR_BACKGROUND;
    }
    case MEDIUM_ALERT: {
      return DONUT_MEDIUM_SECTOR_BACKGROUND;
    }
    case LOW_ALERT: {
      return DONUT_LOW_SECTOR_BACKGROUND;
    }
    case RESPONSE_ANOMALY: {
      return DONUT_RESPONSE_ANOMALY_SECTOR_BACKGROUND;
    }
    case NETWORK_ANOMALY: {
      return DONUT_NETWORK_ANOMALY_SECTOR_BACKGROUND;
    }
    case BEHAVIORAL_ANOMALY: {
      return DONUT_BEHAVIORAL_ANOMALY_SECTOR_BACKGROUND;
    }
    case SYSTEM_AUDIT: {
      return DONUT_MEDIUM_SECTOR_BACKGROUND;
    }
    case SYSCALL_ANOMALY: {
      return DONUT_HIGH_SECTOR_BACKGROUND;
    }
    case PROCESSES_RESOURCE: {
      return DONUT_CRITICAL_SECTOR_BACKGROUND;
    }
    case FILES_RESOURCE: {
      return DONUT_HIGH_SECTOR_BACKGROUND;
    }
    case NETWORK_RESOURCE: {
      return DONUT_LOW_SECTOR_BACKGROUND;
    }
    case DEFAULT: {
      return DUMMY_BUBBLE_COLOR;
    }
    default: {
      return DEFAULT_COLOR;
    }
  }
}

export function getLabelColour(type) {
  switch (type) {
    case CRITICAL_SEVERITY: {
      return CRITICAL_SEVERITY_CHECKBOX;
    }
    case HIGH_SEVERITY: {
      return HIGH_SEVERITY_CHECKBOX;
    }
    case MEDIUM_SEVERITY: {
      return MEDIUM_SEVERITY_CHECKBOX;
    }
    case LOW_SEVERITY: {
      return LOW_SEVERITY_CHECKBOX;
    }
    case RESPONSE_ANOMALY: {
      return NETWORK_ANOMALY_CHECKBOX;
    }
    case NETWORK_ANOMALY: {
      return NETWORK_ANOMALY_CHECKBOX;
    }
    case BEHAVIORAL_ANOMALY: {
      return BEHAVIORAL_ANOMALY_CHECKBOX;
    }
    case SYSTEM_AUDIT: {
      return SYSTEM_AUDIT_ANOMALY_CHECKBOX;
    }
    case SYSCALL_ANOMALY: {
      return SYSCALL_ANOMALY_CHECKBOX;
    }
    default: {
      return DEFAULT_COLOR;
    }
  }
}

export function getTableCellStyles(type) {
  switch (type) {
    case CRITICAL_SEVERITY: {
      return CRITICAL_SEVERITY_CLASS;
    }
    case HIGH_SEVERITY: {
      return HIGH_SEVERITY_CLASS;
    }
    case MEDIUM_SEVERITY: {
      return MEDIUM_SEVERITY_CLASS;
    }
    case LOW_SEVERITY: {
      return LOW_SEVERITY_CLASS;
    }
    case NETWORK_ANOMALY: {
      return LOW_SEVERITY_CLASS;
    }
    case BEHAVIORAL_ANOMALY: {
      return BEHAVIORAL_ANOMALY_CLASS;
    }
    case SYSTEM_AUDIT: {
      return MEDIUM_SEVERITY_CLASS;
    }
    case SYSCALL_ANOMALY: {
      return HIGH_SEVERITY_CLASS;
    }
    default: {
      return null;
    }
  }
}

/* START :: Severity based node color config */
export function getNodeSeverityStrokeColor(nodeLabel, nodeSeverityCollection) {
  if (nodeSeverityCollection &&
    Object.prototype.hasOwnProperty.call(nodeSeverityCollection, nodeLabel)) {
    const severityType = nodeSeverityCollection[nodeLabel];
    switch (severityType) {
      case CRITICAL_ALERT: {
        return CRITICAL_ALERT_COLOR;
      }
      case HIGH_ALERT: {
        return HIGH_ALERT_COLOR;
      }
      case MEDIUM_ALERT: {
        return MEDIUM_ALERT_COLOR;
      }
      case LOW_ALERT: {
        return LOW_ALERT_COLOR;
      }
      default: {
        return DEFAULT_COLOR;
      }
    }
  } else {
    return DEFAULT_COLOR;
  }
}

export function getNodeSeverityColor(nodeLabel, nodeSeverityCollection) {
  if (nodeSeverityCollection &&
    Object.prototype.hasOwnProperty.call(nodeSeverityCollection, nodeLabel)) {
    const severityType = nodeSeverityCollection[nodeLabel];
    switch (severityType) {
      case CRITICAL_ALERT: {
        return NODE_CRITICAL_BACKGROUND_COLOR;
      }
      case HIGH_ALERT: {
        return NODE_HIGH_BACKGROUND_COLOR;
      }
      case MEDIUM_ALERT: {
        return NODE_MEDIUM_BACKGROUND_COLOR;
      }
      case LOW_ALERT: {
        return NODE_LOW_BACKGROUND_COLOR;
      }
      default: {
        return NODE_DEFAULT_BACKGROUND_COLOR;
      }
    }
  } else {
    return NODE_DEFAULT_BACKGROUND_COLOR;
  }
}
/* END :: Severity based node color config */
