/*eslint-disable*/

// React imports
import React from 'react';

class DropDownView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listVisible: false,
      selected: this.props.selected || this.props.list[0]
    };
    if(this.props.onSelectCallback)this.props.onSelectCallback(this.state.selected);
    this.toggleDropDown = this.toggleDropDown.bind(this);
    this.selectOption = this.selectOption.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
  }

  selectOption(item) {
    this.setState({selected: item, listVisible: false});
    if(this.props.onSelectCallback)this.props.onSelectCallback(item);
    document.removeEventListener('click', this.handleOutsideClick);
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

  handleOutsideClick(e) {
    if (this.refs.node && this.refs.node.contains(e.target)) {
      return;
    }
    this.toggleDropDown();
  }

  renderListItems() {
    const items = [];
    for (let i = 0; i < this.props.list.length; i += 1) {
      const item = this.props.list[i];
      items.push(
        <div className="dropdown-option" onClick={()=>this.selectOption(item)} key={i}>
          <span className="static-text" dangerouslySetInnerHTML={{__html:item.display}}></span>
        </div>
      );
    }
    return items;
  }

  render() {
    return (
      <div className={"dropdown-container" + (this.state.listVisible ? " show" : "")} ref="node">
         <div className={"dropdown-display" + (this.state.listVisible ? " clicked": "")} onClick={this.toggleDropDown}>
          <div className="selected-option">
            <div className="option-text">
              <span className="static-text" dangerouslySetInnerHTML={{__html:this.state.selected.display}}></span>
            </div>
            <i className="fa fa-angle-down"></i>
          </div>
        </div>
        <div className="dropdown-list">
          <div className="dropdown-option-wrapper">{this.renderListItems()}</div>
        </div>
      </div>
    );
  }

}

export default DropDownView;
