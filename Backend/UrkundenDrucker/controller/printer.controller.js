var _ = require('lodash');
const fs = require('fs');
const fsp = require('fs/promises');
var os = require('os');
var child_process = require('child_process');
var request = require('request');
const e = require("express");
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost', user: 'root', password: 'password', charset: 'utf8mb4'
});


connection.connect((err) => {
    if (err) throw err;
    console.log('Verbindung zur MySQL-Datenbank hergestellt!');

    // Erstelle die Datenbank
    connection.query('CREATE DATABASE IF NOT EXISTS CertificateDatabase', (err) => {
        if (err) throw err;
        console.log('Datenbank "meineDatenbank" erstellt!');

        // Wähle die Datenbank aus
        connection.query('USE CertificateDatabase', (err) => {
            if (err) throw err;
            console.log('Benutze Datenbank "CertificateDatabase"');

            // Erstelle Tabellen oder führe andere erforderliche Schritte aus
            // Erstelle die Tabelle für Schützen
            const createSchuetzenTableQuery = `
CREATE TABLE IF NOT EXISTS schuetzen (
    id INT PRIMARY KEY AUTO_INCREMENT,
    forname VARCHAR(255) NOT NULL,
    surename VARCHAR(255) NOT NULL,
    SLG VARCHAR(255) NOT NULL
);`;
            connection.query(createSchuetzenTableQuery, (err) => {
                if (err) throw err;
                console.log('Tabelle "schuetzen" erstellt!');
            });

// Erstelle die Tabelle für Wettkämpfe
            const createWettkaempfeTableQuery = `
  CREATE TABLE IF NOT EXISTS wettkaempfe (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    datum DATE
  )
`;
            connection.query(createWettkaempfeTableQuery, (err) => {
                if (err) throw err;
                console.log('Tabelle "wettkaempfe" erstellt!');
            });

// Erstelle die Tabelle für Urkunden
            const createUrkundenTableQuery = `
  CREATE TABLE IF NOT EXISTS urkunden (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schuetze_id INT,
    wettkaempf_id INT,
    disziplin VARCHAR(255),
    filename VARCHAR(255),
    platz INT,
    printed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (schuetze_id) REFERENCES schuetzen(id),
    FOREIGN KEY (wettkaempf_id) REFERENCES wettkaempfe(id)
  )
`;
            connection.query(createUrkundenTableQuery, (err) => {
                if (err) throw err;
                console.log('Tabelle "urkunden" erstellt!');
            });
        });
    });
});


module.exports.getAllCompetition = (req, res) => {
    const query = 'SELECT * from wettkaempfe'
    connection.query(query, (error, results) => {
        if (error) throw error;

        return res.status(200).json({status: true, content: results})
    });
}

module.exports.findCompetition = (req, res) => {
    const query = "SELECT id from wettkaempfe WHERE name = ? AND datum = ?"
    connection.query(query, [converter(req.query['name']), converter(req.query['datum'])], (error, results) => {
        if (error) throw error;
        if(results.length === 0){
            const query2 = "INSERT INTO wettkaempfe(name, datum) VALUES (?,?)"
            connection.query(query2,[converter(req.query['name']), converter(req.query['datum'])], (error2, results2) => {
                if (error2) throw error2;
                return res.status(200).json({status: false, content: results2})
            });
        }else {
            return res.status(200).json({status: true, content: results})
        }
    });
}

module.exports.findCompetitor = (req, res) => {
    const query = "SELECT id from schuetzen WHERE forname = ? AND surename = ? AND SLG = ?"
    connection.query(query, [converter(req.query['fn']), converter(req.query['sn']), converter(req.query['slg'])], (error, results) => {
        if (error) throw error;
        if(results.length === 0){
            const query2 = "INSERT INTO schuetzen(forname, surename, SLG) VALUES (?,?,?)"
            connection.query(query2,[converter(req.query['fn']), converter(req.query['sn']), converter(req.query['slg'])], (error2, results2) => {
                if (error2) throw error2;
                return res.status(200).json({status: false, content: results2})
            });
        }else {
            return res.status(200).json({status: true, content: results})
        }
    });
}

function converter(word) {
    word = word.replace('ä','Ã¤');
    word = word.replace('ö','Ã¶');
    word = word.replace('ü','Ã¼');
    word = word.replace('ß','ÃŸ');
    word = word.replace('Ä','Ã„');
    word = word.replace('Ö','Ã–');
    word = word.replace('Ü','Ãœ');
    return word
}

module.exports.getAllCompetitors = (req, res) => {
    const query = 'SELECT * from schuetzen'
    connection.query(query, (error, results) => {
        if (error) throw error;
        return res.status(200).json({status: true, content: results})
    });
}

module.exports.searchCompetition = (req, res) => {
    const query = 'SELECT schuetzen.id, schuetzen.forname, schuetzen.surename from schuetzen JOIN urkunden ON schuetzen.id = urkunden.schuetze_id WHERE wettkaempf_id = ?'
    connection.query(query, [req.query['id']], (error, results) => {
        if (error) throw error;
        return res.status(200).json({status: true, content: results})
    });

}

module.exports.searchByCompetitor = (req, res) => {
    const query = 'SELECT wettkaempfe.id, wettkaempfe.name, wettkaempfe.datum from wettkaempfe JOIN urkunden ON wettkaempfe.id = urkunden.wettkaempf_id WHERE urkunden.schuetze_id = ?'
    connection.query(query, [req.query['id']], (error, results) => {
        if (error) throw error;
        return res.status(200).json({status: true, content: results})
    });
}

module.exports.loadCertificate = (req, res) => {
    const query = 'SELECT wettkaempf_id, schuetze_id, id, disziplin, filename, platz, printed from urkunden WHERE schuetze_id = ? AND wettkaempf_id = ?'
    connection.query(query, [req.query['sh'], req.query['comp']], (error, results) => {
        if (error) throw error;
        return res.status(200).json({status: true, content: results})
    });
}

module.exports.loadCertificateCompetitior = (req, res) => {
    const query = 'SELECT wettkaempf_id, schuetze_id, id, disziplin, filename, platz, printed from urkunden WHERE schuetze_id = ?'
    connection.query(query, [req.query['sh']], (error, results) => {
        if (error) throw error;
        return res.status(200).json({status: true, content: results})
    });
}

module.exports.SetCertificateStatus = (req, res) => {
    const query = 'UPDATE urkunden SET printed = 1 WHERE id = ?';
    connection.query(query, [req.query['id']], (error, results) => {
        if (error) throw error;
        return res.status(200).json({status: true, content: results})
    });
}

module.exports.UploadCertificate = (req, res) => {
    const query = 'INSERT INTO urkunden(schuetze_id, wettkaempf_id, disziplin, platz, filename) VALUES (?,?,?,?,?)';
    connection.query(query, [req.body.sh ,req.body.comp, req.body.disziplin,req.body.platz,req.body.file], (error, results) => {
        if (error) throw error;
        return res.status(200).json({status: true, content: results})
    });
}

