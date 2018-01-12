/*eslint-disable*/
// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports

class LicenseExpiredModalView extends React.Component {

  constructor() {
    super();
  }

  render() {
    const { licenseResponse } = this.props;
    return (
      <div className="license-expiry-modal-wrapper">
        <div className="license-expiry-modal">
          <div className='modal-container'>
            <div className="modal-header">
              <div className="modal-heading">
                <span className="fa fa-exclamation-triangle" aria-hidden="true" style={{color: '#e7d036'}}></span>&nbsp;&nbsp;
                <span>&nbsp;&nbsp;License Expired</span>
              </div>
            </div>
            <div className="modal-body">
              <div className='license-expiry-msg'>
                {licenseResponse.message}
              </div>
              <div className='license-expiry-description'>
                {licenseResponse.description}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    licenseResponse: state.get('licenseResponse')
  };
}

export default connect(
  mapStateToProps
)(LicenseExpiredModalView);