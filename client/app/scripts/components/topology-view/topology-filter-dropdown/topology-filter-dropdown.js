/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

import {removeUnderscore} from "../../../utils/string-utils";

class TopologyFilterDropDown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listVisible: false,
      selected: this.props.selected
    };
    this.toggleDropDown = this.toggleDropDown.bind(this);
    this.hideDropDownOptions = this.hideDropDownOptions.bind(this);
    this.selectOption = this.selectOption.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
  }

  componentWillMount() {
    this.props.onFilterTopologyCallback({name: 'all_containers'});
  }

  componentWillReceiveProps(newProps) {}

  selectOption(item) {
    this.setState({selected: item, listVisible: false}, function stateUpdateComplete() {
      this.props.onFilterTopologyCallback(this.state.selected);
    }.bind(this));
  }

  toggleDropDown() {
    if (this.state.listVisible){
      this.setState({listVisible: false});
      document.removeEventListener('click', this.handleOutsideClick);
    }
    else {
      this.setState({listVisible: true});
      document.addEventListener('click', this.handleOutsideClick);
    }
  }

  hideDropDownOptions() {
    this.setState({listVisible: false});
    document.removeEventListener('click', this.handleOutsideClick);
  }

  handleOutsideClick(e) {
    if (this.node.contains(e.target)) {
      return;
    }
    this.toggleDropDown();
  }

  renderListItems() {
    const items = [];
    for (let i = 0; i < this.props.list.length; i += 1) {
      const item = this.props.list[i];
      items.push(
        <div className={'dropdown-option ' + ((this.state.selected && (item.name == this.state.selected.name)) ? 'active-option':'')} onClick={this.selectOption.bind(null, item)} key={i}>
          <span className="alert-duration-text">{removeUnderscore(item.name)}</span>
        </div>
      );
    }
    return items;
  }

  render() {
    return (
      <div className="container-filter-wrapper" style={{display: 'flex', marginRight: '8px'}}>
        <div className={'all-containers-tab ' + ((this.state.selected && (this.state.selected.name == 'all_containers')) ? 'active-option':'')}
             onClick={this.selectOption.bind(null, {name: 'all_containers'})}>All</div>
        {(this.props.list.length > 0) && <div className={"dropdown-container" + (this.state.listVisible ? " show" : "")} ref={node => { this.node = node; }}
             onMouseLeave={this.hideDropDownOptions}>
          <div className={"dropdown-display" + (this.state.listVisible ? " clicked": "")}
               onMouseEnter={this.toggleDropDown}>
            <div className="selected-option">
              <div className="option-text">
                <span className="alert-duration-text">Tainted</span>
              </div>
              <i className="fa fa-caret-down"></i>
            </div>
          </div>
          <div className="dropdown-list">
            <div className="dropdown-option-wrapper">{this.renderListItems()}</div>
          </div>
        </div>}
      </div>
    );
  }

}

function mapStateToProps(state) {
  return {
    currentTopologyId: state.get('currentTopologyId')
  };
}

export default connect(
  mapStateToProps
)(TopologyFilterDropDown);