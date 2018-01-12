/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

import { isEqual } from 'lodash';

import { setSearchQuery } from "../../../actions/app-actions";

import D3Legend from '../clickable-legends-view/d3-legend';
import { getFormattedDate } from '../../../utils/string-utils';
import { getOrderedData, luceneQueryChecker, updateSearchQueryArr } from '../../../utils/array-utils';
import {
  legendEdgeCaseCheck, maintainVisualizationData,
  modifyVisualizationData
} from '../../../utils/visualization-utils';

var viz,            // vizuly ui object
    viz_container,  // html element that holds the viz (d3 selection)
    viz_title,      // title element (d3 selection)
    theme,          // Theme variable to be used by our viz.

  low_color="#00a9ff",
  high_color="#ff8a00",
  medium_color="#e7d036",
  critical_color="#ff003c",

  node_low_color="#0b3e58",
  node_high_color="#58350b",
  node_medium_color="#58481c",
  node_critical_color="#580b1d",
  default_color= '#7f7e7e';

// Create a skin object that has all of the same properties as the skin objects in the /themes/halo.js vizuly file
var customSkin = {
  name: "custom",
  labelColor: "#00a9ff",
  labelFill: "#000",
  grad0: "#000000",
  grad1: "#010101",
  background_transition: function (selection) {
    viz.selection().select(".vz-background").transition(1000).style("fill-opacity", 0);
  },
  // Here we set the contribution colors based on the party
  link_stroke: function (d, i) {
    return (d.data.severity == "critical") ? critical_color : (d.data.severity == "low") ? low_color: (d.data.severity == "high") ? high_color: (d.data.severity == "medium") ? medium_color: default_color;
  },
  link_fill: function (d, i) {
    return (d.data.severity == "critical") ? critical_color : (d.data.severity == "low") ? low_color: (d.data.severity == "high") ? high_color: (d.data.severity == "medium") ? medium_color: default_color;
  },
  link_fill_opacity:.075,
  // link_node_fill_opacity:.95,
  link_node_fill_opacity:.3,
  node_stroke: function (d, i) {
    return (d.nodeGroup == "critical") ? critical_color : (d.nodeGroup=="low") ? low_color: (d.nodeGroup=="high") ? high_color: (d.nodeGroup == "medium") ? medium_color: default_color;
  },
  node_over_stroke: function (d, i) {
    return (d.nodeGroup == "critical") ? critical_color : (d.nodeGroup=="low") ? low_color: (d.nodeGroup=="high") ? high_color: (d.nodeGroup == "medium") ? medium_color: default_color;
  },
  // Here we set the candidate colors based on the party
  node_fill: function (d, i) {
    return (d.nodeGroup == "critical") ? node_critical_color : (d.nodeGroup=="low") ? node_low_color: (d.nodeGroup=="high") ? node_high_color: (d.nodeGroup == "medium") ? node_medium_color: default_color;
  },
  arc_stroke: function (d, i) {
    return "#000";
  },
  // Here we set the arc contribution colors based on the party
  arc_fill: function (d, i) {
    return (d.data.severity == "critical") ? critical_color : (d.data.severity == "low") ? low_color: (d.data.severity == "high") ? high_color: (d.data.severity == "medium") ? medium_color: default_color;
  },
  arc_over_fill: function (d, i) {
    return "#000";
  },
  class: "vz-skin-political-influence"
}

//Here is a template for our data tip
var datatip='<div id="threat-map-tooltip" class="tooltip" style="width: 250px; opacity:1">' +
  '<div class="header1">HEADER1</div>' +
  '<div class="header-rule"></div>' +
  '<div class="header2"> HEADER2 </div>' +
  '<div class="header-rule"></div>' +
  '<div class="header3"> HEADER3 </div>' +
  '</div>';

// This function uses the above html template to replace values and then creates a new <div> that it appends to the
// document.body.  This is just one way you could implement a data tip.
function createDataTip(h1,h2,h3) {

  var html = datatip.replace("HEADER1", "Alerts");
  html = html.replace("HEADER2", h2);
  html = html.replace("HEADER3", h3);

  /*var html = datatip.replace("HEADER2", h2);
  html = html.replace("HEADER3", h3);*/

  d3.select("body")
  .append("div")
  .attr("class", "vz-halo-label")
  .style("position", "absolute")
  .style("top", "460px")
  .style("left", "160px")
  .style("opacity",0)
  .html(html)
  .transition().style("opacity",1);

}

