// For Firebase JS SDK v7.20.0 and later, measurementId is optional
var firebaseConfig = {
    apiKey: "AIzaSyBaMRoLTXNSnwcwqrsGECoasCBBzBQHWLQ",
    authDomain: "doctor-patient-access.firebaseapp.com",
    databaseURL: "https://doctor-patient-access-default-rtdb.firebaseio.com",
    projectId: "doctor-patient-access",
    storageBucket: "doctor-patient-access.appspot.com",
    messagingSenderId: "1066923897179",
    appId: "1:1066923897179:web:202b39d672d02fa5466a7e",
    measurementId: "G-DB578XYWEM"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        // Logged in
        firebase.database().ref('Doctors/' + user.uid).on('value', (snapshot) => {
            var doctorProfile = snapshot.val();

            document.getElementById("welcome").innerHTML = "Welcome " + doctorProfile.fullName;

            firebase.database().ref('Patients/').on('value', (snapshot) => {
                var patients = snapshot.val();

                for (var patient in patients) {
                    if (patients[patient].doctorEmail == doctorProfile.email) {
                        addPatient(patient, patients[patient].fullName);
                    }
                }
            });
        });
    } else {
        // Logged out
        window.location.href = "index.html";
    }
});

var regimentElements = [];
var currentPatient = null;

function addPatient(patientUID, patientName) {
    var patientList = document.getElementById("patients");

    var patient = document.createElement("A");
    patient.setAttribute("class", "dropdown-item");
    patient.setAttribute("href", "#");
    patient.setAttribute("onclick", "patientSelect('" + patientUID + "', '" + patientName + "')");
    patient.innerHTML = patientName;

    patientList.appendChild(patient);
}


function logout() {
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
    }).catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;

        window.alert("Error (" + errorCode + ") " + errorMessage)
    });
}

function updateTable(regimens) {
    var table = document.getElementById("regiment_table");

    var rowElements = [];
    var col;
    for (var i = 0; i < regimens.length; i++) {
        col = document.createElement("TD");
        col.setAttribute("rowspan", regimens[i].waves.length.toString());
        col.innerHTML = regimens[i].name;

        rowElements.push(col);

        col = document.createElement("TD");
        col.setAttribute("rowspan", regimens[i].waves.length.toString());
        col.innerHTML = regimens[i].duration.toString();
        
        rowElements.push(col);

        col = document.createElement("TD");
        col.setAttribute("rowSpan", regimens[i].waves.length.toString());
        col.innerHTML = regimens[i].offset.toString();
        
        rowElements.push(col);

        for (var j = 0; j < regimens[i].waves.length; j++) {
            var wave = regimens[i].waves[j];

            col = document.createElement("TD");
            col.innerHTML = wave.name;

            rowElements.push(col);

            
            col = document.createElement("TD");
            col.innerHTML = wave.frequency.toString();

            rowElements.push(col);

            col = document.createElement("TD");
            col.innerHTML = wave.amplitude.toString();

            rowElements.push(col);

            var row = document.createElement("TR");

            for (var k = 0; k < rowElements.length; k++) {
                row.appendChild(rowElements[k]);
            }

            table.appendChild(row);
            rowElements = [];
        }
    }

}

function getPatientRegimens() {
    document.getElementById("regiment_table").innerHTML = ""

    firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function (idToken) {

        var xhr = new XMLHttpRequest();

        var url = "/doctorGetRegimens";

        var data = {
            token: idToken,
            patientID: currentPatient
        };

        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.onload = function () {
            if (xhr.status != 200) {
                window.alert("Error(" + xhr.status + ") " + xhr.statusText);
            } else {
                updateTable(JSON.parse(xhr.response));
            }
        }

        xhr.onerror = function () {
            window.alert("Request Failed");
        }

        xhr.send(JSON.stringify(data));

    }).catch(function (error) {
        // Handle error
    });
}

