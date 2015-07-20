var storeObject = {
    currentPage: null,
    currentExercise: null,
    nextExercise: null,
    prevExercise: null,
    currentPatient: null,
    nextPatient: null,
    prevPatient: null,
    currentEntry: null,
    nextEntry: null,
    prevEntry: null,
    assessmentId: null,
    exerciseList: null,
    peeteeId: 1,
    patientHistory: null,
    currentAssessmentHistory: null,
    currentQuestionInAssessmentHistory: null,
    fileToUpload: null,
    possibleAnswers: ["","Dependent", "Substantial / Maximal Assistance", "Partial / Moderate Assistance", "Supervision / Touching Assistance", "Setup or Clean-Up Assistance", "Independent", "Not Attempted - Safety Concerns","Not Applicable","Not Completed","Patient Refused"]
}

function loadLists() {
    $(document).on('pageshow', "#main-menu", function(e) {});

    $("#exercises").on("pagebeforecreate", function() {
        loadExercises();
    });
    // $(document).on('pageshow', "#exercises", function() {
    //     loadExercises();
    // });

    $(document).on('pagebeforeshow', "#activity", function(event, data) {
        showActivity(storeObject.currentExercise);
    });

    // $(document).on('pageshow', "#scoring", function (event, data) {
    //     showScoring(storeObject.currentExercise);
    // });

    $("#patients").on('pagebeforecreate', function() {
        loadPatients();
    });

    $("#history").on('pagebeforeshow', function() {
        loadHistory();
    });

    $("#scheduling").on('pagebeforecreate', function() {
        loadScheduledPatients();
    });

    $("#score-page").on('pagebeforeshow', function() {
        createAssesment();
    });

    $("#assessment-history-page").on('pagebeforeshow', function() {
        // render the history
        storeObject.currentQuestionInAssessmentHistory = 0;
        renderCurrentHistory(storeObject.currentQuestionInAssessmentHistory);
    });

    $("#assessment-history-page").on('pagebeforecreate', function() {
        // configure the next button
        $("#assessment-history-page .next").on('click', function() {
            if (storeObject.currentQuestionInAssessmentHistory + 1 == storeObject.exerciseList.length) {
                alert('Done with this assessment');
                $.mobile.changePage("#scheduling");
            } else {
                storeObject.currentQuestionInAssessmentHistory++;
                renderCurrentHistory(storeObject.currentQuestionInAssessmentHistory);
            }
        })
    });

    $("#score-page").on('pagebeforecreate', function() {
        // register the submit handler
        $("#score-page-score-submit").on('click', function() {

            if (storeObject.fileToUpload != null && storeObject.fileToUpload != undefined && storeObject.fileToUpload.length != 0) {
                // upload file to S3
                var data = new FormData();
                $.each(storeObject.fileToUpload, function(key, value) {
                    data.append("file", value);
                });

                $.ajax({
                    url: 'http://192.168.1.13:9000/assessment/uploadFile',
                    type: 'POST',
                    data: data,
                    cache: false,
                    processData: false, // Don't process the files
                    contentType: false, // Set content type to false as jQuery will tell the server its a query string request
                }).done(function(response) {
                    console.log(response);

                    var answer = {
                        "timestamp": (new Date()).getTime(),
                        "code": storeObject.exerciseList[storeObject.currentExercise].code,
                        "score": $('input:radio[name=radio-score-choice]:checked').val(),
                        "peeteeId": 1,
                        "text": $("#answer-notes").val(),
                        "mediaUrl": response
                    }
                    submitAnswer(storeObject.assessmentId, answer);

                }).fail(function(error) {
                    alert(JSON.stringify(error));
                });
            } else {
                var answer = {
                    "timestamp": (new Date()).getTime(),
                    "code": storeObject.exerciseList[storeObject.currentExercise].code,
                    "score": $('input:radio[name=radio-score-choice]:checked').val(),
                    "peeteeId": 1,
                    "text": $("#answer-notes").val(),
                    "mediaUrl": null
                }
                submitAnswer(storeObject.assessmentId, answer);
            }

        });

        $('#question-media').on('change', function(event) {
            storeObject.fileToUpload = event.target.files;
        });

        $("#manager-submit").on('click', function() {
            makePostAsyncRequest('assessment/sendToManager/' + storeObject.assessmentId, null, function() {
                $("#score-page-submit-manager").popup("close");
                alert('Submitted to manager');
                $.mobile.changePage("#scheduling");
            });
        });
    });

}