// This function creates a highlight label with the PAC name when an associated link or candidate has issued a mouseover
// event.  It uses properties from the skin to determine the specific style of the label.
function createPacLabel (x,y,l) {

  var g = viz.selection().selectAll(".vz-halo-arc-plot").append("g")
  .attr("class","vz-halo-label")
  .style("pointer-events","none")
  .style("opacity",0);

  g.append("text")
  .style("font-size","11px")
  .style("fill",theme.skin().labelColor)
  .style("fill-opacity",.75)
  .attr("text-anchor","middle")
  .attr("x", x)
  .attr("y", y)
  .text(l);

  var rect = g[0][0].getBoundingClientRect();
  g.insert("rect","text")
  .style("shape-rendering","auto")
  .style("fill",theme.skin().labelFill)
  .style("opacity",.45)
  .attr("width",rect.width+12)
  .attr("height",rect.height+12)
  .attr("rx",3)
  .attr("ry",3)
  .attr("x", x-5 - rect.width/2)
  .attr("y", y - rect.height-3);

  g.transition().style("opacity",1);
}

function changeSize(val) {
  var s = String(val).split(",");
  viz_container.transition().duration(300).style('width', s[0] + 'px').style('height', s[1] + 'px');
  viz.width(Number(s[0])).height(Number(s[1])).update();
  viz_title.attr("x", viz.width() / 2);
  theme.apply();
}

function getUniqueSeverity(data) {
  const result = [];
  data.forEach((record)=> {
    if (result.indexOf(record.severity) === -1) {
      result.push(record.severity);
    }
  });

  const resultArrWithSeverityCount = [];
  getOrderedData('severity', result).forEach((uniqueKey)=> {
    let counter = 0;
    for (let i=0; i<data.length; i++){
      if (uniqueKey == data[i].severity){
        counter += data[i].count;
      }
    }
    resultArrWithSeverityCount.push({severity: uniqueKey, severityCount: counter})
  });

  return resultArrWithSeverityCount;
}

function getFormatedLegendsData(data) {
  const result = [];
  const uniqueSeverity = getUniqueSeverity(data);
  uniqueSeverity.forEach((uniqueRecord)=> {
    result.push({key_name: uniqueRecord.severity, key_value: uniqueRecord.severityCount, isChecked: true});
  });

  return result;
}

function getUniqueKeysForThreatMapTooltip(optionName, data) {
  var result = [];
  for (let i=0; i<data.length; i++) {
    if (result.indexOf(data[i][optionName]) === -1){
      result.push(data[i][optionName]);
    }
  }
  return result;
}

function getMultipleOptions(optionName, data) {
  var parent = document.createElement("div");

  var optionContainer = document.createElement("div");
  optionContainer.className = "option-wrapper";
  parent.appendChild(optionContainer);


  var uniqueKeys = getUniqueKeysForThreatMapTooltip(optionName, data);

  for (let i=0 ; i<uniqueKeys.length; i++) {
    var node = document.createElement("div");
    node.className = 'option';
    var textNode = document.createTextNode(uniqueKeys[i]);
    node.appendChild(textNode);

    optionContainer.appendChild(node);
  }
  return parent;
}

// Returns lucene query on node click
function getLuceneQueryForNodeClick (params) {
  let luceneQuery = '';
  const uniqueContainers = getUniqueKeysForThreatMapTooltip('container_name', params.containers);

  // form lucene query for container_names
  let containersQuery = uniqueContainers.map(i => 'container_name:' + i).join(' OR ');

  luceneQuery += `(severity:${params.severity} AND anomaly:${params.anomaly} AND (${containersQuery}))`
  return luceneQuery
}

