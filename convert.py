import csv

# Open the CSV file
data = []
with open('bertdata.csv', 'r') as file:
    # Create a CSV reader object
    reader = csv.reader(file)
    # Iterate over each row in the CSV file
    next(reader)  # Skip the header row
    for row in reader:
        # Process the data in each row
        if len(row) < 4: continue
        tsne_data = row[2].split()
        tsne_data[0] = tsne_data[0][1:-1]
        tsne_data[1] = tsne_data[1][:-1]
        data.append(dict({ 
            "x": float(tsne_data[0]), 
            "y": float(tsne_data[1]), 
            "z": float(row[3]), 
            "image": "images/"+row[0]+".jpg", 
            "caption": row[1]}))

import json

with open("datacomp-bert.json", 'w') as outfile:
    json.dump(data, outfile)