//Show Exercise List
function loadExercises() {
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
        $("#exercises-list").append(items).promise().done(function() {
            $(this).listview("refresh");
            //then add click event using delegation
            $(this).on("click", "li", function() {
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
function showActivity(id) {
    console.log(id);
    var thisPage = storeObject.currentPage;
    console.log(thisPage);
    $.getJSON("json/" + id + ".json", function(file) {
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
            a += "<li>&#8226 " + file.dependent[i] + "</li>";
        }
        $("#score1", thisPage).html(a);
        //2. Substantial 
        var b = "";
        for (var i = 0; i < file.substantial.length; i++) {
            b += "<li>&#8226 " + file.substantial[i] + "</li>";
        }
        $("#score2", thisPage).html(b);
        //3. Partial
        var c = "";
        for (var i = 0; i < file.partial.length; i++) {
            c += "<li>&#8226 " + file.partial[i] + "</li>";
        }
        $("#score3", thisPage).html(c);
        //4. Supervision
        var d = "";
        for (var i = 0; i < file.supervision.length; i++) {
            d += "<li>&#8226 " + file.supervision[i] + "</li>";
        }
        $("#score4", thisPage).html(d);
        //5. Setup
        var e = "";
        for (var i = 0; i < file.setup.length; i++) {
            e += "<li>&#8226 " + file.setup[i] + "</li>";
        }
        $("#score5", thisPage).html(e);
        //6. Independent
        var f = "";
        for (var i = 0; i < file.independent.length; i++) {
            f += "<li >&#8226 " + file.independent[i] + "</li>";
        }
        $("#score6", thisPage).html(f);
        // var y = "#scoring?id=" + file.id;
        // $("a#scoring-dialog").attr('href', y);
        // var z = "#examples?id=" + file.id;
        // $("a#examples-dialog").attr('href', z);
    });
}


//Show Patient List
function loadPatients() {

    $.getJSON("json/patients.json", function(res, code) {
        var pats = "";
        var sessionline = "<li class='list-item'><a href='sessions.html?id=";
        for (var p in res) {
            pats += sessionline + res[p].id + "'>" + res[p].name + "</a></li>";
        }
        $("#patients-list").html(pats).listview("refresh");
    });
}

function loadScheduledPatients() {
    makeGetAsyncRequest('patients/getMyPatients?peeteeId=' + storeObject.peeteeId, function(response) {
        var pats = "";
        var sessionline = "<li class='list-item'><a href='#sessions-page?id=";
        for (var p in response) {
            pats += sessionline + response[p].id + "'>" + response[p].firstName + " " + response[p].lastName + "</a></li>";
        }
        $("#scheduling-patients-list").html(pats).listview("refresh");

        $("#scheduling-patients-list a").on('click', function() {
            storeObject.currentPatient = $(this).attr("href").split("id=")[1];
        });
    });
}

//Show Full History
function loadHistory() {
    makeGetAsyncRequest('patients/getHistory?patientId=' + storeObject.currentPatient, function(res) {
        var hist = "";
        var entryline = "<li><a href='#assessment-history-page?id=";
        for (var h in res) {
            hist += entryline + h + "'>" + res[h].evaluator.firstName + " " + res[h].evaluator.lastName + " (" + (new Date(res[h].createdTimestamp)).toDateString() + ")</a></li>";
        }
        storeObject.patientHistory = res;

        $("#history-list").html(hist).listview("refresh");

        $("#history-list a").on('click', function() {
            storeObject.currentAssessmentHistory = $(this).attr("href").split("id=")[1];
        });
    });
}

function loadQuestions() {
    makeGetAsyncRequest('careTool/items/', function(response) {
        console.log(response);
        storeObject.exerciseList = response;
        storeObject.currentExercise = 0;
        showQuestion(response[0].name);
    });
}

function createAssesment() {
    var assessment = {
        "peetee_id": storeObject.peeteeId,
        "patient_id": storeObject.currentPatient
    };
    var assessmentId = null;
    makePostAsyncRequest('assessment/create', assessment, function(response) {
        console.log(response);
        storeObject.assessmentId = response.split(":")[1];
        loadQuestions();
    });
}

function showQuestion(name) {

    makeGetAsyncRequest('careTool/items/name/' + name, function(question) {
        // Considering only the first question
        question = question[0];
        $("#score-page h1").text(question.name);
        //Description
        $("#score-page-score-desc").html(question.description);
        //Exceptions
        var u = "";
        var redX = "<span style='color:red'>&#10008</span> ";
        for (var i in question.exceptions) {
            u += redX + question.exceptions[i];
            if (i < question.exceptions.length) u += "<br>";
        }
        $("#score-page-score-excep").html(u);
        //Tips
        var v = "";
        var grnChk = "<span style='color:green'>&#10003</span> ";
        for (var j in question.tips) {
            v += grnChk + question.tips[j];
            if (i < question.exceptions.length) v += "<br>";
        }
        $("#score-page-score-tips").html(v);

        //1. Dependent
        var a = "";
        for (var i = 0; i < question.dependent.length; i++) {
            a += "<li>&#8226 " + question.dependent[i] + "</li>";
        }

        $("#score-page-score1").html(a);
        //2. Substantial 
        var b = "";
        for (var i = 0; i < question.substantial.length; i++) {
            b += "<li>&#8226 " + question.substantial[i] + "</li>";
        }
        $("#score-page-score2").html(b);
        //3. Partial
        var c = "";
        for (var i = 0; i < question.partial.length; i++) {
            c += "<li>&#8226 " + question.partial[i] + "</li>";
        }
        $("#score-page-score3").html(c);
        //4. Supervision
        var d = "";
        for (var i = 0; i < question.supervision.length; i++) {
            d += "<li>&#8226 " + question.supervision[i] + "</li>";
        }
        $("#score-page-score4").html(d);
        //5. Setup
        var e = "";
        for (var i = 0; i < question.setup.length; i++) {
            e += "<li>&#8226 " + question.setup[i] + "</li>";
        }
        $("#score-page-score5").html(e);
        //6. Independent
        var f = "";
        for (var i = 0; i < question.independent.length; i++) {
            f += "<li >&#8226 " + question.independent[i] + "</li>";
        }
        $("#score-page-score6").html(f);

        $('input:radio[name=radio-score-choice]').change(function() {
            $("#score-page-scoring").popup("close");
        });
    });

}

function submitAnswer(assessmentId, answer) {

    // hide the popup
    $("#score-page-scoring").popup("close");

    makePostAsyncRequest('assessment/addScore?assessmentId=' + assessmentId, answer, function(response) {
        // goto next question
        storeObject.currentExercise++;
        if (storeObject.currentExercise == storeObject.exerciseList.length) {
            $("#score-page-submit-manager").popup("open");
        } else {
            showQuestion(storeObject.exerciseList[storeObject.currentExercise].name);
        }
        $("#answer-notes").val("");

        $('input:radio[name=radio-score-choice]:checked').removeAttr("checked");
        $("input:radio[name=radio-score-choice]").checkboxradio("refresh");
        $("input:radio[name=radio-score-choice]:first").attr("checked", true);

        $("#question-media").val('');
    });

}

function submitComment(assessmentId, comment) {
    comment = {
        "timestamp": (new Date()).getTime(),
        "type": "COMMENT",
        "managerId": 1,
        "text": "hello"
    };

    $.ajax({
        type: 'POST',
        url: 'http://192.168.1.13:9000/assessment/addComments?assessmentId=1',
        data: comment,
        contentType: "application/json",
        success: function(response) {}
    });
}

function renderCurrentHistory(currentQuestionInAssessmentHistory) {
    var name = storeObject.exerciseList[currentQuestionInAssessmentHistory].name;

    makeGetAsyncRequest('careTool/items/name/' + name, function(question) {
        // Considering only the first question
        question = question[0];
        $("#assessment-history-page h1").text(question.name);
        //Description
        $("#assessment-history-score-desc").html(question.description);
        //Exceptions
        var u = "";
        var redX = "<span style='color:red'>&#10008</span> ";
        for (var i in question.exceptions) {
            u += redX + question.exceptions[i];
            if (i < question.exceptions.length) u += "<br>";
        }
        $("#assessment-history-score-excep").html(u);
        //Tips
        var v = "";
        var grnChk = "<span style='color:green'>&#10003</span> ";
        for (var j in question.tips) {
            v += grnChk + question.tips[j];
            if (i < question.exceptions.length) v += "<br>";
        }
        $("#assessment-history-score-tips").html(v);

        var assessment = storeObject.patientHistory[storeObject.currentAssessmentHistory];
        var score = assessment.scores[currentQuestionInAssessmentHistory].score;
        var notes = assessment.documentation[currentQuestionInAssessmentHistory].comments;
        var attachmentURL = assessment.documentation[currentQuestionInAssessmentHistory].pathToAttachment;

        $("#chosen-answer").val(storeObject.possibleAnswers[score]);
        $("#assessment-history-answer-notes").val(notes);
        if (attachmentURL != null) {
            $("#assessment-history-exercise-video").show();
            $('#assessment-history-image').attr("src", attachmentURL);    
        } else {
            $("#assessment-history-exercise-video").hide();
        }
        
    });
}

function makePostAsyncRequest(url, data, successCallback) {
    $.ajax({
        type: 'POST',
        url: 'http://192.168.1.13:9000/' + url,
        data: JSON.stringify(data),
        contentType: "application/json",
        processData: false
    }).done(function(response) {
        successCallback(response);
    }).fail(function(response) {
        console.log(response);
    })
}

function makeGetAsyncRequest(url, successCallback) {
    $.ajax({
        type: 'GET',
        url: 'http://192.168.1.13:9000/' + url,
        contentType: "application/json",
        processData: false
    }).done(function(response) {
        successCallback(response);
    }).fail(function(response) {
        console.log(response);
    })
}


//Set Prev & Next based on Current
function setNavigators(current) {}