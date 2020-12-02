$('document').ready(function(){
    $("#submitTarifRequest").click(function(){
        doRequest(document.getElementById('plz').value, document.getElementById('consumption').value);
    })
});

function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4) callback(xmlHttp.responseText, xmlHttp.status);
    }
    xmlHttp.onerror = function(){
        $("#output").text("Keine Informationen für die eingegeben Daten vorhanden");
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

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
                table.append(heading);
                tarife.forEach(element => table.append(function(){
                    return $("<tr>")
                    .append($("<td>").text(element.title))
                    .append($("<td>").text(element.calculatedPricePerYear + " €"))
                    .append($("<td>").text(element.basicPrice + " €"))
                    .append($("<td>").text(Math.floor(element.pricePerUnit*10000)/100 + " ct"));
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