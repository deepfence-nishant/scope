/* eslint-disable */

import React from 'react';
import { connect } from 'react-redux';
import { Map as makeMap } from 'immutable';

import { Chart } from 'react-d3-core';
import { PieChart } from 'react-d3-basic';

import MatchedText from '../matched-text';
import ShowMore from '../show-more';
import { formatDataType } from '../../utils/string-utils';
import { getSerializedTimeTravelTimestamp } from '../../utils/web-api-utils';


const valuePie = function(d) {
 return 0 + d.value;
}
const namePie = function(d) {
 return d.id;
}

const high_severity = {
    "id": "high_severity",
    "field": "high_severity",
    "color": "#ef5350",
    style: {
     "color": "#ef5350",
     "fill": "#ef5350",
     "stroke": "none"
    }
  }
const low_severity = {
    "id": "low_severity",
    "field": "low_severity",
    "color": "#03a9f4",
    style: {
     "color": "#03a9f4",
     "fill": "#03a9f4",
     "stroke": "none"
    }
  }  
const medium_severity = {
    "id": "medium_severity",
    "field": "medium_severity",
    "color": "#ffc107",
    style: {
     "color": "#ffc107",
     "fill": "#ffc107",
     "stroke": "none"
    }
  }


const generalChartData = [
 {
  id:"high_severity",
  label:"High Severity",
  priority:0.2,
  value:"10" 
 }, 
 {
  id:"medium_severity",
  label:"Medium Severity",
  priority:0.2,
  value:"20" 
 }, 
 {
  id:"low_severity",
  label:"Low Severity",
  priority:0.2,
  value:"150" 
 } 
];



class NodeDetailsInfo extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      expanded: false
    };
    this.handleClickMore = this.handleClickMore.bind(this);
  }

  handleClickMore() {
    const expanded = !this.state.expanded;
    this.setState({expanded});
  }

  render() {
    const { timestamp, matches = makeMap() } = this.props;
    let rows = (this.props.rows || []);
    let notShown = 0;

    const prime = rows.filter(row => row.priority < 10);
    if (!this.state.expanded && prime.length < rows.length) {
      // check if there is a search match in non-prime fields
      const hasNonPrimeMatch = matches && rows.filter(row => row.priority >= 10
        && matches.has(row.id)).length > 0;
      if (!hasNonPrimeMatch) {
        notShown = rows.length - prime.length;
        rows = prime;
      }
    }

    // window.console.log(rows);
    const chartData = rows.filter(row => row.id.endsWith('_severity') );   
    //const chartData = generalChartData;
    //const chartData = [];
    
    const addVal = function(cd, dd, dk){
        const dv = dd.filter(r => r.id === dk);
        cd.value = parseInt('' + ( dv.length > 0 ? (0 + dv[0].value) : 0 )) ;
        cd.name = '' + cd.value;
        //window.console.log(cd);
        return cd;
    }
    const chartSeries = [
      addVal(medium_severity, chartData, 'medium_severity'),
      addVal(high_severity, chartData, 'high_severity'),
      addVal(low_severity, chartData, 'low_severity')
    ].filter( r => r.value > 0);

    //window.console.log('filtered data');
    //window.console.log(chartSeries);
    
    const margins = {top: 0, right: 0, bottom: 0, left: 0};
    let chartComp = <span />;
    if (chartSeries.length > 0){
        chartComp = <div style={{margin: '-15px 0px'}} > <PieChart
             width="320"
             height="250"
             margins={margins}
             data={chartData}
             chartSeries={chartSeries}
             value={valuePie}
             name={namePie}
             innerRadius="30"
             stroke="none"
             backgroundColor="#1a1a1a"
           /> </div>
    }

    return (
      <div className="node-details-info">
        {chartComp}
        {rows.map((field) => {
          const { value, title } = formatDataType(field, timestamp);
          return (
            <div className="node-details-info-field" key={field.id}>
              <div className="node-details-info-field-label truncate" title={field.label}>
                {field.label}
              </div>
              <div className="node-details-info-field-value truncate" title={title}>
                <MatchedText
                  text={value}
                  truncate={field.truncate}
                  match={matches.get(field.id)} />
              </div>
            </div>
          );
        })}
        <ShowMore
          handleClick={this.handleClickMore} collection={this.props.rows}
          expanded={this.state.expanded} notShown={notShown} />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    timestamp: getSerializedTimeTravelTimestamp(state),
  };
}

export default connect(mapStateToProps)(NodeDetailsInfo);
