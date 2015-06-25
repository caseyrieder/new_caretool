
var storeObject = {
    currentPage: null,
    currentExercise: null, nextExercise: null, prevExercise: null,
    currentPatient: null, nextPatient: null, prevPatient: null,
    currentEntry: null, nextEntry: null, prevEntry: null
}

function loadLists(){
	$(document).on('pageshow', "#main-menu", function(e) {
	});

    $("#exercises").on("pagebeforecreate", function() {
        loadExercises();
    });
    // $(document).on('pageshow', "#exercises", function() {
    //     loadExercises();
    // });

    $(document).on('pagebeforeshow', "#activity", function (event, data) {
        showActivity(storeObject.currentExercise);
    });

    // $(document).on('pageshow', "#scoring", function (event, data) {
    //     showScoring(storeObject.currentExercise);
    // });

	$("#patients").on('pagebeforecreate', function() {
		loadPatients();
	});

	$("#history").on('pagebeforeshow', function() {
		loadHistoryNew();
	});

}

//Show Exercise List
function loadExercises(){
    $.getJSON("json/exercises.json", function(group) {
        var listings = this.url.toString().split("/")[1].split(".")[0];
        console.log(listings);
        var itemType = "";
        if (listings == "exercises")
            itemType = "activity";
        if (listings == "patients")
            itemType = "history";
        if (listings == "history")
            itemTYpe = "entry";
        var items = "";
        for (var i in group) {
            items += "<li class='list-item' id='" + itemType + "-" + group[i].id + "'>";
            items += "<a href='#" + itemType + "?id=" + group[i].id + "'>";
            items += group[i].name + "</a></li>";
        }
         $("#exercises-list").append(items).promise().done(function () {
            $(this).listview("refresh");
            //then add click event using delegation
            $(this).on("click", "li", function () {
                var id = $(this).attr("id").split("-")[1];
                storeObject.currentExercise = id;
                var next = $(this).attr("nextSibling");
                console.log(next);
                // setNavigators(id);
            });
        });
    });
}

//Show Activity
function showActivity(id){
    console.log(id);
    var thisPage = storeObject.currentPage;
    console.log(thisPage);
    $.getJSON("json/"+id+".json", function(file) {
        $("h1", thisPage).text(file.name);
        //Description
        $("#activity-desc", thisPage).html(file.description);
        //Exceptions
        var u = "";
        var redX = "<span style='color:red'>&#10008</span> ";
        for (var i in file.exceptions) {
            u += redX + file.exceptions[i];
            if (i < file.exceptions.length) u += "<br>";
        }
        $("#activity-excep", thisPage).html(u);
        //Tips
        var v = "";
        var grnChk = "<span style='color:green'>&#10003</span> ";
        for (var j in file.tips) {
            v += grnChk + file.tips[j];
            if (i < file.exceptions.length) v += "<br>";
        }
        $("#activity-tips", thisPage).html(v);
        //1. Dependent
        var a = "";
        for (var i = 0; i < file.dependent.length; i++) {
            a+="<li>&#8226 "+file.dependent[i]+"</li>";
        }
        $("#score1", thisPage).html(a);
        //2. Substantial 
        var b = "";
        for (var i = 0; i < file.substantial.length; i++) {
            b+="<li>&#8226 "+file.substantial[i]+"</li>";
        }
        $("#score2", thisPage).html(b);
        //3. Partial
        var c = "";
        for (var i = 0; i < file.partial.length; i++) {
            c+="<li>&#8226 "+file.partial[i]+"</li>";
        }
        $("#score3", thisPage).html(c);
        //4. Supervision
        var d = "";
        for (var i = 0; i < file.supervision.length; i++) {
            d+="<li>&#8226 "+file.supervision[i]+"</li>";
        }
        $("#score4", thisPage).html(d);
        //5. Setup
        var e = "";
        for (var i = 0; i < file.setup.length; i++) {
            e+="<li>&#8226 "+file.setup[i]+"</li>";
        }
        $("#score5", thisPage).html(e);
        //6. Independent
        var f = "";
        for (var i = 0; i < file.independent.length; i++) {
            f+="<li >&#8226 "+file.independent[i]+"</li>";
        }        
        $("#score6", thisPage).html(f);
        // var y = "#scoring?id=" + file.id;
        // $("a#scoring-dialog").attr('href', y);
        // var z = "#examples?id=" + file.id;
        // $("a#examples-dialog").attr('href', z);
    });
}


//Show Patient List
function loadPatients(){
    $.getJSON("json/patients.json", function(res,code) {
        var pats = "";
        var sessionline = "<li class='list-item'><a href='sessions.html?id=";
        for (var p in res) {
            pats += sessionline + res[p].id + "'>" + res[p].name + "</a></li>";
        }
        $("#patients-list").html(pats).listview("refresh");
    });
}

//Show Full History
function loadHistory(){
    $.get("json/history.json", {}, function(res,code) {
        var hist = "";
        var entryline = "<li><a href='entry.html?id=";
        for (var h in res) {
            hist += entryline + res[h].sessionid + "'>" + res[h].patientname + " (" + res[h].sessiondate + ")</a></li>";
        }
        $("#history-list").html(hist).listview("refresh");
    }, "json");
}

//Set Prev & Next based on Current
function setNavigators(current){
}
