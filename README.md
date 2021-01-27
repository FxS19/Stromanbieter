# Team
## Matrikelnummern
* 6098168
* 5959185
* 5631113


# Beschreibung
In diesem Projekt soll ein Vergleichsrechner für Kunden erstellt werden. Hierzu soll Vergleichsportalen die Möglichkeit geboten werden, über eine Rest Schnittstelle zusammen zu arbeiten und unsere Tarifdaten in einem standardisierten Format von unserem Server aufzurufen sein.


# Webserver
Der Webserver ist in **NodeJS** geschrieben und läuft auf dem **Port 8080**.  
Der Server stellt einen einfachen Zugriff auf Dateien, welche in dem Ordner "views" abgelegt sind, bereit.  
Eine weitere Aufgabe des Servers ist das Bereitstellen einer **REST konformen Schnittstelle**, über sie Daten zu den einzelnen Stromanbietern ausgelesen werden können.  
Der Webserver verwendet als Datenbank **Better-sqlite3**. Bitte vergewissern Sie sich, dass Sie **Better-sqlite3** installiert haben.

Dieser Webserver ist sowohl nach erfolgreichem Einrichten von **NodeJS** und **Better-sqlite3** auf dem **lokalen Rechner** lauffähig. **Alternativ** ist das Projekt auch unter **Glitch** aufrufbar und anwendbar.  
**Code:** https://glitch.com/edit/#!/special-motley-weaver  
**Website:** https://special-motley-weaver.glitch.me


## Better-sqlite3
Benutzen von Better-sqlite3 bietet eine einheitlichere Schnittstelle zu JS. Zudem ist Vorkompilieren von Queries möglich, sowie das Schreiben von Aggregaten.  
Mehr Informationen unter:   
https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md  
**Hilfe zur Installation:**   
https://github.com/JoshuaWise/better-sqlite3/blob/6d05e9e4e796c0a1e0f97bd5c7a535a743caf6ef/docs/troubleshooting.md  


## REST-Schnittstelle
Die Schnittstellen-Funktionen können mit dem Pfad "[serveradresse]/[funktion]" angesprochen werden. Es handelt sich hierbei um eine REST-full Schnittstelle.  
Die Schnittstellen sind sowohl Lokal als auch über Glitch aufrufbar. Um eine Übersicht zu bewahren wird lediglich der lokale Pfad als Beispiel genannt. Für ein Test über Glitch wechseln Sie bitte **http://localhost:8080/** mit **https://special-motley-weaver.glitch.me/** aus.  


# REST-Dokumentation
Bitte **ersetzen** Sie in jeder URL **[Variable]** durch konkrete Information. Die eckigen Klammern sind ebenfalls zu entfernen.  
**Weiterentwicklungen für Aufgabe 3 sind als diese gekennzeichnet.**

## GET http://localhost:8080/tarif/[TarifID] 
Gibt einen Tarif durch Eingabe der Tarif ID zurück.  
**Output:**  
[{id, title, zipCode, pricePerUnit, basicPrice, active},...]

## GET http://localhost:8080/tarif/[TarifID]/history
**Weiterentwicklung:** Der Server gibt alle früheren Versionen des Tarifs zurück. Betrachtet werden Preisänderungen, wenn der Tarif unter einem anderen Namen auftritt wird dies nicht beachtet. Diese Funktion wird in der Webseite für die Historien ansicht verwendet. Die ID in diesem Output bezieht sich auf die Tarif-ID.  
**Output:**  
[{id, title, zipCode, pricePerUnit, basicPrice, active, date},...]

## GET http://localhost:8080/rates
Gibt alle möglichen Tarife und Kosten für die eingegebene PLZ und Verbrauchswert zurück. Die ID in diesem Output bezieht sich auf die Tarif-ID.  
**Input Body:**  
{zipCode, consumption}  
**Output:**  
[{id, title, zipCode, pricePerUnit, basicPrice, consumption, calculatedPricePerYear},...]  