class ThreatMap extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};

    this.handleSingleClick = this.handleSingleClick.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);

    this.updateThreatMapOnSingleClick = this.updateThreatMapOnSingleClick.bind(this);
    this.updateThreatMapOnDoubleClick = this.updateThreatMapOnDoubleClick.bind(this);

    this.node_onClick = this.node_onClick.bind(this);
  }

  componentDidMount() {
    if (this.props.threatMapData) {
      this.renderThreatMap();
      this.loadData(modifyVisualizationData(this.props.threatMapData));
      this.initializeLegends(getFormatedLegendsData(this.props.threatMapData));
    }

    this.setState({
      isInitialState: true
    });
  }

  componentWillReceiveProps(newProps) {
    if (!isEqual(newProps.threatMapData, maintainVisualizationData(this.props.threatMapData))){
      this.renderThreatMap();
      this.loadData(modifyVisualizationData(newProps.threatMapData));
      this.initializeLegends(getFormatedLegendsData(newProps.threatMapData));
    }
  }

  componentWillUnmount() {
    // Clearing the intervals
    if(this.state.intervalObj){
      clearInterval(this.state.intervalObj);
    }
    // Resetting component states
    this.setState({
      isInitialState: undefined
    });
  }

  initializeLegends(legendsData) {
    this.setState({threatMapLegends: legendsData});
  }

  // Threat map legends single click handler
  handleSingleClick(value) {
    this.updateThreatMapOnSingleClick(value);
  }

  // Threat map legends double click handler
  handleDoubleClick(value) {
    this.updateThreatMapOnDoubleClick(value);
  }

  // Threat map legend single click logic
  updateThreatMapOnSingleClick(selectedLegend) {

    if (Object.keys(selectedLegend)[0] === 'severity') {
      let activeThreatMapData = JSON.parse(JSON.stringify(this.state.threatMapData));
      // Threat map update
      activeThreatMapData.forEach((record)=> {
        if (record.severity === selectedLegend[Object.keys(selectedLegend)[0]]) {
          if (record.isVisible) {
            record.isVisible = false;
          } else {
            record.isVisible = true;
          }
        }
      });

      const filteredData = this.getFilteredData(activeThreatMapData)
      this.setState({threatMapData: activeThreatMapData});

      // Legend Update
      let activeLegends = JSON.parse(JSON.stringify(this.state.threatMapLegends));
      activeLegends.forEach((legend)=> {
        if (selectedLegend[Object.keys(selectedLegend)[0]] === legend.key_name){
          if (legend.isChecked) {
            legend.isChecked = false;
          } else {
            legend.isChecked = true;
          }
        }
      });
      this.setState({threatMapLegends: activeLegends});

      // Edge case for legends (Whenever user try to uncheck all the legends initializing legends and threat map data)
      const isEdgeCase = legendEdgeCaseCheck(JSON.parse(JSON.stringify(this.state.threatMapData)));
      if (isEdgeCase) {
        viz.data(modifyVisualizationData(this.state.threatMapData)).update();
        this.initializeLegends(getFormatedLegendsData(this.state.threatMapData));
      } else {
        viz.data(filteredData).update();
      }
    }
  }

  // Threat map legend double click logic
  updateThreatMapOnDoubleClick(selectedLegend) {
    if (Object.keys(selectedLegend)[0] === 'severity') {
      let activeThreatMapData = JSON.parse(JSON.stringify(this.state.threatMapData));

      // Threat map update
      activeThreatMapData.forEach((record)=> {
        if (record.severity === selectedLegend[Object.keys(selectedLegend)[0]]) {
          record.isVisible = true;
        } else {
          record.isVisible = false;
        }
      });
      this.setState({threatMapData: activeThreatMapData});

      // Legend Update
      let activeLegends = JSON.parse(JSON.stringify(this.state.threatMapLegends));
      activeLegends.forEach((legend)=> {
        if (selectedLegend[Object.keys(selectedLegend)[0]] === legend.key_name){
          legend.isChecked = true;
        } else {
          legend.isChecked = false;
        }
      });
      this.setState({threatMapLegends: activeLegends});

      // Update threat map
      const filteredData = this.getFilteredData(activeThreatMapData);
      viz.data(filteredData).update();

    }
  }

  getFilteredData(data) {
    const result = [];
    let dataCopy = JSON.parse(JSON.stringify(data));
    dataCopy.forEach((record)=> {
      if (record.isVisible){
        result.push(record);
      }
    });
    return result;
  }

  renderThreatMap() {
    let screenWidth, screenHeight, rect;

    if (self == top) {
      rect = document.body.getBoundingClientRect();
    } else {
      rect =  parent.document.body.getBoundingClientRect();
    }

    //Set display size based on window size.
    screenWidth = (rect.width < 960) ? Math.round(rect.width*.95) : Math.round((rect.width - 210) *.95)
    screenHeight = Math.min(parent.innerHeight * 0.75, screenWidth);
    screenWidth = screenHeight;

    d3.select("#currentDisplay")
    .attr("item_value", screenWidth + "," + screenHeight)
    .attr("class", "selected")
    .html("<a>" + screenWidth + "px - " + screenHeight + "px</a>");

    // Set the size of our container element.
    viz_container = d3.selectAll("#viz_container")
      .style("width", screenWidth + "px")
      .style("height", screenHeight + "px");
  }

  initialize(data) {

    viz = vizuly.viz.halo_cluster(document.getElementById("viz_container"));

    viz.data(data)
    .width(800).height(400)                     // Initial display size
    .haloKey(function (d) {
      return d.container_id; })                    // The property that determines each PAC
    .nodeKey(function (d) {
      return d.severity + "_" + d.anomaly + "_" + d.timestamp; })                    // The property that determines Candidate
    .nodeGroupKey(function (d) {
      return d.severity; })                        // The property that determines candidate Party affiliation
    .value(function (d) {
      return Number(d.count); })    // The property that determines the weight/size of the link path
    .on("update", this.onUpdate)                     // Callback for viz update
    .on("nodeover", this.node_onMouseOver)            // Callback for mouseover on the candidates
    .on("nodeout", this.onMouseOut)                   // Callback for mouseout on from the candidate
    .on("arcover", this.arc_onMouseOver)              // Callback for mouseover on each PAC
    .on("arcout", this.onMouseOut)                    // Callback for mouseout on each PAC
    .on("linkover", this.link_onMouseOver)            // Callback for mousover on each contribution
    .on("linkout", this.onMouseOut)                   // Callback for mouseout on each contribution
    .on("nodeclick", this.node_onClick)

    //** Themes and skins **  play a big role in vizuly, and are designed to make it easy to make subtle or drastic changes
    //to the look and feel of any component.   Here we choose a theme and skin to use for our bar chart.
    // *See this <a href=''>guide</a> for understanding the details of themes and skins.*
    theme = vizuly.theme.halo(viz);

    // This example shows how you can use a custom skin and add it to the theme.
    // You can see how this skin is made at the end of this file.
    theme.skins()["custom"]=customSkin;
    theme.skin("custom");

    //The <code>viz.selection()</code> property refers to the parent
    //container that was used at the object construction.  With this <code>selection</code> property we can use D3
    //add, remove, or manipulate elements within the component.  In this case we add a title label and heading to our chart.
    viz_title = viz.selection().select("svg").append("text").attr("class", "title")
    .style("font-family","Raleway")
    .style("fill", "#999999 !important")
    .style("stroke", "#999999")
    .attr("x", viz.width() / 2).attr("y", 40).attr("text-anchor", "middle").style("font-weight",300).text("Top Tainted Containers");

    //Update the size of the component
    changeSize(d3.select("#currentDisplay").attr("item_value"));
  }

  loadData(threatMapData) {
    this.setState({threatMapData: threatMapData}, function stateUpdateComplete() {
      if (this.state.isInitialState){
        this.setState({isInitialState: false}, function stateUpdateComplete() {
          this.initialize(this.state.threatMapData);
        }.bind(this));
      } else {
        viz.data(threatMapData).update();
      }
    }.bind(this));
  }

  // Each time the viz is updated we adjust our title color
  // Do a little tweak for our custom skin.
  onUpdate() {
    viz_title.style("fill", (theme.skin() != customSkin) ? theme.skin().labelColor : "#000");
  }

  // Node click listener
  node_onClick(e,d,i) {
    let params = {
      severity: d.values[0].severity,
      anomaly: d.values[0].anomaly,
      containers: d.values
    }
    const luceneQuery = getLuceneQueryForNodeClick(params);
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

  // For each mouse over on the node we want to create a datatip that shows information about the candidate
  // and any assoicated PACs that have contributed to the candidate.
  node_onMouseOver(e,d,i) {
    //Find all node links (candidates) and create a label for each arc
    var haloLabels={};
    var links=viz.selection().selectAll(".vz-halo-link-path.node-key_" + d.key);
    var total=0;

    //For each link we want to dynamically total the transactions to display them on the datatip.
    links.each(function (d) {
      total+= viz.value()(d.data);
      var halos=viz.selection().selectAll(".vz-halo-arc.halo-key_" + viz.haloKey()(d.data));
      halos.each(function (d) {
        if (!haloLabels[d.data.key]) {
          haloLabels[d.data.key]=1;
          createPacLabel(d.x, d.y,d.data.values[0].container_name);
        }
      })
    });

    const timestamp = getFormattedDate(d.values[0].timestamp_as_string);
    const newTable = `
    <div class="table-wrapper">
      <div class="containers-row">
        <div class="row-key">Containers</div> ${getMultipleOptions('container_name', d.values).innerHTML}
      </div>
      <div class="anomaly-row">
        <div class="row-key">Anomaly</div><div class="row-value">${d.values[0].anomaly}</div>
      </div>
      <div class="severity-row">
        <div class="row-key">severity</div><div class="row-value">${d.values[0].severity}</div>
      </div>
    </div>
    `;

    // createDataTip(timestamp, d.values[0].anomaly, "Total Alerts: " + total);
    createDataTip(timestamp, newTable, "Total Alerts: " + total);
  }

  // For each PAC we want to create a datatip that shows the total of all contributions by that PAC
  arc_onMouseOver(e,d,i) {

    //Find all links from a PAC and create totals
    var links=viz.selection().selectAll(".vz-halo-link-path.halo-key_" + d.data.key);
    var total=0;
    links.each(function (d) {
      total+= viz.value()(d.data);
    });

    const timestamp = getFormattedDate(d.data.values[0].timestamp_as_string);
    const newTable = `
    <div class="table-wrapper">
      <div class="containers-row">
        <div class="row-key">Containers</div><div class="row-value">${d.data.key}</div>
      </div>
      <div class="anomaly-row">
        <div class="row-key">Anomaly</div>${getMultipleOptions('anomaly', d.data.values).innerHTML}
      </div>
      <div class="severity-row">
        <div class="row-key">severity</div>${getMultipleOptions('severity', d.data.values).innerHTML}
      </div>
    </div>
    `;

    createDataTip(timestamp, newTable, "Total Alerts: " + total);
  }

  // When we mouse out we want to remove all pac datatips and labels.
  onMouseOut(d,i) {
    d3.selectAll(".vz-halo-label").remove();
  }

  // When the user rolls over a link we want to create a lable for the PAC and a data tip for the candidate that the
  // contribution went to.
  link_onMouseOver(e,d,i) {

    // find the associated candidate and get values for the datatip
    var cand=viz.selection().selectAll(".vz-halo-node.node-key_" + viz.nodeKey()(d.data));
    var datum=cand.datum();

    var total = viz.value()(d.data);

    const timestamp = getFormattedDate(d.data.timestamp_as_string);

    const newTable = `
    <div class="table-wrapper">
      <div class="containers-row">
        <div class="row-key">Containers</div><div class="row-value">${d.data.container_name}</div>
      </div>
      <div class="anomaly-row">
        <div class="row-key">Anomaly</div><div class="row-value">${d.data.anomaly}</div>
      </div>
      <div class="severity-row">
        <div class="row-key">severity</div><div class="row-value">${d.data.severity}</div>
      </div>
    </div>
    `

    createDataTip(timestamp, newTable,"Total Alerts: " + total);

    //find the pac and create a label for it.
    var pac=viz.selection().selectAll(".vz-halo-arc.halo-key_" + viz.haloKey()(d.data));
    datum=pac.datum();
    createPacLabel(datum.x, datum.y,datum.data.values[0].container_name);
  }

  render() {
    return (
      <div className={`threat-map-wrapper ${this.props.isSideNavCollapsed ? 'collapse-side-nav' : 'expand-side-nav'}`}>

        <div id='cssmenu' style={{display: 'none'}}>
          <ul className="main-menu">
            <li className='active'>
              <a><span>Display</span><span className="setting"></span></a>
              <ul className="options" onClick={changeSize}>
                <li id="currentDisplay" className="selected"></li>
              </ul>
            </li>
          </ul>
        </div>

        <div className="threat-map-container">

          <div id="viz_container" className="z-depth-3"></div>

          <div className="threat-map-legends-wrapper">
            {
              this.state.threatMapLegends && <D3Legend
              data={this.state.threatMapLegends}
              donutName="severity"
              onSingleClickCallback={(value) => this.handleSingleClick(value)}
              onDoubleClickCallback={(value) => this.handleDoubleClick(value)}/>
            }
          </div>
        </div>

      </div>
    );
  }

}

function mapStateToProps(state) {
  return {
    isSideNavCollapsed: state.get('isSideNavCollapsed'),
    threatMapData: state.get('threatMapData'),
    days: state.get('alertPanelHistoryBound'),
    searchQuery: state.get('globalSearchQuery'),
    refreshInterval: state.get('refreshInterval')
  };
}

export default connect(
  mapStateToProps
)(ThreatMap);


ThreatMap.defaultProps = {
  screenWidth: 600,
  screenHeight: 600
};
