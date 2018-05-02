var viz, sheet, table, marksQueue, cohortKey, username, userName = "",

        filter = [];
		var markings = [];
//initislize the tableau report by parsing the url provided along with the cohort key and username
var currentLocation = window.location;

function initViz() {
//        cohortKey = getParameterByName("cohort_key", currentLocation);
        var containerDiv = document.getElementById("vizContainer"),               
                //url="http://z9awssdikutab01.celgene.com/#/views/Test4/Dashboard1?:size=1440,736&:embed=y&:showVizHome=n&:bootstrapWhenNotified=y&:toolbar=top&%3AopenAuthoringInTopWindow=true&%3AbrowserBackButtonUndo=true&%3AreloadOnCustomViewSave=true&%3AshowShareOptions=true&%3Asize=1440%2C736&:apiID=handler0#5",
                url="http://z9awssdikutab01.celgene.com/views/Test4/Dashboard1?:size=1870,470&:embed=y&:showVizHome=n&:bootstrapWhenNotified=y&:toolbar=top&%3AopenAuthoringInTopWindow=true&%3AbrowserBackButtonUndo=true&%3AcommentingEnabled=true&%3AreloadOnCustomViewSave=true&%3AshowAppBanner=false&%3AshowShareOptions=true&%3Asize=1280%2C470&:apiID=host0",
				options = {
                        hideTabs: false,
                        hideToolbar: false,
                        onFirstInteractive: function () {
                                document.getElementById('getData').disabled = false; // Enable our button
                        }
                };
        viz = new tableau.Viz(containerDiv, url, options);
        //viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, onFilterSelection);
        //viz.addEventListener(tableau.TableauEventName.TAB_SWITCH, onTabSwitch);
        //listenToMarksSelection();
        $(".txt-save-cohort").hide();
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
        var userName;
        switch (sheettype) {
        case 'dashboard':
                var subjectData = sheets.getWorksheets()[0].getFiltersAsync().then(function (f) {
                        // Use the filter objects to get the filter details.
                        modelValue = getModelValue(f);
                        //filters = filterSelections(f);
                        console.log(modelValue);
                });
				var socialMediaSpend = viz.getWorkbook().getParametersAsync().then(function(p){
					socialMediaSpend = getSocialMediaSpend(p);
				});
                //after you fetch the subject data create the JSON, add the JSON to the JSON Viewer.
                $.when(subjectData,socialMediaSpend).done(function () {
                        var dataJSON = createJSON(modelValue,socialMediaSpend);
                        showandConfirmJSON(dataJSON);
                });
                break;
        case 'default':
                break;
        }
}
//confirm the user wants to proceed
var showandConfirmJSON = function (data) {
	$('#CVForm').validator();
$('#json-renderer').jsonViewer(JSON.parse(data), {
collapsed: true,
withQuotes: true
});
$("#jsnvwrrmodal").modal({
backdrop: "static"
});

$("#submitJSON").off('click').on("click", function() {
/* if ($("#txt-save-cohort").val() != "") { */
var newData = JSON.parse(data);
debugger;
sendSubjectIds(JSON.stringify(newData));
/* } else {

return false;
} */
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
        for (var filter in filterdata) {
                filterSelected.filterSelection = {};
                if (filterdata[filter].$caption != "subject_id") {
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
//get the subject ids;
var getModelValue = function (filterdata) {
        var subjctidlist = [];
        var subjectIdMap = {};
        for (var filter in filterdata) {
                if (filterdata[filter].$type == "categorical" && filterdata[filter].$caption == "Model")
                        for (var value in filterdata[filter].$appliedValues) {
                                subjectIdMap["Model"] = filterdata[filter].$appliedValues[value].formattedValue;
                               
                                subjctidlist.push(subjectIdMap);
                                subjectIdMap = {};
                        }
        }
        return subjctidlist;
}
var getSocialMediaSpend = function(parameterList){
	paramValue =[];
	for(var i=0;i<parameterList.length;i++)
	{
		paramValue.push(parameterList[i]._impl.$currentValue.value);
	}
	console.log(paramValue);
	return paramValue;	
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
var sendSubjectIds = function (subjectlist) {
        try {
                $.ajax({
                        type: "POST",
                        //url: "http://10.119.2.102:8080/cohortintegrator/ci-api/v1/cohort-manager/save",
                        //url: "http://10.119.1.49:8080/cohortintegrator/ci-api/v1/cohort-manager/save",
						url: "http://localhost:3000/update_sales",
                        data: subjectlist,
                        contentType: "application/json",
                        cache: false,
                        dataType: "json",
                        success: function (data) {
							markings = [];
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
                });
        } catch (e) {}
}
var createJSON = function (modelValue,SMS) {
        var cohortJSON = {};
        
        //cohortDefinition.
		cohortJSON["MODEL"]=modelValue[0]["Model"];
		cohortJSON["SOCIAL_MEDIA_SPEND"]=SMS[0];
        
		/*cohortJSON.isNew = true;
        //capture cohortDefinition
        cohortJSON.cohortDefinition = {};
        cohortJSON.cohortDefinition.srcCohortId = null;
        cohortJSON.cohortDefinition.cohortKey = parseInt(cohortKey) || 100;
        cohortJSON.cohortDefinition.cohortName = $("#txt-save-cohort").val();
        cohortJSON.cohortDefinition.cohortType = "SUBJECT"; //will always be subject
        cohortJSON.cohortDefinition.cohortCount = subjectid.length;
        cohortJSON.cohortFilter = {};
        cohortJSON.cohortFilters = [];
        cohortJSON.cohortFilter.globalFilters = [];
        cohortJSON.cohortFilter.actionFilters = [];
        cohortJSON.projectId = getAttributes(filters, "project_id")[0];
        cohortJSON.userName = getAttributes(filters, "User Name")[0] == "svc_dikudataload" || getAttributes(filters, "User Name")[0] == "guest" ? "vckurapati" : getAttributes(filters, "User Name")[0];
        cohortJSON.tool = "CV";
        cohortJSON.dataSourceId = getAttributes(filters, "data_source_id")[0];
        cohortJSON.cohortInclCriteria = null;
        cohortJSON.cohortExclCriteria = null;
        cohortJSON.cohortFilter.globalFilters = removeDuplicates(filter, "name");
        cohortJSON.cohortFilter.actionFilters = marksQueue;
        cohortJSON.cohortFilters.push(cohortJSON.cohortFilter);
        cohortJSON.cohortSubjects = subjectid;
        cohortJSON.cohortIndex = [];
        delete cohortJSON.cohortFilter;
		*/
        // console.log(JSON.stringify(cohortJSON));
        return JSON.stringify(cohortJSON)
}

var CallCancel = function () {
	$('#CVForm').validator('destroy');
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

if (annyang) {
  // These are the voice commands in quotes followed by the function
  var commands = {
  	'Refresh Dashboard': function() { startover(); responsiveVoice.speak('showing all'); },
  	'Save': function() { startover(); responsiveVoice.speak('Updating Dashboard'); },
	'select Model *fieldName': function(fieldName) { filterModel(); responsiveVoice.speak('selecting Model' + fieldName); },
	'select Alaska': function() { filterAlaska(); responsiveVoice.speak('selecting Alaska'); },
	'select Arizona': function() { filterArizona(); responsiveVoice.speak('selecting Arizona'); },
	'select Arkansas': function() { filterArkansas(); responsiveVoice.speak('selecting Arkansas'); }
	
 };
function filterModel(fieldName)
{
activeSheet.getWorksheets()[0].applyFilterAsync('Model', fieldName, tableauSoftware.FilterUpdateType.REPLACE);
}
  // Add commands to annyang
  annyang.addCommands(commands);

  // Start listening.
  annyang.start();
}