var viz, sheet, table, marksQueue, cohortKey, username,userName = "",parameters, filter = [],filterSel = [];
//initislize the tableau report by parsing the url provided along with the cohort key and username
var currentLocation = window.location;
var  optionsTable = {
                    maxRows: 10, // Max rows to return. Use 0 to return all rows
                    ignoreAliases: false,
                    ignoreSelection: true,
                    includeAllColumns: false
                };

function initViz() {
        // cohortKey = getParameterByName("cohort_key", currentLocation);
        // var containerDiv = document.getElementById("vizContainer"),
        //        // url="https://us-east-1.online.tableau.com/t/takrd/views/DEN301_Patient_Profiling_Aggregate_Labs_SIT/AggregateLabAnalysis?:embed=y&:showVizHome=n&:toolbar=top&%3AopenAuthoringInTopWindow=true&%3AbrowserBackButtonUndo=true&%3AcommentingEnabled=true&%3AreloadOnCustomViewSave=true&%3AshowAppBanner=false&%3AisVizPortal=true&iframeSizedToWindow=true&:apiID=host0#2&navType=1&navSrc=Opt",
        //         options = {
        //                 hideTabs: false,
        //                 hideToolbar: false,
        //                 onFirstInteractive: function () {
        //                         document.getElementById('getData').disabled = false; // Enable our button
        //                 }
        //         };
        // viz = new tableau.Viz(containerDiv, url, options);
        // viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, onFilterSelection);
        // viz.addEventListener(tableau.TableauEventName.TAB_SWITCH, onTabSwitch);
        // listenToMarksSelection();
        //$(".txt-save-cohort").hide();
    getBearerToken("abc");
}

//function to capture parameters

var getParameters = function(){
	
	
	
}

//function get query params from url
//fetches the cohortkey from the url.
var getParameterByName = function (name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
}
//Kick start the capturing of the user selections and show the JSON.
function getUnderlyingData() {
        var htmlContent = "";
        var arrSubjectId = [];
        var sheets = viz.getWorkbook().getActiveSheet();
        var sheettype = sheets.getSheetType();
        var sheetCollection = sheets.getWorksheets();
        var subjectid = [];
        var filters = {};
		var parameters ={};
        var userName;
        switch (sheettype) {
        case 'dashboard':
                var subjectData = sheets.getWorksheets()[0].getFiltersAsync().then(function (f) {
					    
                        // Use the filter objects to get the filter details.
						localStorage.setItem("dashboardName",sheets._impl.$dashboard._impl.$name);
                        filters = filterSelections(f);
		
                       // console.log(filters);
                });
				
				var parameterData = viz.getWorkbook().getParametersAsync().then(function(p){
					parameters = parameterSelections(p);
					console.log(parameters);
					
				});
		
                //after you fetch the subject data create the JSON, add the JSON to the JSON Viewer.
                $.when(subjectData,parameterData).done(function () {
                        var dataJSON = createJSON(filters,parameters);
                        showandConfirmJSON(dataJSON);
                });
                break;
        case 'default':
                break;
        }
}


//confirm the user wants to proceed
var showandConfirmJSON = function (data) {
        $('#json-renderer').jsonViewer(JSON.parse(data), {
                collapsed: true,
                withQuotes: true
        });
        $("#jsnvwrrmodal").modal({
                backdrop: "static"
        });
        $("#submitJSON").off('click').on("click", function () {
               /*  if ($("#txt-save-cohort").val()) {
                        $(".error").removeClass("show-error");
                        $(".error").addClass("hide-error");
                } else {
                        $(".error").removeClass("hide-error");
                        $(".error").addClass("show-error");
                        $('#jsnvwrrmodal').on('hidden.bs.modal', function () {
                                return false;
                        });
                } */
                var newData = JSON.parse(data);
                //newData.cohortDefinition.cohortName = $("#txt-save-cohort").val();
                getBearerToken(JSON.stringify(newData));
        });
}
//listen to the filter change event
function listenToFiltersSelection() {
        viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, onFilterSelection);
}
//on filter change capture the selected filters.
function onFilterSelection(FilterEvent) {
        //console.log(FilterEvent);
        return FilterEvent.getFilterAsync().then(reportSelectedFilters);
}
//get the selected filters
function reportSelectedFilters(_filters) {
        var useRfilterSelection = {};
		
		filterSel.push(_filters.$caption);
		localStorage.setItem("filterName",filterSel);
        var _filtermarkings = [];
        for (var filterIndex = 0; filterIndex < _filters.$appliedValues.length; filterIndex++) {
                //var pairs = _filters[filterIndex].getPairs();
                _filtermarkings.push(_filters.$appliedValues[filterIndex].formattedValue);
        }
        useRfilterSelection = {
                "name": _filters.$caption,
                "value": _filtermarkings
        };
        filter.push(useRfilterSelection);
        useRfilterSelection = {};
        //FilterQueue = _filtermarkings;
        return filter;
}

