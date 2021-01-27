# Team
Matrikelnummern
* 6098168
* 5959185
* 5631113

# Beschreibung
Das projekt besteht aus einem Webserver und einer Website.

## Webserver
Der Webserver ist in NodeJS geschrieben und läuft auf dem Port 8080.
Der Server stellt einen einfachen Zugriff auf Dateien, welche in dem Ordner "views" abgelegt sind bereit.
Eine Weitere aufgabe des Servers ist das Bereitstellen einer REST konformen schnittstelle, über sie Daten zu den einzelnen Stromanbietern ausgelesen werden können.

### REST-schnittstelle
Die Schnittstelle kann mit dem Pfad "[serveradresse]/api" angesteuert weren. Es handelt sich hiebei um eine REST-full Schnittstelle.

# Website
Die Website zeigt dier über die REST schnittstelle erhaltenen Daten an.

# Anleitung für die DB ???
Bei Fehler Linux verwendet

# Better-sqlite3
Benutzen von Better-sqlite3
Bietet eine einheitlichere Schnittstelle zu JS.
zudem ist Vorkompilieren von Querries möglich, sowie das schreiben von aggregaten.
 Mehr Informationen unter: https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md

# Datenbank zurücksetzten
Tabellen erstellen
rm .data/* <--alle Dateien in .data löschen (reset)

