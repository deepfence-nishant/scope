/* eslint-disable */

import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { Map as makeMap, List as makeList } from 'immutable';

import { clickNode, enterNode, leaveNode } from '../actions/app-actions';
import { getNodeSeverityColor, getNodeSeverityStrokeColor } from '../utils/color-utils';
import MatchedText from '../components/matched-text';
import MatchedResults from '../components/matched-results';
import { trackMixpanelEvent } from '../utils/tracking-utils';
import { GRAPH_VIEW_MODE } from '../constants/naming';
import { NODE_BASE_SIZE } from '../constants/styles';

import NodeShapeStack from './node-shape-stack';
import NodeNetworksOverlay from './node-networks-overlay';
import {
  NodeShapeCircle,
  NodeShapeTriangle,
  NodeShapeSquare,
  NodeShapePentagon,
  NodeShapeHexagon,
  NodeShapeHeptagon,
  NodeShapeOctagon,
  NodeShapeCloud,
} from './node-shapes';


const labelWidth = 1.2 * NODE_BASE_SIZE;
const nodeShapes = {
  circle: NodeShapeCircle,
  triangle: NodeShapeTriangle,
  square: NodeShapeSquare,
  pentagon: NodeShapePentagon,
  hexagon: NodeShapeHexagon,
  heptagon: NodeShapeHeptagon,
  octagon: NodeShapeOctagon,
  cloud: NodeShapeCloud,
};

function stackedShape(Shape) {
  const factory = React.createFactory(NodeShapeStack);
  return props => factory(Object.assign({}, props, {shape: Shape}));
}

function getNodeShape({ shape, stack }) {
  const shapeCircle = (shape == 'cloud') ? 'cloud' : 'circle';
  const nodeShape = nodeShapes[shapeCircle];
  if (!nodeShape) {
    throw new Error(`Unknown shape: ${shape}!`);
  }
  //return stack ? stackedShape(nodeShape) : nodeShape;
  return nodeShape;
}