function listenToMarksSelection() {
        viz.addEventListener(tableau.TableauEventName.MARKS_SELECTION, onMarksSelection);
}

function onMarksSelection(marksEvent) {
        return marksEvent.getMarksAsync().then(reportSelectedMarks);
}
//return marksCollction;
function reportSelectedMarks(marks) {
        console.log(marks);
        var markings = [];
        if (marks.length > 0) {
                for (var markIndex = 0; markIndex < marks.length; markIndex++) {
                        var pairs = marks[markIndex].getPairs();
                        markings.push(pairs);
                }
                //html.push("</ul>");
                marksQueue = markings;
                return marksQueue;
        }
}
//On tabs change show hide the save button.
function onTabSwitch(TabsChangeEvent) {
        if (TabsChangeEvent.getNewSheetName() != "Landing Page") {
                setTimeout(function () {
                        $("#btnDiv").removeClass("novisibility").addClass("visibile")
                }, 1000);
        } else {
                $("#btnDiv").removeClass("visibile").addClass("novisibility")
        }
}
//get the filter Selections to prepare JSON
var filterSelections = function (filterdata) {
        var filterSelected = {};
        var selections = [];
		if(localStorage.filterName){		
			var filterNames =  [...new Set(localStorage.filterName.split(','))];
			for(var k =0;k<filterNames.length;k++){		
				for (var filter in filterdata) {
					if(filterdata[filter].$caption == 'User')
						localStorage.setItem("User",filterdata[filter].$appliedValues[0].formattedValue);
					if(filterNames[k] == filterdata[filter].$caption && filterdata[filter].$caption !="User"){
						filterSelected.filterSelection = {};
								filterSelected.filterSelection.filterName = filterdata[filter].$caption;
								filterSelected.filterSelection.appliedValues = [];
								for (var value in filterdata[filter].$appliedValues) {
										filterSelected.filterSelection.appliedValues.push(filterdata[filter].$appliedValues[value].formattedValue);
								}
								selections.push(filterSelected.filterSelection);
					}
				}
			}
			return selections;
		}
		else
		{		
				for(var filter in filterdata) {
						filterSelected.filterSelection = {};
						if(filterdata[filter].$caption == 'User')
							localStorage.setItem("User",filterdata[filter].$appliedValues[0].formattedValue);
								if(filterdata[filter].$caption !="User"){
								filterSelected.filterSelection.filterName = filterdata[filter].$caption;
								filterSelected.filterSelection.appliedValues = [];
								for (var value in filterdata[filter].$appliedValues) {
										filterSelected.filterSelection.appliedValues.push(filterdata[filter].$appliedValues[value].formattedValue);
								}
								selections.push(filterSelected.filterSelection);
					}	
				}					
			return selections;		
		}
}

var parameterSelections = function(_parameter){
	var parameterSelected = {};
	var selections = [];
	for(param=0;param <_parameter.length;param++){
		parameterSelected["name"]=_parameter[param]._impl.$name;
		parameterSelected["value"] = _parameter[param]._impl.$currentValue.formattedValue;
		selections.push(parameterSelected);
		parameterSelected = {};
	}
	return selections;
}