function patientSelect(patientUID, patientName) {
    document.getElementById("selected-patient").innerHTML = patientName;
    currentPatient = patientUID;
    document.getElementById("patient-info").style.display = "block";

    getPatientRegimens();
}

function createInput(title) {
    var waveInput = document.createElement("DIV");
    waveInput.setAttribute("class", "input-group mb-1");

    var prependDiv = document.createElement("DIV");
    prependDiv.setAttribute("class", "input-group-prepend");
    prependDiv.setAttribute("id", "inputGroup-sizing-sm");

    var prependText = document.createElement("SPAN");
    prependText.setAttribute("class", "input-group-text");
    prependText.setAttribute("id", "inputGroup-sizing-sm");
    prependText.innerHTML = title;

    prependDiv.appendChild(prependText);
    waveInput.appendChild(prependDiv);

    var textInput = document.createElement("INPUT");
    textInput.setAttribute("type", "text");
    textInput.setAttribute("class", "form-control");
    textInput.setAttribute("aria-labe", "Small");
    textInput.setAttribute("aria-describedby", "inputGroup-sizing-sm");

    waveInput.appendChild(textInput);

    return [waveInput, textInput];
}

function appendWave(type, hasFreq) {
    var listDiv = document.getElementById("regiment_waves");

    var regimentElement = {};

    regimentElement.type = type.toLowerCase();

    var boundingDiv = document.createElement("DIV");
    boundingDiv.setAttribute("class", "d-flex flex-column pb-2 mb-3 border-bottom");

    var text = document.createElement("H1");
    text.setAttribute("class", "h4");
    text.innerHTML = type;

    boundingDiv.appendChild(text);

    amplitude = createInput("Amplitude");
    boundingDiv.appendChild(amplitude[0]);
    regimentElement.ampInput = amplitude[1];

    if (hasFreq) {
        frequency = createInput("Frequency");
        boundingDiv.appendChild(frequency[0]);
        regimentElement.freqInput = frequency[1];
    } else {
        regimentElement.freqInput = null;
    }

    regimentElements.push(regimentElement);
    listDiv.appendChild(boundingDiv);
}

function clearRegiment() {
    var listDiv = document.getElementById("regiment_waves");
    listDiv.innerHTML = "";
    document.getElementById("regiment_name").value = "";
    document.getElementById("regiment_offset").value = "";
    document.getElementById("regiment_duration").value = "";
    regimentElements = [];
}

function sendRegimen() {
    firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function (idToken) {
        var fullRegimen = {
            name: document.getElementById("regiment_name").value,
            offset: parseFloat(document.getElementById("regiment_offset").value),
            duration: parseFloat(document.getElementById("regiment_duration").value),
            waves: []
        };

        sumAmplitude = fullRegimen.offset;

        for (var i = 0; i < regimentElements.length; i++) {
            var wave = {
                name: regimentElements[i].type,
                amplitude: parseFloat(regimentElements[i].ampInput.value),
                frequency: 0.0
            };

            if (regimentElements[i].freqInput != null) {
                wave.frequency = parseFloat(regimentElements[i].freqInput.value);
            }

            sumAmplitude += wave.amplitude;

            fullRegimen.waves.push(wave);
        }

        if (sumAmplitude > 1.0) {
            window.alert("Sum of amplitude greater than 1");
        } else {
            var xhr = new XMLHttpRequest();

            var url = "/doctorAddRegimen";

            var data = {
                token: idToken,
                patientID: currentPatient,
                data: fullRegimen
            };

            xhr.open("POST", url);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

            xhr.onload = function () {
                if (xhr.status != 200) {
                    window.alert("Error(" + xhr.status + ") " + xhr.statusText);
                    document.getElementById('success').style.display = 'none';
                } else {
                    clearRegiment();
                    getPatientRegimens();
                    document.getElementById('success').style.display = 'block';
                }
            }

            xhr.onerror = function () {
                window.alert("Request Failed");
            }

            xhr.send(JSON.stringify(data));

        }
    }).catch(function (error) {
        // Handle error
    });
}