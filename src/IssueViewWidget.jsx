/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the 'License'); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

import React, { Component } from "react";
import ReactTable from "react-table";
import { MuiThemeProvider } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "react-select";
import Typography from "@material-ui/core/Typography";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";
import axios from "axios";
import "./components/css/react-table.css";

let suggestions = [
  { label: "Severity/Blocker" },
  { label: "Severity/Critical" },
  { label: "Severity/Major" },
  { label: "Severity/Minor" },
  { label: "Priority/High" },
  { label: "Priority/Highest" },
  { label: "Priority/Low" },
  { label: "Priority/Normal" },
  { label: "Resolution/Cannot Reproduce" },
  { label: "Resolution/Duplicate" },
  { label: "Resolution/Fixed" },
  { label: "Resolution/Invalid" },
  { label: "Resolution/Not a bug" },
  { label: "Resolution/Postponed" },
  { label: "Resolution/Won't Fix" },
  { label: "Type/Bug" },
  { label: "Type/Documentation" },
  { label: "Type/Epic" },
  { label: "Type/Improvement" },
  { label: "Type/New Feature" },
  { label: "Type/Question" },
  { label: "Type/Task" },
  { label: "Type/UX" }
].map(suggestion => ({
  value: suggestion.label,
  label: suggestion.label
}));

let productSuggestions = [].map(productSuggestions => ({
  value: productSuggestions.label,
  label: productSuggestions.label
}));

let repoSuggestions = [].map(repoSuggestions => ({
  value: repoSuggestions.label,
  label: repoSuggestions.label
}));

function NoOptionsMessage(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.noOptionsMessage}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

function Option(props) {
  return (
    <MenuItem
      buttonRef={props.innerRef}
      selected={props.isFocused}
      component="div"
      style={{
        fontWeight: props.isSelected ? 500 : 400
      }}
      {...props.innerProps}
    >
      {props.children}
    </MenuItem>
  );
}

const components = {
  Option,
  NoOptionsMessage
};

