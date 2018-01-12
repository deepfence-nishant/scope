/*eslint-disable*/

//React imports
import React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';
import {
  getSectorBackgroundColor,
  getSectorStrokeColor
} from '../../../utils/color-utils';
import { BUBBLE_DEFAULT_RADIUS } from "../../../constants/visualization-config";

var d3 = require('d3');

/* start :: variables */

var width = 500;
var height = 500;
var dataNodeBound = 100;
var center = { x: width / 2, y: height / 2 };
var damper = 0.102;
var svg = null;
var bubbles = null;
var nodes = [];
var force = d3.layout.force().size([width, height]).charge(charge).gravity(-0.01).friction(0.9);
var radiusScale = d3.scale.pow().exponent(0.5).range([2, 20]);
/* end :: variables */

/*function getMaxRange(data, defaultDomainRange, maxBubbleRange, minRange) {
  let domainRange;
  const dataLength = data.length;
  if (dataLength <= maxBubbleRange) {
    domainRange = defaultDomainRange;
  } else {
    const diff = dataLength - maxBubbleRange;
    const diffCount = Math.ceil(((diff/100)*2));
    domainRange = defaultDomainRange - diffCount;
  }
  debugger
  // Negative value handling
  if (domainRange < minRange) {
    domainRange = 5;
  }
  return domainRange;
}*/

function getBubbleEvents(data) {
  let events;
  if (data.cve_severity == 'default') {
    events = 'none';
  } else {
    events = 'all';
  }
  return events;
}

function charge(d) {
  return -Math.pow(d.radius, 2.0) / 8;
}

function moveToCenter(alpha) {
  return function (d) {
    d.x = d.x + (center.x - d.x) * damper * alpha;
    d.y = d.y + (center.y - d.y) * damper * alpha;
  };
}

class BubbleChart extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};

    this.hideDetail = this.hideDetail.bind(this);
    this.showDetail = this.showDetail.bind(this);
    this.onBubbleClick = this.onBubbleClick.bind(this);
  }

  componentDidMount(){
    if (this.props.data) {
      this.initializeBubbleChartView(this.props.data);
    }
  }

  componentWillReceiveProps(newProps){
    if (!isEqual(newProps.data, this.props.data)) {
      this.initializeBubbleChartView(newProps.data);
    }
  }

  populateBubbleChart(selector, rawData) {

    // const maxAmount = d3.max(rawData, function (d) { return +d.count; });
    const maxAmount = d3.max(rawData, function (d) { return +BUBBLE_DEFAULT_RADIUS; });

    // const maxRange = getMaxRange(rawData, this.props.defaultDomainRange, this.props.maxBubbleRange, this.props.minRange);

    const offset = rawData.length * 0.01;

    radiusScale.domain([0, maxAmount + offset]);

    if (this.props.bubbleChartType == 'resource') {
      nodes = this.createResourceNodes(rawData);
    } else if (this.props.bubbleChartType == 'vulnerability') {
      nodes = this.createVulnerabilityNodes(rawData);
    }

    const dataNodesLen = nodes.length;
    if (dataNodesLen < dataNodeBound) {
      const dummyBubbleCount = dataNodeBound - dataNodesLen;
      const dummyBubbles = this.createDummyNodes(dummyBubbleCount);
      dummyBubbles.forEach((bubble)=>{
        nodes.push(bubble);
      });
    }

    force.nodes(nodes);

    svg = d3.select(selector).append('svg').attr('width', width).attr('height', height);

    bubbles = svg.selectAll('.bubble').data(nodes, function (d) { return d.id });

    bubbles.enter().append('circle').classed('bubble', true)
    .attr('r', 0)
    .attr('fill', function (d) { return getSectorBackgroundColor(d.cve_severity || d.resource_type); })
    .attr('stroke', function (d) { return getSectorStrokeColor(d.cve_severity || d.resource_type); })
    .attr('stroke-width', 1)
    .attr('cursor', 'pointer')
    .attr('pointer-events', function (d) { return getBubbleEvents(d)})
    .on('mouseover', this.showDetail)
    .on('mouseout', this.hideDetail)
    .on('click', this.onBubbleClick);

    bubbles.transition().duration(2000).attr('r', function (d) { return d.radius; });

    this.groupBubbles();
  }

  createResourceNodes(rawData) {
    var myNodes = rawData.map(function (d) {
      return {
        id: d.timestamp + d.resource_type,
        // radius: radiusScale(+d.count),
        radius: radiusScale(+BUBBLE_DEFAULT_RADIUS),
        value: d.count,
        resource_type: d.resource_type,
        timestamp: d.timestamp_as_string,
        isVisible: d.isVisible,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });
    myNodes.sort(function (a, b) { return b.value - a.value });
    return myNodes;
  }

  createVulnerabilityNodes(rawData) {
    var myNodes = rawData.map(function (d) {
        return {
          id: d.timestamp + d.cve_id + d.cve_severity,
          // radius: radiusScale(+d.count),
          radius: radiusScale(+BUBBLE_DEFAULT_RADIUS),
          value: d.count,
          name: d.cve_container_image,
          cve_severity: d.cve_severity,
          cve_container_image: d.cve_container_image,
          timestamp: d.timestamp_as_string,
          isVisible: d.isVisible,
          cve_id: d.cve_id,
          x: Math.random() * 900,
          y: Math.random() * 800
        };
    });
    myNodes.sort(function (a, b) { return b.value - a.value });
    return myNodes;
  }

  createDummyNodes(dummyBubbleCount) {
   let dummyNodes = [];
   for (let i=0; i<dummyBubbleCount; i++) {
     dummyNodes.push({
       id: Math.floor((Math.random() * 1000) + 1),
       radius: 15,
       isVisible: true,
       cve_severity: 'default',
       x: Math.random() * 900,
       y: Math.random() * 800
     })
   }
   return dummyNodes;
  }

  groupBubbles() {
    force.on('tick', (e)=> {
      bubbles.each(moveToCenter(e.alpha))
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });
    });
    force.start();
  }

  initializeBubbleChartView(data) {
    // clearing bubble chart previous instance.
    var myNode = document.getElementById("bubble-chart");
    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
    }

    this.populateBubbleChart('#bubble-chart', data);
  }

  showDetail(d) {
    this.props.onBubbleMouseInCallback(d);
  }

  hideDetail(d) {
    this.props.onBubbleMouseOutCallback(d);
  }

  onBubbleClick(d) {
    this.props.onBubbleClickCallback(d);
  }

  render() {
    const alignCenter = {
      textAlign: 'center'
    };
    return (
      <div id="bubble-chart" style={alignCenter}></div>
    );
  }

}

function mapStateToProps(state) {
  return {};
}

export default connect(
  mapStateToProps
)(BubbleChart);

BubbleChart.defaultProps = {
  defaultDomainRange: 18,
  maxBubbleRange: 250,
  minRange: 2
};