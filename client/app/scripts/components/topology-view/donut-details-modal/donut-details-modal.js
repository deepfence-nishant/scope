/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';
import ReactPaginate from 'react-paginate';

import {closeDonutDetailsModal, requestManualAlertNotification, setActiveFilters} from '../../../actions/app-actions';
import DetailsTable from './details-table/details-table';
import {fetchNodeSpecificDetails, maskAlertDocument} from "../../../utils/web-api-utils";

class DonutDetailsModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeIndex: 0,
      recordsPerPage: 10,
      sortOrder: 'asc'
    }
    this.onClickClose = this.onClickClose.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.setTotalPagesCount = this.setTotalPagesCount.bind(this);
    this.resetTableUI = this.resetTableUI.bind(this);
  }

  componentDidMount() {
    // On page load call
    this.fetchNodeDetails();

    // Calls on the basis of active time interval
    if(this.props.refreshInterval){
      let interval = setInterval(()=>{
        this.fetchNodeDetails();
      }, this.props.refreshInterval.value*1000)
      this.setState({intervalObj : interval});
    }
  }

  componentWillReceiveProps(newProps) {
    // Setting total pages count for pagination
    if (newProps.hasOwnProperty('nodeSpecificDetails') && newProps.nodeSpecificDetails != undefined){
      this.setTotalPagesCount(
        Math.min(newProps.nodeSpecificDetails.data.total, newProps.nodeSpecificDetails.data.max_result_window)
      );
    }
    if(newProps.refreshInterval && (this.props.refreshInterval != newProps.refreshInterval)){
      let interval = setInterval(()=>{
        const activeDuration = newProps.days.value;
        this.updateTable(activeDuration.number, activeDuration.time_unit);
      }, newProps.refreshInterval.value*1000);
      if(this.state.intervalObj){
        clearInterval(this.state.intervalObj);
      }
      this.setState({intervalObj : interval});
    }
    if (newProps.activeSector != this.props.activeSector || newProps.activeDonut != this.props.activeDonut) {
      // Resetting sorting UI
      this.resetTableUI();
    }
    if (this.props.days != newProps.days) {
      this.updateTable(newProps.days.value.number, newProps.days.value.time_unit);
    }
  }

  componentWillUnmount(){
    if(this.state.intervalObj){
      clearInterval(this.state.intervalObj);
    }
  }

  resetTableUI() {
    this.setState({sortOrder: 'asc'});
    this.updatePagination(0);
  }

  updatePagination(activeIndex) {
    this.setState({forcePage: activeIndex});
    if (activeIndex == 0) {
      this.setState({activeIndex: activeIndex});
    }
    setTimeout(()=> {
      if (this.state.forcePage === activeIndex) {
        this.setState({forcePage: undefined});
      }
    },0);
  }

  updateTable(number, time_unit) {
    this.setState({sortOrder: 'asc', forcePage: 0, activeIndex: 0}, function stateUpdateComplete() {
      this.fetchAlertsDetails(number, time_unit);
    }.bind(this));
    setTimeout(()=> {
      if (this.state.forcePage === 0) {
        this.setState({forcePage: undefined});
      }
    },0);
  }

  fetchAlertsDetails(number, time_unit) {
    fetchNodeSpecificDetails(
      this.props.dispatch,
      this.props.activeSector,
      this.props.activeDonut,
      this.props.activeNode,
      this.props.activeTopologyId,
      this.state.activeIndex,
      this.state.recordsPerPage,
      this.state.sortOrder,
      this.props.activeFilter,
      this.props.activeOptions,
      number || this.props.days.value.number,
      time_unit || this.props.days.value.time_unit
    );
  }

  maskAlert(alertsCollection) {
    const totalCount = Math.min(this.props.nodeSpecificDetails.data.total, this.props.nodeSpecificDetails.data.max_result_window);
    const recordsDeleted = alertsCollection.length;
    const totalRecordsRemained = totalCount - recordsDeleted;
    const newActiveIndex = Math.ceil(totalRecordsRemained / this.state.recordsPerPage);

    if (((this.state.activeIndex+10)/10) > newActiveIndex){
      const activeIndex = (newActiveIndex-1)*10;
      this.setState({activeIndex: activeIndex}, function stateUpdateComplete() {
        maskAlertDocument(
          this.props.dispatch, alertsCollection, this.props.activeSector, this.props.activeDonut,
          this.props.activeNode, this.props.activeTopologyId, this.state.activeIndex, this.state.recordsPerPage,
          this.state.sortOrder, this.props.activeFilter, this.props.activeOptions, this.props.days.value.number,
          this.props.days.value.time_unit
        );
      }.bind(this));
    } else {
      maskAlertDocument(
        this.props.dispatch, alertsCollection, this.props.activeSector, this.props.activeDonut,
        this.props.activeNode, this.props.activeTopologyId, this.state.activeIndex, this.state.recordsPerPage,
        this.state.sortOrder, this.props.activeFilter, this.props.activeOptions,this.props.days.value.number,
        this.props.days.value.time_unit
      );
    }
  }

  notifyAlert(alertsCollection) {
    let params = {
      alerts: alertsCollection
    };
    this.props.dispatch(requestManualAlertNotification(params));
  }

  fetchNodeDetails() {
    fetchNodeSpecificDetails(
      this.props.dispatch,

      this.props.activeSector,
      this.props.activeDonut,
      this.props.activeNode,
      this.props.activeTopologyId,

      this.state.activeIndex,
      this.state.recordsPerPage,
      this.state.sortOrder,

      undefined, // Filters replacement
      undefined, // Filters replacement

      this.props.days.value.number,
      this.props.days.value.time_unit
    );
  }

  handlePageChange(data) {
    if (data.selected != 0) {
      this.setState({activeIndex: ((data.selected * this.state.recordsPerPage))});
    } else {
      this.setState({activeIndex: data.selected});
    }
    setTimeout(()=> {
      this.fetchAlertsDetails();
    },0)
  }

  setTotalPagesCount(totalRecords){
    const totalPages = totalRecords / this.state.recordsPerPage
    const totalPagesCeilCount = Math.ceil(totalPages);
    this.setState({totalPages: totalPagesCeilCount});
    this.updatePagination(this.state.activeIndex / this.state.recordsPerPage);
  }

  onClickClose(){
    this.props.dispatch(closeDonutDetailsModal());
  }

  sortTimeStamp() {
    const sortOrder = this.state.sortOrder;
    if (sortOrder === 'asc') {
      this.setState({sortOrder: 'desc'});
    } else {
      this.setState({sortOrder: 'asc'});
    }
    setTimeout(()=>{
      this.fetchAlertsDetails();
    },0)
  }

  getFilteredAlerts(activeFilter, activeOptions) {
    // filtering data should reset to start i.e activeIndex=0
    this.setState({activeIndex: 0}, function stateUpdateComplete() {
      this.props.dispatch(setActiveFilters(activeFilter, activeOptions));
      setTimeout(() =>{
        this.fetchAlertsDetails();
      }, 0);
    }.bind(this));
  }

  render() {
    let nodeDetails = {};
    let isDataAvailable = false;
    const { nodeSpecificDetails } = this.props;
    if (nodeSpecificDetails !== undefined &&
      Object.prototype.hasOwnProperty.call(nodeSpecificDetails, 'data')) {
      isDataAvailable = true;
      nodeDetails = nodeSpecificDetails.data.hits;
    }
    return (
        <div className="chart-details-wrapper">
          <div className="modal-header">
            <div className="header-text">Alerts Table</div>
            { isDataAvailable &&
            <div className="react-paginate">
              {
                (this.state.totalPages != 0 || this.state.totalPages != undefined) &&
                <ReactPaginate previousLabel={"<<"} nextLabel={">>"}
                               pageCount={this.state.totalPages} marginPagesDisplayed={2}
                               pageRangeDisplayed={2} containerClassName={"pagination"}
                               subContainerClassName={"pages pagination"} activeClassName={"active"}
                               onPageChange={this.handlePageChange} forcePage={this.state.forcePage}/>
              }
            </div>
            }
            <div title="Close details" className="fa fa-close" onClick={this.onClickClose} />
          </div>
          <div className="modal-body">
            <DetailsTable
              data={nodeDetails} sortOrder={this.state.sortOrder} onSortCallback={() => this.sortTimeStamp()}
              onFilterApplyCallback={(activeFilter, activeOptions) => this.getFilteredAlerts(activeFilter, activeOptions)}
              onMaskAlertallback={(alertsCollection) => this.maskAlert(alertsCollection)}
              onNotifyAlertCallback={(alertsCollection) => this.notifyAlert(alertsCollection)}/>
          </div>
        </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    nodeSpecificDetails: state.get('nodeSpecificDetails'),
    activeDonut: state.get('activeDonut'),
    activeSector: state.get('activeSector'),
    activeNode: state.get('activeNode'),
    activeTopologyId: state.get('activeTopologyId'),
    activeFilter: state.get('activeFilter'),
    activeOptions: state.get('activeOptions'),
    days: state.get('alertPanelHistoryBound'),
    refreshInterval: state.get('refreshInterval'),
  };
}

export default connect(
  mapStateToProps
)(DonutDetailsModal);
