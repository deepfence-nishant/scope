/*eslint-disable*/

//React imports
import React from 'react';
import { connect } from 'react-redux';

import { isEqual } from 'lodash';

import { getGeoMapData } from "../../../actions/app-actions";
import {EMPTY_STATE_TEXT} from "../../../constants/naming";

class GeoMap extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};

    this.updateCustomMarkers = this.updateCustomMarkers.bind(this);
    this.createCustomMarker = this.createCustomMarker.bind(this);
  }

  componentDidMount() {
    // Initial api call to get the data
    this.retrieveGeoMapData();

    // If data is present then populate the map
    if (this.props.geoMapData) {
      this.updateGeoMapData(this.props.geoMapData);
    }

    // Calls on the basis of active time interval
    if(this.props.refreshInterval){
      let interval = setInterval(()=>{
        this.retrieveGeoMapData();
      }, this.props.refreshInterval.value*1000)
      this.setState({intervalObj : interval});
    }
  }

  componentWillReceiveProps(newProps){
    if(newProps.refreshInterval && (this.props.refreshInterval != newProps.refreshInterval)){
      let interval = setInterval(()=>{
        this.retrieveGeoMapData();
      }, newProps.refreshInterval.value*1000)
      if(this.state.intervalObj){
        clearInterval(this.state.intervalObj);
      }
      this.setState({intervalObj : interval});
    } else if (!isEqual(newProps.geoMapData, this.props.geoMapData)) {
      this.updateGeoMapData(newProps.geoMapData);
    } else if ((newProps.days != this.props.days) || (newProps.searchQuery != this.props.searchQuery)) {
      this.retrieveGeoMapData(newProps.days.value.number, newProps.days.value.time_unit, newProps.searchQuery);
    }
  }

  componentWillUnmount() {
    // Clearing the intervals
    if(this.state.intervalObj){
      clearInterval(this.state.intervalObj);
    }
    // Resetting component states
    this.setState({mapData: undefined});
  }

  retrieveGeoMapData(number, time_unit, lucene_query) {
    let params = {
      number: number || this.props.days.value.number,
      time_unit: time_unit || this.props.days.value.time_unit,
      lucene_query: lucene_query || this.props.searchQuery
    }
    this.props.dispatch(getGeoMapData(params));
  }

  updateGeoMapData(data) {
    this.setState({mapData: JSON.parse(JSON.stringify(data))}, function stateUpdateComplete() {
      this.renderGeoMap(this.state.mapData);
    }.bind(this));
  }

  renderGeoMap() {
    var map = AmCharts.makeChart( "chartDiv", {
      "type": "map",
      "theme": "light",
      "projection": "miller",
      "imagesSettings": {
        "rollOverColor": "#999999",
        "rollOverScale": 3,
        "selectedScale": 3,
        "selectedColor": "#999999",
        "color": "#999999"
      },
      "areasSettings": {
        "unlistedAreasColor": "#999999"
      },
      "dataProvider": {
        "map": "worldLow",
        "images": this.state.mapData
      },
      "zoomControl": {
        "homeButtonEnabled": false,
        "bottom": 20,
        "buttonIconColor": '#0276c9',
        "buttonFillColor": '#07131d',
        "buttonRollOverColor": '#0b3e58',
        "buttonBorderColor": '#0276c9',
        "buttonBorderAlpha": 1,
        "buttonBorderThickness": 1,
        "gridHeight": 10,
        "buttonSize": 20
      }
    });
    // add events to recalculate map position when the map is moved or zoomed
    map.addListener("positionChanged", this.updateCustomMarkers);

    // Triggering event for the first time
    map.positionChanged();

  }

  // this function creates and returns a new marker element
  createCustomMarker( image ) {
    // create holder
    var holder = document.createElement( 'div' );
    holder.className = 'map-marker';
    holder.title = `${image.city_name} - ${image.ip}`;
    holder.style.position = 'absolute';

    // maybe add a link to it?
    if ( undefined != image.url ) {
      holder.onclick = function() {
        window.location.href = image.url;
      };
      holder.className += ' map-clickable';
    }

    // create dot
    var dot = document.createElement( 'div' );
    dot.className = 'dot';
    holder.appendChild( dot );

    // create pulse
    var pulse = document.createElement( 'div' );
    pulse.className = 'pulse';
    holder.appendChild( pulse );

    // append the marker to the map container
    image.chart.chartDiv.appendChild( holder );

    $(holder).tooltip({});

    return holder;
  }

  // this function will take current images on the map and create HTML elements for them
  updateCustomMarkers( event ) {
    // get map object
    var map = event.chart;

    // go through all of the images
    for (let i=0; i<map.dataProvider.images.length; i++) {
      // get MapImage object
      var image = map.dataProvider.images[i];

      // check if it has corresponding HTML element
      if ( 'undefined' == typeof image.externalElement ) {
        image.externalElement = this.createCustomMarker(image);
      }

      // reposition the element accoridng to coordinates
      var xy = map.coordinatesToStageXY( image.longitude, image.latitude );
      image.externalElement.style.top = xy.y + 'px';
      image.externalElement.style.left = xy.x + 'px';
    }
  }

  getChartView(){
    return(
      <div id="chartDiv"></div>
    )
  }

  getEmptyState() {
    const emptyStateWrapper = {
      height: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
    return(
      <div style={emptyStateWrapper}>
        <div className='empty-state-text'>{ EMPTY_STATE_TEXT }</div>
      </div>
    );
  }

  render() {
    return (
      <div>
        { this.state.mapData ? this.getChartView() : this.getEmptyState() }
      </div>
    );
  }

}

function mapStateToProps(state) {
  return {
    geoMapData: state.get('geoMapData'),
    searchQuery: state.get('globalSearchQuery'),
    days: state.get('alertPanelHistoryBound'),
    refreshInterval: state.get('refreshInterval')
  };
}

export default connect(
  mapStateToProps
)(GeoMap);