# wetterjs

Node.js-Anwendung unter Verwendung von angular.js zur Auswertung der stündlichen Daten des DWD für einige Messstationen.

Die Daten werden heruntergeladen und in einer Postgresql-Datenbank abgelegt. Von Postgresql werden erweiterte Features genutzt: 
Definition einer eigenen Aggregationsfunktion zur Mittelbildung über die Windrichtung, on-conflict zum Updaten der Stationsdaten, falls Korrekturen vorgenommen wurden. Vgl. wetter_s.sql.

Es können auch Daten aus einer eigenen Wetterstation ausgewertet werden. Das Einspielen muss je nach Technik mit eigenen Skripten (bspw. PHP und Python) vorgenommen werden. Die Speicherung erfolgt hier in einer getrennten Tabelle.

Stand: alpha/Demo, keine Gewährleistung für die technische oder fachliche Korrektheit oder für irgendeine Nutzbarkeit.