## POST http://localhost:8080/orders
Die Schnittstelle ermöglicht das Anlegen einer Bestellung für einen ausgewählten Tarif mit verarbeitung der gesendeten Daten. Die ID in diesem Output bezieht sich auf die Bestell-ID.  
**Input Body:**  
{firstName, lastName, street, streetNumberzipCode, city, rateId, consumption, agent}  
**Output:**  
{id, calculatedPricePerYear}  

## GET http://localhost:8080/orders/[BestellID]?zipCode=[zipCode]&firstName=[firstName]&lastName=[lastName]
**Weiterentwicklung:** Gibt eine Bestellinformationen zu einer versendeten Bestellung wieder anhand der mit gegebenen Daten die zur gesendeten Bestellung gehören. Die ID in diesem Output bezieht sich auf die Bestell-ID.  
**Output:**  
{id, tarif, calculatedPricePerYear, aktiv, bestellDatum, firstName, lastName, street, streetnumber, zipCode}  

## DELETE http://localhost:8080/orders/2?zipCode=xxxxx&firstName=xxxxx&lastName=xxxxx
**Weiterentwicklung:** Deaktviert die Bestellung die mit den eingegebenen Daten übereinstimmt. Hierbei wird die Bestellung in der Datenbank auf **inaktiv** gesetzt. Hierbei wird geprüft ob die **Stornier-/ Kündigungsfrist von 14 Tagen** schon überschritten ist oder nicht.  
**Output:**  
String

## POST http://localhost:8080/update
Rest Schnittstelle zum Updaten einer Datei in die Datenbank, welche bereits auf dem Server verfügbar ist.  
Der Erwartete Inhalt der Datei ist wie Folgt: [Tarifname];[PLZ];[Fixkosten];[Variablekosten].  
**Weiterentwicklung:**  Anhand von Tarifname und Postleizahl wird geprüft ob es sich um dieselben Datensätze, neue Datensätze, Änderungen oder Deaktivierung handelt.  
 > ***Deaktivierung:***  
Beim Upload werden alle Tarife deaktiviert. Deaktivierte Datensätze stehen nicht für Berechnungen und Bestellungen zur Verfügung.  
***Dieselben Datensätze:***  
Stimmt ein neuer Datensatz (CSV) mit einem alten Datensatz (DB) überein, wird dieser wieder aktiviert. Es werden keine doppelten Datensätze angelegt.   
***Änderungen:***  
Weichen die Preise von dem neuen Datensatz (CSV) von einem alten Datensatz (DB) ab, wird der neuen Datensatz als aktiv hinzugefügt und der alte bleibt deaktiviert.  
***Neue Datensätze:***   
Wenn kein alter Tarif gefunden wird, wird der Tarif als ein neuer aktiver Tarif angelegt.  

**Input Body:**  
{path: "path to file"} /default "data.csv"  
**Output:**  
String 

## POST http://localhost:8080/update/text
**Weiterentwicklung:** Rest-Schnittstelle zum Updaten der Datenbank, welches den Inhalt der CSV als text im Body an den Webserver sendet.  
**Input Body as RAW:**  
String (Inhalte der CSV)  
**Output:**  
String  

## POST http://localhost:8080/update/file
**Weiterentwicklung:** Restschnittstelle zum Updaten der Datenbank mittels Dateiuploads, als form-data der Key, in dem sich die Datei befindet, ist frei oder mehrfach wählbar. Es darf nur eine Datei pro Key gewählt werden.  
**Input Body as form-data, key = file:**  
File (CSV)  
**Output:**  
String  

# Weiterentwicklung: Website
Die Website besteht aus einer Seite (Index.html) auf welche direkt geleitet wird, sobald man im Browser **http://localhost:8080/** aufruft. Die Webseite verfügt über einen Tarifrechner welcher eine Rest-Anfrage für die Anzeige der zutreffenden Tarife und eine weitere Rest-Anfrage für die Daten der Historie absetzt. Siehe Punkt **REST-Dokumentation**.