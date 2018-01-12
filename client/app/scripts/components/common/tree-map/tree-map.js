/*eslint-disable*/

//React imports
import React from 'react';
import { connect } from 'react-redux';

import { isEqual } from 'lodash';

import D3Legend from '../clickable-legends-view/d3-legend';

import {
  getSectorBackgroundColor,
  getSectorStrokeColor
} from '../../../utils/color-utils';
import {
  getObjectKeys,
  getOrderedData,
  luceneQueryChecker,
  updateSearchQueryArr
} from '../../../utils/array-utils';
import {
  setSearchQuery
} from '../../../actions/app-actions';
import { legendEdgeCaseCheck } from '../../../utils/visualization-utils';

function getLegendsFormat(metaData) {
  const orderedMetaData = getOrderedData('severity', metaData);
  let legendData = [];
  orderedMetaData.forEach((legend)=> {
    legendData.push({key_name: legend, key_value: 0, isChecked: true});
  });
  return legendData;
}

function formatTreeMapData(data) {
  let resultData = JSON.parse(JSON.stringify(data));
  for (let key in resultData) {
    resultData[key]['isVisible'] = true;
  }
  return resultData;
}

function getFilteredData(data) {
  const result = {};
  let dataCopy = JSON.parse(JSON.stringify(data));
  for (let key in dataCopy) {
    if (dataCopy[key].isVisible) {
      result[key] = dataCopy[key]
    }
  }
  return result;
}

