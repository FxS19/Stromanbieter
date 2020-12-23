/** Wird aufgerufen wenn die Seite fertig geladen ist*/
$('document').ready(function () {
    /** Belegt den Button mit der funktion doRequest*/
    $("#submitTarifRequest").click(function () {
        doRequest(document.getElementById('plz').value, document.getElementById('consumption').value);
    })
});

/**
 * Callback wird aufgerufen, wenn eine Antwort vom Server vorliegt
 * @callback httpGetCallback
 * @param {string} responseMessage
 * @param {number} status
 */

/**
 * Mache einen http-get request
 * @param {string} theUrl 
 * @param {httpGetCallback} callback 
 */
function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onloadend = function () {
        callback(xmlHttp.responseText, xmlHttp.status);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

/**
 * Stelle eine Anfrage an den Server um die entsprechenden Tarif-Informationen zu erhalten
 * @param {number} plz angefragte plz
 * @param {number} consumption angefragte kw/h pro Jahr
 */
function doRequest(plz, consumption) {
    /**Auruf der Rates Rest-Schnittstelle und wieder gabe als Tabelle */
    httpGetAsync(`/rates?zipCode=${plz}&consumption=${consumption}`, (text, status) => {
        if (status == 200) {
            const tarife = JSON.parse(text);
            console.log(tarife);
            if (tarife.length > 0) {
                $("#output").html("");
                $("#output").text("");
                const table = $("<table>");
                const heading = $("<tr>");
                heading.append($("<th>").text("Name"));
                heading.append($("<th>").text("Jahrespreis"));
                heading.append($("<th>").text("Fixkosten"));
                heading.append($("<th>").text("Preis kWh"));
                table.append(heading);
                /**Wiedergabe der möglichen Tarife für die PLZ und den Verbauch*/
                tarife.forEach(element => table.append(function () {
                    const row = $("<tr>")
                        .append($("<td>").text(element.title))
                        .append($("<td>").text(element.calculatedPricePerYear + " €"))
                        .append($("<td>").text(element.basicPrice + " €"))
                        .append($("<td>").text(Math.floor(element.pricePerUnit * 10000) / 100 + " ct"));
                    return row;
                }));
                tarife.map((tarif) => { return tarif.id });
                getHistory(tarife.map((tarif) => { return tarif.id }));
                $("#output").append(table);
            } else {
                $("#output").text("Keine Daten für die eingegebe PLZ");
            }
        } else {
            $("#output").text("Keine Informationen für die eingegeben Daten vorhanden");
        }
    });
}

/**
 * Stelle, mit den übergebenen Tarif-Ids, eine Anfrage an den Server um die entsprechende Historie anzeigen zu lassen.
 * @param {Array<number>} tarifids 
 */
function getHistory(tarifids) {
    $("#historyoutput").html("");
    $("#historyoutput").text("");
    const table = $("<table>");
    const heading = $("<tr>");
    heading.append($("<th>").text("Name"));
    heading.append($("<th>").text("Variable Kosten"));
    table.append(heading);
    tarifids.forEach(element => table.append(function () {
        const historyrow = $("<tr>");
        /**Auruf der Tarif-Historien Rest-Schnittstelle und wiedergabe als Chart*/
        httpGetAsync(`/tarif/${element}/history`, (message, status) => {
            const data = JSON.parse(message);
            historyrow.append($("<td>").text(data[0].title))
            const chartContainer = $("<td>").text("Chart Loading...");
            historyrow.append(chartContainer);
            chartContainer.text("");
            const chart = $("<canvas>").addClass("priceChart");
            chartContainer.append(chart);
            new Chart(chart, {
                type: 'line',
                data: {
                    datasets: [{
                        data: (() => {
                            let ret = data.map((e) => {
                                return {
                                    x: e.date,
                                    y: e.pricePerUnit
                                }
                            });
                            //Füge den letzten Wert nocheinmal mit aktuellem Datum hinzu. Muss nicht sortiert werden, da vom Server bereits impliziert sortier über index/date Zusammenhang
                            ret[ret.length] = {
                                x: Date.now(),
                                y: data[data.length - 1].pricePerUnit
                            };
                            return ret;
                        })(),
                        borderColor: "#f1d88c",
                        backgroundColor: "rgba(0, 0, 0, 0)",
                        steppedLine: "before"
                    }]
                },
                options: {
                    legend: {
                        display: false,
                    },
                    scales: {
                        xAxes: [{
                            type: 'time',
                            time: {},
                        }],
                        yAxes:[{
                            ticks: {
                                min: 0,
                                max: 1,
                                stepSize: 0.1
                            },
                            scaleLabel: {
                                display: true,
                                labelString: '€/kWh'
                            }
                        }],
                    }
                }
            });

        });
        return historyrow;
    }));
    $("#historyoutput").append(table);
}