class Node extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      hovered: false,
    };
    this.handleMouseClick = this.handleMouseClick.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.saveShapeRef = this.saveShapeRef.bind(this);
  }

  renderSvgLabels(labelClassName, labelMinorClassName, labelOffsetY) {
    const { label, labelMinor } = this.props;
    return (
      <g className="node-labels-container">
        <text className={labelClassName} y={13 + labelOffsetY} textAnchor="middle">{label}</text>
        <text className={labelMinorClassName} y={30 + labelOffsetY} textAnchor="middle">
          {labelMinor}
        </text>
      </g>
    );
  }

  renderStandardLabels(labelClassName, labelMinorClassName, labelOffsetY, mouseEvents) {
    const { label, labelMinor, matches = makeMap() } = this.props;
    const matchedMetadata = matches.get('metadata', makeList());
    const matchedParents = matches.get('parents', makeList());
    const matchedNodeDetails = matchedMetadata.concat(matchedParents);

    return (
      <foreignObject
        className="node-labels-container"
        y={labelOffsetY}
        x={-0.5 * labelWidth}
        width={labelWidth}
        height="5em">
        <div className="node-label-wrapper" {...mouseEvents}>
          <div className={labelClassName}>
            <MatchedText text={label} match={matches.get('label')} />
          </div>
          <div className={labelMinorClassName}>
            <MatchedText text={labelMinor} match={matches.get('labelMinor')} />
          </div>
          <MatchedResults matches={matchedNodeDetails} />
        </div>
      </foreignObject>
    );
  }

  render() {
    const { focused, highlighted, networks, pseudo, rank, label, transform,
      exportingGraph, showingNetworks, stack, nodes, id, metric, nodeSeverity } = this.props;

    const { hovered } = this.state;
    const colorMapper = {
      blue: '#03a9f4',
      red: '#e84f4f',
      yellow: '#ebce66'
    };

    let color = colorMapper['blue'];
    const arr = nodes.toIndexedSeq().toArray();
    for ( var i = 0; i < arr.length; i++) {
      const subArr = arr[i].toIndexedSeq().toArray();
      if (subArr[subArr.length - 1] == this.props.id && this.props.id.length > 0) {
        for (var k=0; k < subArr.length; k++) {
          if (typeof subArr[k] == 'object') {
            const nesArr = subArr[k].toIndexedSeq().toArray();
            for (var j=0;j<nesArr.length;j++) {
              if (typeof nesArr[j] == 'object') {
                const baseArr = nesArr[j].toIndexedSeq().toArray();
                if (baseArr[1] == 'High Severity' && parseInt(baseArr[2]) > 0){
                  color = colorMapper['red'];
                  console.log(this.props.id);
                  console.log(baseArr[1]);
                  console.log(baseArr[2]);
                  break;
                  
                } else if (baseArr[1] == 'Medium Severity' && parseInt(baseArr[2]) > 0){
                  color = colorMapper['yellow'];
                  console.log(this.props.id);
                  console.log(baseArr[1]);
                  console.log(baseArr[2]);
                  // console.log('-------------stop--------------');
                  break;
                } 
              }
            }
          }
        }
      }
    }

    // const color = getNodeColor(rank, label, pseudo);
    const truncate = !focused && !hovered;
    const labelOffsetY = (showingNetworks && networks) ? 40 : 28;

    const nodeClassName = classnames('node', { highlighted, hovered, pseudo });
    const labelClassName = classnames('node-label', { truncate });
    const labelMinorClassName = classnames('node-label-minor', { truncate });

    const NodeShapeType = getNodeShape(this.props);
    const mouseEvents = {
      onClick: this.handleMouseClick,
      onMouseEnter: this.handleMouseEnter,
      onMouseLeave: this.handleMouseLeave,
    };

    if(label) {
      return (
        <g className={nodeClassName} transform={transform}>
          {exportingGraph ?
            this.renderSvgLabels(labelClassName, labelMinorClassName, labelOffsetY) :
            this.renderStandardLabels(labelClassName, labelMinorClassName, labelOffsetY, mouseEvents)}
          <g {...mouseEvents} ref={this.saveShapeRef}>
            <NodeShapeType
              id={id}
              highlighted={highlighted}
              color={getNodeSeverityColor(label, this.props.nodeSeverity)}
              stroke={getNodeSeverityStrokeColor(label, this.props.nodeSeverity)}
              metric={metric}
              contrastMode={this.props.contrastMode}
            />
          </g>
          {showingNetworks && <NodeNetworksOverlay networks={networks} stack={stack} />}
        </g>
      );
    } else {
      return (<g></g>);
    }
  }

  saveShapeRef(ref) {
    this.shapeRef = ref;
  }

  handleMouseClick(ev) {
    ev.stopPropagation();
    trackMixpanelEvent('scope.node.click', {
      layout: GRAPH_VIEW_MODE,
      topologyId: this.props.currentTopology.get('id'),
      parentTopologyId: this.props.currentTopology.get('parentId'),
    });
    this.props.clickNode(this.props.id, this.props.label, this.shapeRef.getBoundingClientRect());
  }

  handleMouseEnter() {
    this.props.enterNode(this.props.id);
    this.setState({ hovered: true });
  }

  handleMouseLeave() {
    this.props.leaveNode(this.props.id);
    this.setState({ hovered: false });
  }
}

function mapStateToProps(state) {
  return {
    nodes: state.get('nodes'),
    exportingGraph: state.get('exportingGraph'),
    showingNetworks: state.get('showingNetworks'),
    currentTopology: state.get('currentTopology'),
    nodeSeverity: state.get('nodeSeverity'),
    contrastMode: state.get('contrastMode'),
  };
}

export default connect(
  mapStateToProps,
  { clickNode, enterNode, leaveNode }
)(Node);
