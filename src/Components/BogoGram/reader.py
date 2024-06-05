import os
import csv

script_dir = os.path.dirname(os.path.realpath(__file__))

filename = "words.csv"

filepath = os.path.join(script_dir, filename)
wordsArray = []

with open(filepath, 'r', newline='') as source:
    csvReader = csv.reader(source)

    for row in csvReader:
        wordsArray.append(f"\"{row[0]}\"")
    
destinationpath = os.path.join(script_dir, filename)

with open("wordsArray.csv", 'w') as output:
    csvWriter = csv.writer(output)
    csvWriter.writerow(wordsArray)