//   get particular attributes from the filter selection.
var getAttributes = function (filterdata, args) {
        var attributes = [];
        for (var filter in filterdata) {
                if (filterdata[filter].filterName == args) attributes = filterdata[filter].appliedValues;
                //  subjctidlist.push(filterdata[filter].$appliedValues[value].formattedValue);
        }
        return attributes;
}
//get username;
var getUserDetails = function (tabledata) {
        var uidindex = 0,
                username;
        for (var column in tabledata.$impl.$columns) {
                if (tabledata.$impl.$columns[column].$impl.$fieldName == "Userid") {
                        uidindex = tabledata.$impl.$columns[column].$impl.$index;
                        username = tabledata.$impl.$rows[0][uidindex].formattedValue;
                }
        }
        return username;
}



var getBearerToken = function(data){
var form = new FormData();
form.append("username", "avshenoy@takeda.com.datahubdev");
form.append("password", "Ashok1234567GG0lNwKDNZKW35vI99x2ZM4l7");
form.append("client_id", "3MVG9Vik22TUgUpi62A3UUHwDz_wyanZjUXoDrkS06x34NQBeSocZcEWp8GyM7F25uWXHUVHPscY4Aiz72AJo");
form.append("client_secret", "2484990408495721604");
form.append("grant_type", "password");
  //  sendSelectionsToSalesForce(data,"00D29000000De96!ARUAQExmvoXNbOx1M_CT5KgOF.ZyvXn4mwc4YLhpjz1RaVNzNJddlA15zd51gN4hObxq3SSXi10onppYEK3tPp2kjCmpe59y")
var options = {
  "async": true,
  "crossDomain": false,
  "url": "https://test.salesforce.com/services/oauth2/token",
  "method": "POST",
  "headers": {
    "cache-control": "no-cache"
  },
  "processData": false,
  "contentType": false,
  "mimeType": "multipart/form-data",
  "data": form
}

$.ajax(options).done(function (response) {
	var token = JSON.parse(response).access_token;
	//console.log(response.access_token);
	sendSelectionsToSalesForce(data,"00D29000000De96!ARUAQExmvoXNbOx1M_CT5KgOF.ZyvXn4mwc4YLhpjz1RaVNzNJddlA15zd51gN4hObxq3SSXi10onppYEK3tPp2kjCmpe59y")

});
}

function sendSelectionsToSalesForce(subjectlist,token){
	var options = {
		  "async": true,
		  "crossDomain": true,
		  "url": "https://takeda-rd--datahubdev.cs19.my.salesforce.com/services/apexrest/JSON2Apex",
		  "method": "POST",
		  "headers": {
			"authorization": "Bearer "+ token,
			"content-type": "application/json",
			"cache-control": "no-cache"
		  },
		  "processData": false,
		  "data": subjectlist,
		  success: function (data) {
                                $.toast({
                                        heading: 'Success',
                                        text: 'Data sent successfully',
                                        showHideTransition: 'slide',
                                        icon: 'success',
                                        position: 'top-right'
                                });
                                //console.log(data);
                        },
                        error: function (data) {
                                $.toast({
                                        heading: 'Warning',
                                        text: 'Request not sent',
                                        showHideTransition: 'slide',
                                        icon: 'warning',
                                        position: 'top-right'
                                });
                        }
}

$.ajax(options).done(function (response) {
  console.log(response);
});
}
var createJSON = function (filters,param) {
        var dataJSON = {};
		var jsonObject={};
        dataJSON.Filter = {};
        dataJSON.Filters = [];
		dataJSON.Parameters =[];
		dataJSON.Dashboard_Name = localStorage.getItem("dashboardName");
		dataJSON.Study_protocol="";
		dataJSON.Submitter_Email=localStorage.getItem("User");
        dataJSON.Filter.globalFilters = [];
        dataJSON.Filter.actionFilters = [];
        dataJSON.Filter.globalFilters = filters;
        dataJSON.Filter.actionFilters = marksQueue;
        dataJSON.Filters.push(dataJSON.Filter);
		dataJSON.Parameters.push(param);
        delete dataJSON.Filter;
		jsonObject.jsonObj = dataJSON;
        return JSON.stringify(jsonObject);
}

var CallCancel = function () {
        $("#jsnvwrrmodal").modal('hide');
        return false;
}

function removeDuplicates(originalArray, prop) {
        var newArray = [];
        var lookupObject = {};
        for (var i in originalArray) {
                lookupObject[originalArray[i][prop]] = originalArray[i];
        }
        for (i in lookupObject) {
                newArray.push(lookupObject[i]);
        }
        return newArray;
}