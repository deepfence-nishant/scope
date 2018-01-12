/*eslint-disable*/
// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports
import Tabs from './tabs-view';

import { closeJsonTableViewModal } from '../../../actions/app-actions';

class TableJSONViewModal extends React.Component {

  constructor() {
    super();
    this.onClickClose = this.onClickClose.bind(this);
  }

  onClickClose() {
    this.props.closeJsonTableViewModal();
  }

  getDate(dateObj) {
    let date = new Date(dateObj).toString();
    return date;
  }

  render() {
    const { data } = this.props;
    return (
      <div className="table-json-view-modal-wrapper">
        <div className="table-json-view-modal">
          <div className={`modal-container ${this.props.isSideNavCollapsed ? 'collapse-fixed-panel' : 'expand-fixed-panel'}`}>
            <div className="modal-header">
              <div className="modal-heading"> {this.getDate(data._source['@timestamp'])}</div>
              <div className="close-btn" onClick={this.onClickClose}>
                <i className="fa fa-times" aria-hidden="true" />
              </div>
            </div>
            <div className="modal-body tabs-wrapper">
              <Tabs data={data} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
function mapStateToProps(state) {
  return {
    data: state.get('tableJSONViewData'),
    isSideNavCollapsed: state.get('isSideNavCollapsed')
  };
}

export default connect(
  mapStateToProps, {
    closeJsonTableViewModal
  }
)(TableJSONViewModal);