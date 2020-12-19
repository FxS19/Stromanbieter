$('document').ready(function () {
    $("#submitTarifRequest").click(function () {
        doRequest(document.getElementById('plz').value, document.getElementById('consumption').value);
    })
});


/**
 * Callback wird aufgerufen, wenn eine Antwort Vorliegt
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
 * Stelle eine Anfrage an den Server um die entsprechenden Tarife zu erhalten
 * @param {number} plz angefragte plz
 * @param {number} consumption angefragte kw/h pro Jahr
 */
function doRequest(plz, consumption) {
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
                heading.append($("<th>").text("Preis kW/h"));
                heading.append($("<th>").text("Variable Kosten"));
                table.append(heading);
                tarife.forEach(element => table.append(function () {
                    const row = $("<tr>")
                        .append($("<td>").text(element.title))
                        .append($("<td>").text(element.calculatedPricePerYear + " €"))
                        .append($("<td>").text(element.basicPrice + " €"))
                        .append($("<td>").text(Math.floor(element.pricePerUnit * 10000) / 100 + " ct"));
                    const chartContainer = $("<td>").text("Chart Loading...");
                    row.append(chartContainer);
                    httpGetAsync(`/tarif/${element.id}/history`, (message, status) => {
                        const data = JSON.parse(message);
                        chartContainer.text("");
                        const chart = $("<canvas>").addClass("priceChart");
                        chartContainer.append(chart);
                        var myChart = new Chart(chart, {
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
                                        time: {

                                        }
                                    }]
                                }
                            }
                        });
                    });
                    return row;
                }));
                $("#output").append(table);
            } else {
                $("#output").text("Keine Daten für die eingegebe PLZ");
            }
        } else {
            $("#output").text("Keine Informationen für die eingegeben Daten vorhanden");
        }
    });
}