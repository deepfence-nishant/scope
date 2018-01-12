/* eslint-disable */

import React from 'react';
import classNames from 'classnames';

import { NODE_BASE_SIZE } from '../constants/styles';
import {
  getMetricValue,
  getMetricColor,
  getClipPathDefinition,
} from '../utils/metric-utils';
import {
  pathElement,
  circleElement,
  rectangleElement,
  circleShapeProps,
  triangleShapeProps,
  squareShapeProps,
  pentagonShapeProps,
  hexagonShapeProps,
  heptagonShapeProps,
  octagonShapeProps,
  cloudShapeProps,
} from '../utils/node-shape-utils';
import { encodeIdAttribute } from '../utils/dom-utils';


function CloudShape(shapeType, shapeElement, shapeProps, { id, highlighted, color, metric }) {
  const { height, hasMetric, formattedValue } = getMetricValue(metric);
  const className = classNames('shape', `shape-${shapeType}`, { metrics: hasMetric });
  const metricStyle = { fill: getMetricColor(metric) };
  const fillStyle = { fill: color };
  const clipId = encodeIdAttribute(`metric-clip-${id}`);

//      <image href="https://polydisteurope.com/_/tpl/globe.svg" x="-50" y="-50" width="100" height="100" />

  return (
    <g className={className}>
      {highlighted && shapeElement({
        className: 'highlight-border',
        transform: `scale(${NODE_BASE_SIZE * 0.4})`,
        ...shapeProps,
      })}
      {highlighted && shapeElement({
        className: 'highlight-shadow',
        transform: `scale(${NODE_BASE_SIZE * 0.4})`,
        ...shapeProps,
      })}
      <g transform="scale(1.6)" >   
        <defs>
          <clipPath id="a" transform="translate(0 0)">
            <rect width="47.08" height="47.08" fill="none"/>
          </clipPath>
        </defs>
        <title>globe</title>
        <g clip-path="url(#a)">
          <path transform="translate(-23.5 -23.5)" fill="#0276c9" d="M23.54,0A23.54,23.54,0,1,0,47.08,23.54,23.57,23.57,0,0,0,23.54,0m17,38V36.51l-.88-1.18V33.49L39,32.82,39,32.06l.85-1.62-1.61-2.85.19-1.93-1.45-.15L36.41,25h-1l-.5.46H33.22l-.06.15h-1L30,23.07l0-2,.36-.13.13-.75H30l-.21-.78,2.54-1.83v-1.3l1.24-.69.5.05h1l.8-.43,2.58-.2v1.32l2,.52.4.29h.37v-.72l1.17-.11,1.12.83h1.56A22.47,22.47,0,0,1,40.78,38ZM35,9.63l-.52-.33-.36-.25V8.69l.21-.32L35,8.21l.19.92.4.65.27.31.49.19-.46.55-.89.08h-.67l.08-.79L35,10Zm-.6-.19,0,.5-.95.67h-.53v-.48h0l.46-.74.62-.14Zm10.14,5.81h-.75l-.6-.66L43,13.54l-.62.34-.33,1.3-.89-.95,0-.89-.86-.74L40,12.28H39l.31.89,1.2.67.21.22-.26.13v.7l-.58.24-.5-.11-.31-.44.81,0,.22-.3L38.3,13.12l-.14-.52-.73.66-.74-.15-1.12,1.46-.22.57-.72.07H33.56l-.64-.3-.19-1.26L33,13,34,12.81l1.18.24.15-.65-.5-.12.17-1,1.19-.19.83-1.18.86-.14.78.11H39l-.16-1.1-.94.38-.33-.83L37,8.24l-.1-.56.45-.49,1.06-.42.06-.1a22.62,22.62,0,0,1,6,8.57M10.83,4.94h.32l.52.29,1,.21.08.38,1.55.06-.21-.5-1.38,0L13,5l-.11-.36H11.64l1.36-1h1.3l.61.84,1,.06L16.54,4l.46.23L16.15,5,15,5a3.85,3.85,0,0,1,.1.8l1.41,0,.15-.38,1-.06.11-.57-.57-.1.19-.52L17.85,4l1.53.08-.84.76.14.59.88.13L19.5,4.53l.84-.44,1.49-.17,2.16,1V5.7l.69.17-.34.65h-1l-.29.75-2.23-.53,1.75-.93-.67-.57-1.51.19-.13.14h0l0,0-.43.45-.72.06.06.36.25.1v.12l-.59.08,0,.34-.56,0-.1-.67-1,.31L15.06,8l.23.85.57.37L17,9.35v1.3l.53-.08.49-1,1.22-.39V7.6l.68-.51,1.64.39-.11,1h.44l1.2-.59.06,1.36.88.53,0,.8-.84.29.06.27,1,.46,0,.55-.29,0h0l-1.28-.39-.05-.41h0l.37-.26v-.37l-.4-.1-.1.35-.7.11-.07,0v0l-.24,0-.2-.4-.23-.1h-.5l-.23.19v.42l.43.14.42.06-.09,0-.39.43-.17-.21-.37-.1-1,1,.13.11-1.5.83L16.29,15l-.1.65-1.42.93-.7.71.08,1.41-1-.45v-.83H10.47l-1.4.71-.61,1.13-.24.89.4.86,1.11.14L11.47,20l.15.58-.54,1,1.34.23.13,2.07,1.84.31,1.17-1.35,1.41.29.5.69,1.36-.08,0-.4.75.36L20.45,25l1.45,0,.54.94.08,1.15,1.61.61,2,0,.59,1,.9.29-.17.8-1,1.25-.29,2.77-.89.7-1.32,0-.44.76.33,1.44-1.43,1.83-.46.84L20.62,40l-.9.14,0,.38.63.18-.08.41-.57.54.34.43.68,0,0,.52-.18.52-.06.42,1,.85-.13.44-1.37,0-1.36-1.19L17.5,41.8l.15-1.8-.8-1.07.33-1.81L16.69,37V33s-1.34-1-1.41-1-.71-.17-.71-.17l-.13-.74L12.7,28.93l.17-.78.06-1.28,1.2-.84L14,24.59l-1.76-.13-1.38-1.57-1-.27-.63-.12.08-.57-.8-.11v.33l-2-.5-.81-1.24.33-.6L4.73,18l-.22-1.36H4l.17,1.32L5,19.27l-.1.54-.75-.11-.92-1.56V16.31l-.94-.45A22.65,22.65,0,0,1,10.83,4.94M22.15,12.1l-.13.27-.33,0-.07.32-.25.16-.4,0c0-.1,0-.17,0-.17H20.8v-.34h.66l.14-.35h.26Zm-1.76.52,0,.33-.48,0,0-.33.21-.27Z" />
        </g>  
      </g>
      {hasMetric && getClipPathDefinition(clipId, height, 0.38)}
      {hasMetric && shapeElement({
        className: 'metric-fill',
        transform: `scale(${NODE_BASE_SIZE * 0.38})`,
        clipPath: `url(#${clipId})`,
        style: metricStyle,
        ...shapeProps,
      })}
      {hasMetric && highlighted ?
        <text>{formattedValue}</text> :
        <circle className="node" r={NODE_BASE_SIZE * 0.01} />
      }
    </g>
  );
}