class TreeMap extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      point: []
    };
    this.renderTreeMap = this.renderTreeMap.bind(this);
  }

  componentDidMount() {
    // Re rendering chart on window resize
    window.addEventListener("resize", this.renderTreeMap);

    if (this.props.data) {
      this.initializeTreeMapData(formatTreeMapData(this.props.data));
      this.initializeLegends(getLegendsFormat(getObjectKeys(this.props.data)));
    }
  }

  componentWillReceiveProps(newProps){
    if (!isEqual(newProps.data, this.props.data)) {
      this.initializeTreeMapData(formatTreeMapData(newProps.data));
      this.initializeLegends(getLegendsFormat(getObjectKeys(newProps.data)));
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.renderTreeMap);
    this.setState({
      points: []
    })
  }

  initializeTreeMapData(data) {
    this.setState({treeMapData: data}, function stateUpdateComplete() {
      this.manipulateTreeMapData(this.state.treeMapData);
    }.bind(this));
  }

  initializeLegends(legendCollection) {
    this.setState({treeMapLegends: legendCollection});
  }

  manipulateTreeMapData(response) {
    var data = response;
    var points = [];
    let severityId = 0;
    for (let severity in data) {
      if (data.hasOwnProperty(severity)) {
        let severityValue = 0;
        let severityDetails = {
          id: 'id_' + severityId,
          name: severity,
          color: getSectorBackgroundColor(severity),
          borderColor: getSectorStrokeColor(severity),
          borderWidth: 1
        };
        let anomalyId = 0;
        for (let anomaly in data[severity]) {
          if (data[severity].hasOwnProperty(anomaly)) {
            let anomalyDetails = {
              id: severityDetails.id + '_' + anomalyId,
              name: anomaly,
              parent: severityDetails.id,
              borderColor: getSectorStrokeColor(severity),
              borderWidth: 1
            };
            points.push(anomalyDetails);
            let containerId = 0;
            for (let container in data[severity][anomaly]) {
              if (data[severity][anomaly].hasOwnProperty(container)) {
                let containerDetails = {
                  id: anomalyDetails.id + '_' + containerId,
                  name: container,
                  anomaly: anomaly,
                  severity: severity,
                  parent: anomalyDetails.id,
                  value: Math.round(+data[severity][anomaly][container]),
                  borderColor: getSectorStrokeColor(severity),
                  borderWidth: 1,
                };
                severityValue += containerDetails.value;
                points.push(containerDetails);
                containerId = containerId + 1;
              }
            }
            anomalyId = anomalyId + 1;
          }
        }
        severityDetails.value = Math.round(severityValue / anomalyId);
        points.push(severityDetails);
        severityId = severityId + 1;
      }
    }

    this.setState({points: points}, function stateUpdateComplete() {
      this.renderTreeMap();
    }.bind(this));
  }

  renderTreeMap() {
    Highcharts.chart('tree-map', {
      chart: {
        textAlign: 'center',
        width: 460,
        height: 300
      },
      title: {
        text: ''
      },
      credits: {
        enabled: false
      },
      tooltip: {
        enabled: false
      },
      xAxis: {
        type: 'category'
      },
      plotOptions: {
        series: {
          point: {
            events: {
              mouseOver: (e)=> {
                this.props.onMouseOverCallback(e)
              },
              mouseOut: ()=> {
                this.props.onMouseOutCallback()
              }
            }
          },
        }
      },
      series: [{
        drillUpButton: {
          position: {
            align: 'left',
            x: 20
          },
          theme: {
            fill: 'white',
            'stroke-width': 1,
            stroke: '#252525',
            r: 5
          }
        },
        type: 'treemap',
        layoutAlgorithm: 'squarified',
        allowDrillToNode: true,
        animationLimit: 1000,
        events: {
          click: (event)=> {
            if (event.point.node.isLeaf){
              let params = {
                severity: event.point.severity,
                anomaly: event.point.anomaly,
                container_name: event.point.node.name
              }
              this.triggerLuceneQuery(params);
            }
          }
        },
        dataLabels: {
          enabled: false
        },
        levelIsConstant: false,
        levels: [{
          level: 1,
          dataLabels: {
            enabled: true
          },
          borderWidth: 3
        }],
        data: this.state.points
      }]
    });
  }

  triggerLuceneQuery(params) {
    let luceneQuery = Object.keys(params).map(key => `${key}:${params[key]}`).join(' AND ');
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

  // Donut legends single click handler
  handleSingleClick(value) {
    this.updateTreeMapOnSingleClick(value);
  }

  // Donut legends double click handler
  handleDoubleClick(value) {
    this.updateTreeMapOnDoubleClick(value);
  }

  // Method to update donut on legend single click
  updateTreeMapOnSingleClick(selectedSector){
    let treeMapDataCopy = JSON.parse(JSON.stringify(this.state.treeMapData));
    if(treeMapDataCopy[selectedSector.severity].isVisible) {
      treeMapDataCopy[selectedSector.severity].isVisible = false;
    } else {
      treeMapDataCopy[selectedSector.severity].isVisible = true;
    }
    this.setState({treeMapData: treeMapDataCopy}, function stateUpdateComplete() {
      this.manipulateTreeMapData(getFilteredData(this.state.treeMapData));
    }.bind(this));

    let legendCollection = JSON.parse(JSON.stringify(this.state.treeMapLegends));
    legendCollection.forEach((selectedLegend)=> {
      if (selectedSector[Object.keys(selectedSector)[0]] === selectedLegend.key_name){
        if (selectedLegend.isChecked) {
          selectedLegend.isChecked = false;
        } else {
          selectedLegend.isChecked = true;
        }
      }
    });
    this.setState({treeMapLegends: legendCollection});

    const isEdgeCase = legendEdgeCaseCheck(JSON.parse(JSON.stringify(this.state.treeMapData)));
     if (isEdgeCase) {
       this.initializeTreeMapData(formatTreeMapData(this.props.data));
       this.initializeLegends(getLegendsFormat(getObjectKeys(this.props.data)));
     }
  }

  // Method to update donut on legend double click
  updateTreeMapOnDoubleClick(selectedSector){
    let treeMapDataCopy = JSON.parse(JSON.stringify(this.state.treeMapData));
    for (let key in treeMapDataCopy) {
      if(key === selectedSector.severity) {
        treeMapDataCopy[key].isVisible = true;
      } else {
        treeMapDataCopy[key].isVisible = false;
      }
    }
    this.setState({treeMapData: treeMapDataCopy}, function stateUpdateComplete() {
      this.manipulateTreeMapData(getFilteredData(this.state.treeMapData));
    }.bind(this));

    let legendCollection = JSON.parse(JSON.stringify(this.state.treeMapLegends));
    legendCollection.forEach((selectedLegend)=> {
      if (selectedSector[Object.keys(selectedSector)[0]] === selectedLegend.key_name){
        selectedLegend.isChecked = true;
      } else {
        selectedLegend.isChecked = false;
      }
    });
    this.setState({treeMapLegends: legendCollection});
  }

  render() {
    const legendsWrapper = {
      margin: '0 auto',
    }
    const legendStyles = {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-around'
    }
    return (
      <div className="tree-map-tab-content-wrapper">
        <div className="tab-map-column">
          <div className="tree-map-container">
            <div id="tree-map"></div>
          </div>
        </div>
        <div className="tab-legends-column">
          <div className="legends-wrapper" style={legendsWrapper}>
            {this.state.treeMapLegends && <D3Legend
              data={this.state.treeMapLegends}
              legendStyle={legendStyles}
              donutName='severity'
              onSingleClickCallback={(value)=> this.handleSingleClick(value)}
              onDoubleClickCallback={(value)=> this.handleDoubleClick(value)}
            />}
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    searchQuery: state.get('globalSearchQuery')
  };
}

export default connect(
  mapStateToProps
)(TreeMap);