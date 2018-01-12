/*eslint-disable*/

// React imports
import React from 'react';

class MultiDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listVisible: false,
      list: this.props.list,
      activeTab:null
    };
  }

  componentWillReceiveProps(newProps) {
    this.setState({list: newProps.list});
  }

  componentDidMount() {
    this.setState({list: this.props.list})
  }

  showTab(label) {
    if(!this.state.listVisible){
      document.addEventListener('click', this.handleOutsideClick.bind(this));
    }
    this.setState({
        listVisible: true,
        activeTab: label
    })
  }

  hideTabDetail() {
    this.setState({
        listVisible: false,
        activeTab: null
    })
  }

  handleOutsideClick(e) {
    if (this.refs.node && this.refs.node.contains(e.target)) {
      return;
    }
    this.hideTabDetail();
    document.removeEventListener('click', this.handleOutsideClick);
  }

  renderTriggers() {
    const items = [];
    for (let i = 0; i < this.state.list.length; i += 1) {
      const item = this.state.list[i];
      const activeClass = item.type == this.state.activeTab? 'multi-dropdown-trigger-active' :'';
      items.push(   
        <div className={"multi-dropdown-trigger "+ activeClass} key={item.type} onClick={()=>this.showTab(item.type)}>
            <span>{item.prefix}</span>
            <span style={{color: '#0276c9'}}>{item.selected.display}</span>
        </div> 
      );
    }
    return items;
  }

  renderDropdowns() {
    const items = [];    
    for (let i = 0; i < this.state.list.length; i += 1) {
        const item = this.state.list[i];
        let options = [];
        for (let j = 0; j < item.options.length; j += 1) {
          const activeClass = item.options[j].display == item.selected.display? 'multi-dropdown-option-selected' :'';      
            options.push(   
              <div key={j}>
                <span className={"multi-dropdown-option " + activeClass} onClick={() => {item.onSelectCallback(item.options[j]); this.hideTabDetail()}}>{item.options[j].display}</span>
              </div>
            );
        }
        const activeClass = item.type == this.state.activeTab? 'visible' :'';      
        items.push(   
          <div className={"multi-dropdown-list " + activeClass} key={item.type}>
            <h6 className={"multi-dropdown-heading"}>{item.title}</h6>
            <div className={"multi-dropdown-column"}>
                {options}
            </div>
          </div> 
        );
      }
    return items;    
  }

  

  render() {
    const activeClass = this.state.listVisible ? 'visible' :'';
    
    return (
      <div className="multi-dropdown-container" ref="node">
        <div className="multi-dropdown-trigger-wrapper">
          {this.renderTriggers()}
        </div>
        <div className={"multi-dropdown-list-wrapper " + activeClass}>
          {this.renderDropdowns()}
        </div>
      </div>
    );
  }

}

export default MultiDropdown;
