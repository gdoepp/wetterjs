# wetterjs

Node.js-Anwendung zur Verwendung mit angular zur Auswertung der stündlichen Daten des DWD für einige Messstationen.

Die Daten werden heruntergeladen und in einer Postgresql-Datenbank abgelegt. Von Postgresql werden erweiterte Features genutzt: 
Definition einer eigenen Aggregationsfunktion zur Mittelbildung über die Windrichtung und zur Ermittlung der Tageslänge, on-conflict zum Updaten der Stationsdaten, falls Korrekturen vorgenommen wurden. Vgl. wetter_s.sql.

Die Datenbank ist partitioniert in: 
1. einmalig eingespielte historische DWD-Daten, 
2. neue, täglich aktualisierte DWD-Daten, 
3. Daten von eigenen Sensoren 

Es können auch Daten aus einer eigenen Wetterstation ausgewertet werden. Das Einspielen muss je nach Technik mit eigenen Skripten (bspw. PHP und Python) vorgenommen werden. Die Daten werden per REST-Service oder über Rabbit-MQ bzw. Artemis/ActiveMQ entgegengenommen.

Stand: beta/Demo, keine Gewährleistung für die technische oder fachliche Korrektheit oder für irgendeine Nutzbarkeit.
