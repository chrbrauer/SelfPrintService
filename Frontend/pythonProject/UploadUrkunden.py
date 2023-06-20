from pikepdf import Pdf
import os
import PyPDF2
import re
import requests


def findCompetitor(name, slg):
    split = name.split(' ')
    request = 'http://localhost:3000/printer/findCompetitor?fn=' + split[0] + '&sn=' + split[1] + '&slg=' + slg
    res = requests.get(request).json()
    if res['status']:
        return res['content'][0]['id']
    else:
        return findCompetitor(name , slg)


def findCompetition(name, datum):
    split = datum.split('.')
    new_date = split[2] + '-' + split[1] + '-' + split[0]
    request = 'http://localhost:3000/printer/findCompetition?name=' + name + '&datum=' + new_date
    res = requests.get(request).json()
    if res['status']:
        return res['content'][0]['id']
    else:
        return findCompetition(name, datum)


def extractPDF(filename):
    # Pfad zur PDF-Datei
    pdf_path = output_directory + filename

    # PDF-Datei öffnen
    with open(pdf_path, 'rb') as file:
        # PDF-Reader erstellen
        reader = PyPDF2.PdfReader(file)
        output_pdf = PyPDF2.PdfWriter()

        # Seite laden
        page = reader.pages[0]

        # Text extrahieren
        text = page.extract_text()
        result = text.split('\n')
        wettkampf = result[0]
        Disziplin = result[2]
        Name = result[4]
        SLG = result[5]
        Platzierung = result[7][0]
        pattern = r"\d{1,2}\.\d{1,2}\.\d{4}"
        match = re.search(pattern, result[9])
        Datum = match.group(0)

        # Ausgabe des extrahierten Texts
        sh = findCompetitor(Name, SLG)
        comp = findCompetition(wettkampf, Datum)
        file = Datum + "_" + Disziplin + "_" + str(sh) + "_" + str(comp)+".pdf"
        upload = requests.post('http://localhost:3000/printer/uploadCertificate',
                               {"sh": sh, "comp": comp, "disziplin": Disziplin, "platz": Platzierung, "file": file})
        finished = Pdf.open(pdf_path)
        finished.save(finished_directory+file)
        print(upload.json())


if __name__ == '__main__':
    output_directory = os.getcwd() + '/results/'
    finished_directory = os.getcwd() + '/finished/'

    pdf = Pdf.open('Urkunden_EPP-Rifle.pdf')
    for n, page in enumerate(pdf.pages):
        dst = Pdf.new()
        dst.pages.append(page)
        dst.save(output_directory + f'{n:02d}.pdf')

    file_list = os.listdir(output_directory)

    # Dateinamen ausgeben
    for file_name in file_list:
        extractPDF(file_name)