function NodeShape(shapeType, shapeElement, shapeProps, { id, highlighted, color, metric, stroke }) {
  const { height, hasMetric, formattedValue } = getMetricValue(metric);
  const className = classNames('shape', `shape-${shapeType}`, { metrics: hasMetric });
  const metricStyle = { fill: getMetricColor(metric) };
  const fillStyle = { fill: color, stroke: stroke, strokeWidth: "0.1" };
  const fillGradient = { fill: "url(#)" };
  const clipId = encodeIdAttribute(`metric-clip-${id}`);

  return (
    <g className={className}>
      <radialGradient id = "g1" cx = "50%" cy = "50%" r = "50%">
          <stop stopColor="white" offset="0%"/>
          <stop stopColor={color} offset="80%"/>
          <stop stopColor={color} offset="100%"/>
      </radialGradient>
      {highlighted && shapeElement({
        className: 'highlight-border',
        transform: `scale(${NODE_BASE_SIZE * 0.4})`,
        ...shapeProps,
      })}
      {highlighted && shapeElement({
        className: 'highlight-shadow',
        transform: `scale(${NODE_BASE_SIZE * 0.4})`,
        ...shapeProps,
      })}
      {shapeElement({
        className: 'background',
        transform: `scale(${NODE_BASE_SIZE * 0.38})`,
        style: fillStyle,
        ...shapeProps,
      })}
      {hasMetric && getClipPathDefinition(clipId, height, 0.38)}
      {hasMetric && shapeElement({
        className: 'metric-fill',
        transform: `scale(${NODE_BASE_SIZE * 0.38})`,
        clipPath: `url(#${clipId})`,
        style: metricStyle,
        ...shapeProps,
      })}
      {shapeElement({
        className: 'shadow',
        transform: `scale(${NODE_BASE_SIZE * 0.39})`,
        ...shapeProps,
      })}
      {shapeElement({
        className: 'border',
        transform: `scale(${NODE_BASE_SIZE * 0.4})`,
        style: fillGradient,
        stroke: color,
        ...shapeProps,
      })}
      {hasMetric && highlighted ?
        <text>{formattedValue}</text> :
        <circle className="node" r={NODE_BASE_SIZE * 0.08} fill={stroke} />
      }
    </g>
  );
}

export const NodeShapeCircle = props => NodeShape('circle', circleElement, circleShapeProps, props);
export const NodeShapeTriangle = props => NodeShape('triangle', pathElement, triangleShapeProps, props);
export const NodeShapeSquare = props => NodeShape('square', rectangleElement, squareShapeProps, props);
export const NodeShapePentagon = props => NodeShape('pentagon', pathElement, pentagonShapeProps, props);
export const NodeShapeHexagon = props => NodeShape('hexagon', pathElement, hexagonShapeProps, props);
export const NodeShapeHeptagon = props => NodeShape('heptagon', pathElement, heptagonShapeProps, props);
export const NodeShapeOctagon = props => NodeShape('octagon', pathElement, octagonShapeProps, props);
export const NodeShapeCloud = props => CloudShape('circle', circleElement, circleShapeProps, props);
