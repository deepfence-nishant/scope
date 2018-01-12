/*eslint-disable*/
// React imports
import React from 'react';
import { connect } from 'react-redux';

import Parser from 'lucene-queryparser';

import {setSearchBarValue, setSearchQuery, toggleFiltersView} from '../../../actions/app-actions';

class SearchBox extends React.Component {
  constructor(props){
    super(props);
    this.state={
      searchQuery: this.props.searchQuery || [],

      // For search box value
      searchBarValue: this.props.searchBarValue || ""
    }
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  componentWillUnmount() {
    this.props.onRef(undefined)
  }

  clearSearchBox(filterToBeDeleted) {
    const searchBosValue = this.state.searchBarValue;
    if (filterToBeDeleted === searchBosValue) {
      this.setState({searchBarValue: ""});
    }
  }

  keyPressHandler(e){
    e.stopPropagation();
    this.setState({
      error:false
    });
    if(e.charCode == 13 || e.keyCode == 13){
      try{
        let results = Parser.parse(e.target.value);

        var searchBoxValue = e.target.value;
        this.setState({searchQuery: []}, function stateUpdateComplete() {
          if (searchBoxValue) {

            // Setting search bar value
            this.props.dispatch(setSearchBarValue({searchQuery: searchBoxValue}));

            this.updateSearchQuery(`(${searchBoxValue})`);
          }
        }.bind(this));

      }
      catch(err){
        this.setState({error:true});
      }
    }
  }

  updateSearchQuery(filter) {
    this.setState({searchQuery :[...this.state.searchQuery, filter]}, function stateUpdateComplete() {
      this.props.dispatch(setSearchQuery({searchQuery: this.state.searchQuery}));

      // Filters view
      this.props.dispatch(toggleFiltersView());
    }.bind(this))
  }

  changeHandler(e){
    this.setState({
      searchBarValue : e.target.value
    });
  }

  render() {
    let error='';
    if(this.state.error){
      error = <div className="search-query-error">
        Invalid search query
      </div>
    }
    return (
        <div className="search-container">
          <input className="search-input" placeholder="Search (Lucene syntax queries only)"
                 onKeyPress={(e) => this.keyPressHandler(e)} onChange={(e) => this.changeHandler(e)}
                 value={this.state.searchBarValue}/>
          {error}
        </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    searchQuery: state.get('globalSearchQuery'),
    searchBarValue: state.get('searchBarValue')
  };
}

export default connect(
  mapStateToProps
)(SearchBox);
