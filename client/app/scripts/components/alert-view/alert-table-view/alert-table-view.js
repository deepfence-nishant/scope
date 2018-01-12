/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';
import ReactPaginate from 'react-paginate';

// Custom component imports
import TableView from '../../common/table-view/table-view';

import { fetchAlertsData, maskAlert } from '../../../utils/web-api-utils';
import { requestManualAlertNotification, setActiveFilters } from '../../../actions/app-actions';
import {getAlertsTableHeader} from "../../../utils/table-utils";

class AlertTableView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeIndex: 0,
      recordsPerPage: 10,
      sortOrder: 'asc'
    }

    this.handlePageChange = this.handlePageChange.bind(this);
    this.setTotalPagesCount = this.setTotalPagesCount.bind(this);
  }

  componentDidMount() {
    // On page load call
    this.getAlertsData();

    // Calls on the basis of active time interval
    if(this.props.refreshInterval){
      let interval = setInterval(()=>{
        this.getAlertsData();
      }, this.props.refreshInterval.value*1000)
      this.setState({intervalObj : interval});
    }
  }

  componentWillReceiveProps(newProps) {
    // Setting total pages count for pagination
    if (newProps.alertsCollection) {
      this.setTotalPagesCount(
        Math.min(newProps.alertsCollection.data.total, newProps.alertsCollection.data.max_result_window)
      );
    }

    if(newProps.refreshInterval && (this.props.refreshInterval != newProps.refreshInterval)){
      let interval = setInterval(()=>{
        // const activeDuration = newProps.days.value;
        // this.getAlertsData(newProps.searchQuery, activeDuration.number, activeDuration.time_unit);
        this.getAlertsData();
      }, newProps.refreshInterval.value*1000);
      if(this.state.intervalObj){
        clearInterval(this.state.intervalObj);
      }
      this.setState({intervalObj : interval});
    }

    if (this.props.searchQuery != newProps.searchQuery) {
      const activeDuration = newProps.days.value;
      this.setState({activeIndex: 0, sortOrder: 'asc'}, function stateUpdateComplete() {
        this.resetTableFilterAndGetData(newProps.searchQuery, activeDuration.number, activeDuration.time_unit);
      }.bind(this));
    } else if (this.props.days != newProps.days) {
      const activeDuration = newProps.days.value;
      this.setState({activeIndex: 0, sortOrder: 'asc'}, function stateUpdateComplete() {
        this.getAlertsData(newProps.searchQuery, activeDuration.number, activeDuration.time_unit);
      }.bind(this));
    }
  }

  componentWillUnmount(){
    if(this.state.intervalObj){
      clearInterval(this.state.intervalObj);
    }
  }

  getAlertsData(lucene_query, number, time_unit) {
    if (this.props.days){
      let params = {
        activeIndex: this.state.activeIndex,
        recordsPerPage: this.state.recordsPerPage,
        sortOrder: this.state.sortOrder,
        activeFilter: this.props.activeFilter,
        lucene_query: lucene_query || this.props.searchQuery,
        number: number || this.props.days.value.number,
        time_unit: time_unit || this.props.days.value.time_unit,
        type: 'alert',
        typeArr: ['alert']
      };
      fetchAlertsData(this.props.dispatch, params);
    }
  }

  resetTableFilterAndGetData(searchQuery, number, time_unit) {
    let activeFilter = {};
    activeFilter.severity = [];
    activeFilter.anomaly = [];
    this.props.dispatch(setActiveFilters(activeFilter));
    setTimeout(() =>{
      this.getAlertsData(searchQuery, number, time_unit);
    }, 0);
  }

  fetchFilteredAlertsDetails() {
    let params = {
      activeIndex: this.state.activeIndex,
      recordsPerPage: this.state.recordsPerPage,
      sortOrder: this.state.sortOrder,
      activeFilter: this.props.activeFilter,
      lucene_query: this.props.searchQuery,
      number: this.props.days.value.number,
      time_unit: this.props.days.value.time_unit,
      type: 'alert',
      typeArr: ['alert']
    };
    fetchAlertsData(this.props.dispatch, params);
  }

  maskAlert(alertsCollection) {
    let params = {
      activeIndex: this.state.activeIndex,
      recordsPerPage: this.state.recordsPerPage,
      sortOrder: this.state.sortOrder,
      activeFilter: this.props.activeFilter,
      alertsCollection: alertsCollection,
      lucene_query: this.props.searchQuery,
      number: this.props.days.value.number,
      time_unit: this.props.days.value.time_unit,
      type: 'alert',
      typeArr: ['alert']
    };
    const totalCount = Math.min(this.props.alertsCollection.data.total, this.props.alertsCollection.data.max_result_window);
    const recordsDeleted = params.alertsCollection.length;
    const totalRecordsRemained = totalCount - recordsDeleted;
    const newActiveIndex = Math.ceil(totalRecordsRemained / params.recordsPerPage);
    if (((params.activeIndex+10)/10) > newActiveIndex){
      if (((newActiveIndex-1)*10) < 0) {
        params.activeIndex = 0;
      } else {
        params.activeIndex = (newActiveIndex-1)*10;
      }
      this.setState({activeIndex: params.activeIndex});
    }

    maskAlert(this.props.dispatch, params);
  }

  notifyAlert(alertsCollection) {
    let params = {
      alerts: alertsCollection
    };
    this.props.dispatch(requestManualAlertNotification(params));
  }

  handlePageChange(data) {
    if (data.selected != 0) {
      this.setState({activeIndex: ((data.selected * this.state.recordsPerPage))}, function stateUpdateComplete() {
        this.fetchFilteredAlertsDetails()
      }.bind(this));
    } else {
      this.setState({activeIndex: data.selected}, function stateUpdateComplete() {
        this.fetchFilteredAlertsDetails()
      }.bind(this));
    }
  }

  setTotalPagesCount(totalRecords){
    const totalPages = totalRecords / this.state.recordsPerPage;
    const totalPagesCeilCount = Math.ceil(totalPages);
    this.setState({totalPages: totalPagesCeilCount});
    this.updatePagination(this.state.activeIndex / this.state.recordsPerPage);
  }

  updatePagination(activeIndex) {
    this.setState({forcePage: activeIndex});
    setTimeout(()=> {
      if (this.state.forcePage === activeIndex) {
        this.setState({forcePage: undefined});
      }
    },0);
  }

  sortTimeStamp() {
    const sortOrder = this.state.sortOrder;
    if (sortOrder === 'asc') {
      this.setState({sortOrder: 'desc'}, function stateUpdateComplete() {
        this.fetchFilteredAlertsDetails();
      }.bind(this));
    } else {
      this.setState({sortOrder: 'asc'}, function stateUpdateComplete() {
        this.fetchFilteredAlertsDetails();
      }.bind(this));
    }
  }

  getFilteredAlerts(activeFilter) {
    // filtering data should reset to start i.e activeIndex=0
    this.setState({activeIndex: 0}, function stateUpdateComplete() {
      this.props.dispatch(setActiveFilters(activeFilter));
      setTimeout(() =>{
        this.fetchFilteredAlertsDetails();
      }, 0);
    }.bind(this));
  }

  render() {
    let alertsData = {};
    let isDataAvailable = false;
    const { alertsCollection } = this.props;
    if (alertsCollection && alertsCollection.data.hits !=0) {
      isDataAvailable = true;
      alertsData = alertsCollection.data.hits;
    }
    return (
      <div className={`alert-table-view ${this.props.isSideNavCollapsed ? 'collapse-side-nav' : 'expand-side-nav'}`}>
        <div className="alert-table-container">
          <div className="table-view-header">
            <div className="header-text">Alerts Table</div>
            <div className="react-paginate">
              {isDataAvailable && <ReactPaginate
                previousLabel={'<<'}
                nextLabel={'>>'}
                pageCount={this.state.totalPages}
                marginPagesDisplayed={2}
                pageRangeDisplayed={2}
                containerClassName={'pagination'}
                subContainerClassName={'pages pagination'}
                activeClassName={'active'}
                onPageChange={this.handlePageChange}
                forcePage={this.state.forcePage} />}
            </div>
          </div>
          <div className="table-view-body">
            <TableView
              data={alertsData} sortOrder={ this.state.sortOrder } onSortCallback={ () => this.sortTimeStamp() }
              onFilterApplyCallback={ (activeFilter) => this.getFilteredAlerts(activeFilter) }
              tableHeader={ getAlertsTableHeader() }
              type= 'alert'
              onMaskAlertallback={ (alertsCollection) => this.maskAlert(alertsCollection) }
              onNotifyAlertCallback={ (alertsCollection) => this.notifyAlert(alertsCollection) }
              forcePage={ this.state.forcePage } />
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    alertsCollection: state.get('alertsCollection'),
    activeFilter: state.get('activeFilter'),
    isSideNavCollapsed: state.get('isSideNavCollapsed'),
    searchQuery: state.get('globalSearchQuery'),
    days: state.get('alertPanelHistoryBound'),
    refreshInterval: state.get('refreshInterval')
  };
}

export default connect(
  mapStateToProps
)(AlertTableView);