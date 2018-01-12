/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports
import { setActiveDonut } from '../../../actions/app-actions';

// Color util imports
import { getSectorStrokeColor, getSectorBackgroundColor } from '../../../utils/color-utils';

const d3 = require('d3');

class Sector extends React.Component {
  constructor(props) {
    super(props);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  onMouseOver(value) {
    this.props.onSetValueCallback(value);
  }

  onMouseOut() {
    this.props.onUnsetValueCallback();
  }

  render() {
    const outerRadius = this.props.width / 2.1;
    const innerRadius = this.props.width / 2.7;
    const arc = d3.svg.arc().outerRadius(outerRadius).innerRadius(innerRadius);
    return (
      <g onMouseOver={()=> this.onMouseOver(this.props.data.value)}
         onMouseOut={()=> this.onMouseOut()}
         onClick={this.onClick} >
        <path
          fill={getSectorBackgroundColor(this.props.name)}
          stroke={getSectorStrokeColor(this.props.name)}
          d={arc(this.props.data)} />
      </g>
    );
  }

  onClick() {
    const activeSector = this.props.name;
    const activeDonut = this.props.donutName;
    const activeNode = this.props.nodeName;
    const activeTopologyId = this.props.topologyType;

    let severityArr = [];
    let nodeArr = [];
    severityArr.push(activeSector);
    nodeArr.push(activeNode);

    this.props.dispatch(setActiveDonut(severityArr, activeDonut, nodeArr, activeTopologyId));
  }
}

function mapStateToProps() {
  return {};
}

export default connect(
  mapStateToProps
)(Sector);
