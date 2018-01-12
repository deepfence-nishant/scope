/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports
import {setSearchQuery} from '../../../actions/app-actions';

// Color util imports
import {getSectorStrokeColor, getSectorBackgroundColor, getSectorHoveredColor} from '../../../utils/color-utils';
import {luceneQueryChecker, updateSearchQueryArr} from "../../../utils/array-utils";

const d3 = require('d3');

class Sector extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      isSectorActive: false
    };
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  onMouseOver(value, text) {
    // const newPosition = this.getNewPosition(this.props.data);
    this.setState({isSectorActive: true});
    // this.setState({isSectorActive: true, newPos: `translate(${newPosition.x},${newPosition.y})`});
    // this.refs.arc.transition().duration(500).ease('bounce');
    this.props.onSetValueCallback(value, text);
  }

  onMouseOut() {
    this.setState({isSectorActive: false});
    this.props.onUnsetValueCallback();
  }

  // DMethod to calculate new position of sector.

  // Put this line on g tag in case of animation activation.
  // transform={this.state.isSectorActive ? this.state.newPos : "translate(0,0)"}
  /*getNewPosition(d) {
    var dist = 10;
    d.midAngle = ((d.endAngle - d.startAngle) / 2) + d.startAngle;
    var x = Math.sin(d.midAngle) * dist;
    var y = -Math.cos(d.midAngle) * dist;
    return {x:x, y:y};
  }*/

  render() {
    const outerRadius = this.props.width / 2.1;
    const innerRadius = this.props.width / 2.7;
    const arc = d3.svg.arc().outerRadius(outerRadius).innerRadius(innerRadius);
    return (
      <g onMouseOver={()=> this.onMouseOver(this.props.data.value, this.props.name)}
         onMouseOut={()=> this.onMouseOut()}
         onClick={this.onClick}>
        <path
          fill={this.state.isSectorActive ? getSectorHoveredColor(this.props.name) : getSectorBackgroundColor(this.props.name)}
          stroke={getSectorStrokeColor(this.props.name)}
          d={arc(this.props.data)} />
      </g>
    );
  }

  onClick() {
    const activeSector = this.props.name;
    const activeDonut = this.props.donutName;

    let luceneQuery = `${activeDonut}:${activeSector}`;
    const isLuceneQueryExist = luceneQueryChecker(this.props.searchQuery, `(${luceneQuery})`);

    let searchQuery = [];
    if (this.props.searchQuery.length > 0) {
      if (!isLuceneQueryExist) {
        searchQuery = updateSearchQueryArr(this.props.searchQuery, `(${luceneQuery})`);
      } else {
        searchQuery = this.props.searchQuery;
      }
    } else {
      searchQuery.push(`(${luceneQuery})`);
    }

    this.props.dispatch(setSearchQuery({searchQuery:searchQuery}));
  }
}

function mapStateToProps(state) {
  return {
    searchQuery: state.get('globalSearchQuery')
  };
}

export default connect(
  mapStateToProps
)(Sector);
