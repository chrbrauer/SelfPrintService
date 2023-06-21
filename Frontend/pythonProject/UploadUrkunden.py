from pikepdf import Pdf
import os
import PyPDF2
import re
import requests


def findCompetitor(name, slg):
    split = name.split(' ')
    request = 'http://85.214.68.249:3000/printer/findCompetitor?fn=' + split[0] + '&sn=' + split[1] + '&slg=' + slg
    res = requests.get(request).json()
    if res['status']:
        return res['content'][0]['id']
    else:
        return findCompetitor(name , slg)


def findCompetition(name, datum):
    split = datum.split('.')
    new_date = split[2] + '-' + split[1] + '-' + split[0]
    request = 'http://85.214.68.249:3000/printer/findCompetition?name=' + name + '&datum=' + new_date
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
        #print(result, len(result))
        wettkampf = result[0]
        Disziplin = result[2]
        Name = result[4]
        pattern = r"\d{1,2}\.\d{1,2}\.\d{4}"
        match = re.search(pattern, result[len(result) - 1])
        Datum = match.group(0)
        if len(result) == 10:
            SLG = result[5]
            Platzierung = re.findall(r'\d+[.]',result[7])[0]
        elif len(result) == 9:
            if result.__contains__('Gesamt'):
                SLG = "Einzelmitglied"
                Platzierung = re.findall(r'\d+[.]', result[6])[0]
            else:
                SLG = result[5]
                Platzierung = re.findall(r'\d+[.]', result[7])[0]

        else:
            print(result)

        # Ausgabe des extrahierten Texts
        sh = findCompetitor(Name, SLG)
        comp = findCompetition(wettkampf, Datum)
        file = Datum + "_" + Disziplin + "_" + str(sh) + "_" + str(comp)+".pdf"
        upload = requests.post('http://85.214.68.249:3000/printer/uploadCertificate',
                               {"sh": sh, "comp": comp, "disziplin": Disziplin, "platz": Platzierung, "file": file})
        finished = Pdf.open(pdf_path)
        finished.save(finished_directory+file)


if __name__ == '__main__':


    output_directory = os.getcwd() + '/results/'
    finished_directory = os.getcwd() + '/finished/'
    source_directory = os.getcwd() + '/source/'

    src_list = os.listdir(source_directory)
    cnt = 1
    for src_name in src_list:
        print(src_name)
        src_path = source_directory + src_name

        pdf = Pdf.open(src_path)
        for n, page in enumerate(pdf.pages):
            dst = Pdf.new()
            dst.pages.append(page)
            dst.save(output_directory + f'{n:02d}.pdf')

        file_list = os.listdir(output_directory)

        # Dateinamen ausgeben
        for file_name in file_list:
            extractPDF(file_name)
            os.remove(output_directory + file_name)

        print("Disziplin ",cnt,"/",len(src_list),' hochgeladen')
        cnt += 1