class IssueViewWidget extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: props.id,
      repo_name: null,
      labels: null,
      product: null,
      data: [],
      productSuggestionsArray: [],
      repoSuggestionsArray: [],
      myCustomPreviousText: "<<Previous",
      myCustomNextText: "Next>>",
      loading: false
    };

    this.tableColumns = [
      {
        Header: "Git Repo Name",
        accessor: "repositoryName",
        Cell: this.getNormalCellComponent,
        Filter: props => {
          return (
            <input
              style={{
                width: "70%",
                backgroundColor: "#dce2e4",
                color: "rgb(13, 90, 118)"
              }}
              placeholder="Search for Repo Name.."
              onChange={event => {
                this.setState({
                  repoFilterValue: event.target.value
                });
                props.onChange(event.target.value);
              }}
              value={this.state.repoFilterValue || ""}
            />
          );
        },
        filterMethod: (filter, row) => {
          const id = filter.pivotId || filter.id;
          var record = row[id];
          if (record instanceof Array) {
            var status = false;
            record.forEach(rec => {
              if (
                String(rec.props.children)
                  .toLowerCase()
                  .includes(filter.value)
              ) {
                status = true;
              }
            });
            return status;
          }
          return row[id]
            ? String(row[id])
                .toLowerCase()
                .includes(filter.value)
            : true;
        },
        style: {
          whiteSpace: "unset",
          paddingLeft: "15px",
          flex: "20 0 auto !important"
        }
      },
      {
        Header: "Issues title",
        id: "issueTitleWitheURL",
        accessor: d => d.issueTitleWitheURL,
        Cell: this.getNormalCellComponent,
        Filter: props => {
          return (
            <input
              style={{
                width: "70%",
                backgroundColor: "#dce2e4",
                color: "rgb(13, 90, 118)"
              }}
              placeholder="Search for Issue Title.. "
              onChange={event => {
                this.setState({
                  issueFilterValue: event.target.value
                });
                props.onChange(event.target.value);
              }}
              value={this.state.issueFilterValue || ""}
            />
          );
        },
        filterMethod: (filter, row) => {
          const id = filter.pivotId || filter.id;
          var record = row[id];
          if (record instanceof Array) {
            var status = false;

            record.forEach(rec => {
              if (rec.props.children.props !== undefined) {
                if (
                  String(rec.props.children.props.children)
                    .toLowerCase()
                    .includes(filter.value.toLowerCase())
                ) {
                  status = true;
                }
              }
            });
            return status;
          }

          return row[id]
            ? String(row[id])
                .toLowerCase()
                .includes(filter.value)
            : true;
        },
        style: {
          whiteSpace: "unset",
          paddingLeft: "15px",
          flex: "100 0 50 !important"
        }
      }
    ];
    this.handleChange = this.handleChange.bind(this);
    this.handleRepositoryChange = this.handleRepositoryChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleProductChange = this.handleProductChange.bind(this);
  }

  handleChange(value) {
    this.setState(
      {
        labels: value
      },
      () => {
        console.log(this.state.labels);
      }
    );
  }

  handleRepositoryChange(value) {
    this.setState(
      {
        repo_name: value
      },
      () => {
        console.log(this.state.repo_name);
      }
    );
  }

  handleProductChange(value) {
    if (value != null) {
      var repos_url =
        "http://" +
        process.env.REACT_APP_HOST +
        ":" +
        process.env.REACT_APP_PORT +
        "/gitIssues/repos/" +
        value.value;
    } else {
      repos_url =
        "http://" +
        process.env.REACT_APP_HOST +
        ":" +
        process.env.REACT_APP_PORT +
        "/gitIssues/repos/all";
    }
    axios
      .create({
        withCredentials: false
      })
      .get(repos_url)
      .then(res => {
        var i = 0;
        repoSuggestions = [];
        res.data.forEach(repo => {
          var labelObject = {};
          labelObject.label = repo;
          repoSuggestions[i] = labelObject;
          i = i + 1;
        });
        this.setState({
          repoSuggestionsArray: repoSuggestions.map(repoSuggestions => ({
            value: repoSuggestions.label,
            label: repoSuggestions.label
          }))
        });
      });

    this.setState(
      {
        product: value
      },
      () => {
        console.log(this.state.product);
      }
    );
  }

  handleClick() {
    this.setState(
      {
        data: [],
        loading: true
      },
      () => {
        console.log(this.state.data);
      }
    );
    const labelArray = [];
    const repoArray = [];
    if (this.state.repo_name != null) {
      if (this.state.labels != null) {
        this.state.labels.forEach(element => {
          labelArray.push(element.value);
        });
      }
      this.state.repo_name.forEach(element => {
        repoArray.push(element.value);
      });
      axios
        .create({
          withCredentials: false
        })
        .get(
          "http://" +
            process.env.REACT_APP_HOST +
            ":" +
            process.env.REACT_APP_PORT +
            "/gitIssues/repository/label/",
          {
            params: {
              labels: JSON.stringify(labelArray),
              repos: JSON.stringify(repoArray)
            }
          }
        )
        .then(res => {
          var response = res.data;
          var tempArray = [];
          response.forEach(rec => {
            rec.issues.forEach(issue => {
              tempArray.push(issue);
            });
          });
          this.setState({
            data: tempArray,
            loading: false
          });
        });
    } else if (this.state.product != null && this.state.repo_name == null) {
      if (this.state.labels != null) {
        this.state.labels.forEach(element => {
          labelArray.push(element.value);
        });
      }

      axios
        .create({ withCredentials: false })
        .get(
          "http://" +
            process.env.REACT_APP_HOST +
            ":" +
            process.env.REACT_APP_PORT +
            "/gitIssues/product/" +
            this.state.product.value,
          {
            params: {
              labels: JSON.stringify(labelArray)
            }
          }
        )
        .then(res => {
          console.log(res.data);
          var response = res.data;
          var tempArray = [];
          response.forEach(rec => {
            console.log(rec);
            if (rec.issues.length > 0) {
              rec.issues.forEach(issue => {
                tempArray.push(issue);
              });
            }
          });
          this.setState({
            data: tempArray,
            loading: false
          });
        });
    }
  }

  componentDidMount() {
    if (productSuggestions.length === 0) {
      var urll =
        "http://" +
        process.env.REACT_APP_HOST +
        ":" +
        process.env.REACT_APP_PORT +
        "/gitIssues/products";
    } else if (this.state.product == null) {
      urll =
        "http://" +
        process.env.REACT_APP_HOST +
        ":" +
        process.env.REACT_APP_PORT +
        "/gitIssues/repos/all";
    }
    axios
      .create({
        withCredentials: false
      })
      .get(urll)
      .then(res => {
        var i = 0;
        productSuggestions = [];
        res.data.forEach(repo => {
          var labelObject = {};
          labelObject.label = repo;
          productSuggestions[i] = labelObject;
          i = i + 1;
        });
        this.setState({
          productSuggestionsArray: productSuggestions.map(
            productSuggestions => ({
              value: productSuggestions.label,
              label: productSuggestions.label
            })
          )
        });
      });
  }

  //select a product in a drop down menu
  renderProductSearchDropDown(components) {
    return (
      <div
        style={{
          width: "25%",
          paddingRight: "30px",
          paddingLeft: "50px",
          paddingTop: "14px",
          paddingBottom: "8px"
        }}
      >
        <div
          style={{
            fontFamily: "sans-seri",
            color: "rgb(176, 203, 224)",
            fontSize: "18px",
            paddingRight: "270px"
          }}
        >
          {" "}
          Product Name{" "}
        </div>

        <Select
          textFieldProps={{
            label: "Product Name",
            InputLabelProps: {
              shrink: true
            }
          }}
          options={this.state.productSuggestionsArray}
          components={components}
          value={this.state.product}
          onChange={this.handleProductChange}
          placeholder="Search for a Product"
          isClearable
        />
      </div>
    );
  }
  //select multiple repos in a drop down menu for a particular product
  renderRepoMultiSelect(components) {
    return (
      <div
        style={{
          width: "25%",
          paddingRight: "30px",
          paddingLeft: "10px",
          paddingTop: "14px",
          paddingBottom: "8px"
        }}
      >
        <div
          style={{
            fontFamily: "sans-seri",
            color: "rgb(176, 203, 224)",
            fontSize: "18px",
            paddingRight: "270px"
          }}
        >
          {" "}
          Repo Name{" "}
        </div>
        <Select
          textFieldProps={{
            label: "Repo Name",
            InputLabelProps: {
              shrink: true
            }
          }}
          options={this.state.repoSuggestionsArray}
          components={components}
          value={this.state.repo_name}
          onChange={this.handleRepositoryChange}
          placeholder="Select Multiple Repositories"
          isMulti
        />
      </div>
    );
  }
  // select multiple suggestion from drop down menu
  renderLabelMultiSelect(suggestions, components) {
    return (
      <div
        style={{
          width: "25%",
          paddingRight: "50px",
          paddingLeft: "10px",
          paddingTop: "14px",
          paddingBottom: "8px"
        }}
      >
        <div
          style={{
            fontFamily: "sans-seri",
            color: "rgb(176, 203, 224)",
            fontSize: "18px",
            paddingRight: "270px"
          }}
        >
          {" "}
          Product Name{" "}
        </div>
        <Select
          textFieldProps={{
            label: "Label",
            InputLabelProps: {
              shrink: true
            }
          }}
          options={suggestions}
          components={components}
          value={this.state.labels}
          onChange={this.handleChange}
          placeholder="Select multiple labels"
          isMulti
        />
      </div>
    );
  }

  renderTable() {
    return (
      <div>
        <div
          style={{
            width: "100%",
            textAlign: "left",
            backgroundColor: "rgb(13, 77, 126)",
            color: "rgb(161, 194, 212)",
            fontSize: "21px",
            fontFamily: "sans-seri"
          }}
        >
          {this.state.loading ? "Loading data......." : " "}
        </div>
        <ReactTable
          previousText={this.state.myCustomPreviousText}
          nextText={this.state.myCustomNextText}
          className={"darkTheme"}
          data={this.state.data}
          columns={this.tableColumns}
          style={{ width: "100%" }}
          filterable
        />
      </div>
    );
  }

  render() {
    let { data } = this.state;

    data.forEach(d => {
      d.labels = [];
      d.issueTitleWitheURL = [];
      let content = [];
      content.push(
        <span class="td3">
          <a
            href={d.url}
            rel="noopener noreferrer"
            target="_blank"
            style={{ flex: "100 100 100", flexDirection: "coloumn" }}
          >
            {d.issueTitle}
          </a>
        </span>
      );

      d.issueLabels.forEach(l => {
        if (l.startsWith("Severity")) {
          content.push(
            <span class="td2">
              <span id="issue-severity">{l}</span>
            </span>
          );
        } else if (l.startsWith("Type")) {
          content.push(
            <span class="td2">
              <span id="issue-type">{l}</span>
            </span>
          );
        } else if (l.startsWith("Resolution")) {
          content.push(
            <span class="td2">
              <span id="issue-resolution">{l}</span>
            </span>
          );
        } else if (l.startsWith("Priority")) {
          content.push(
            <span class="td2">
              <span id="issue-priority">{l}</span>
            </span>
          );
        } else {
          content.push(
            <span class="td2">
              <span id="issue-other">{l}</span>
            </span>
          );
        }
      });

      d.issueTitleWitheURL = content;
    });

    return (
      <MuiThemeProvider>
        <div style={{ margin: "1% 2% 0 2%" }}>
          <div
            style={{
              flexWrap: "wrap",
              display: "flex",
              marginBottom: "0px",
              backgroundColor: "rgb(8, 80, 122)"
            }}
          >
            {this.renderProductSearchDropDown(components)}
            {this.renderRepoMultiSelect(components)}
            {this.renderLabelMultiSelect(suggestions, components)}
            <div style={{ paddingTop: "35px", paddingRight: "10px" }}>
              <Button
                variant="contained"
                color="rgb(150, 195, 212)"
                onClick={this.handleClick}
              >
                Search
              </Button>
            </div>
          </div>
          <div style={{ clear: "both" }}>{this.renderTable()}</div>
        </div>
      </MuiThemeProvider>
    );
  }
}

IssueViewWidget.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired
};

export default IssueViewWidget;
