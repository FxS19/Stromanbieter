/** Wird aufgerufen wenn die Seite fertig geladen ist*/
$('document').ready(function() {
    /** Belegt den Button mit der funktion doRequest*/
    $("#submitTarifRequest").click(function() {
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
 * Starte den Prozess zum Aktualisieren der angezeigten Elemente
 * @param {number} plz angefragte plz
 * @param {number} consumption angefragte kw/h pro Jahr
 */
async function doRequest(plz, consumption) {
    let tarifids = await getKosten(plz, consumption);
    getHistory(tarifids);
}

/**
 * Akualisiere die Kosten der Tarife
 * @param {number} plz angefragte plz
 * @param {number} consumption angefragte kw/h pro Jahr
 * @returns {Array<Number>} Gefundene Tarif id's
 */
async function getKosten(plz, consumption) {
    let ret = [];
    /**Auruf der Rates Rest-Schnittstelle und wieder gabe als Tabelle */
    const response = await fetch(`/rates?zipCode=${plz}&consumption=${consumption}`);
    if (response.status == 200) {
        const tarife = await response.json();
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
            for (element of tarife)
                table.append(function() {
                    const row = $("<tr>")
                        .append($("<td>").text(element.title))
                        .append($("<td>").text(element.calculatedPricePerYear + " €"))
                        .append($("<td>").text(element.basicPrice + " €"))
                        .append($("<td>").text(Math.floor(element.pricePerUnit * 10000) / 100 + " ct"));
                    return row;
                });
            $("#output").append(table);
            ret = tarife.map((tarif) => { return tarif.id });
        } else {
            $("#output").text("Keine Informationen für die eingegeben Daten vorhanden");
        }
    } else {
        $("#output").text("Keine Informationen für die eingegeben Daten vorhanden");
    }
    return ret;
}

/**
 * Stelle, mit den übergebenen Tarif-Ids, eine Anfrage an den Server um die entsprechende Historie anzeigen zu lassen.
 * @param {Array<number>} tarifids 
 */
async function getHistory(tarifids) {
    console.log(tarifids);
    $("#historyoutput").html("");
    $("#historyoutput").text("");
    if (tarifids.length == 0) return;
    const table = $("<table>");
    const heading = $("<tr>");
    heading.append($("<th>").text("Name"));
    heading.append($("<th>").text("Variable Kosten"));
    table.append(heading);
    for (const element of tarifids) {
        const historyrow = $("<tr>");
        /**Auruf der Tarif-Historien Rest-Schnittstelle und wiedergabe als Chart*/
        const response = await fetch(`/tarif/${element}/history`);
        if (response.status == 200) {
            const data = await response.json();
            historyrow.append($("<td>").text(data[0].title));
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
                        yAxes: [{
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

        } else {
            historyrow.append($("<td>").text("Fehler in der Datenverarbeitung"));
        }
        table.append(historyrow);
    }
    $("#historyoutput").append(table);
}