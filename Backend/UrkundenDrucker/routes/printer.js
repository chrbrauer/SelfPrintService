var express = require('express');
var router = express.Router();

var ctrl_print =  require('../controller/printer.controller')

/* GET home page. */
router.get('/searchByCompetion', ctrl_print.searchCompetition)
router.get('/searchByCompetitor', ctrl_print.searchByCompetitor)
router.get('/loadCertificate', ctrl_print.loadCertificate)
router.get('/loadCertificateCompetitor', ctrl_print.loadCertificateCompetitior)
router.get('/loadCertificateSLG', ctrl_print.loadCertificateSLG)
router.get('/loadCertificateSLG', ctrl_print.loadCertificateSLG)
router.put('/setCertificateStatus', ctrl_print.SetCertificateStatus)
router.get('/getCompetition', ctrl_print.getAllCompetition)
router.get('/getCompetitors', ctrl_print.getAllCompetitors)
router.get('/findCompetitor', ctrl_print.findCompetitor)
router.get('/findCompetition', ctrl_print.findCompetition)
router.post('/uploadCertificate', ctrl_print.UploadCertificate)

module.exports = router;
