# import csv

# Open the CSV file
# data = []
# with open('data.csv', 'r') as file:
#     # Create a CSV reader object
#     reader = csv.reader(file)
#     # Iterate over each row in the CSV file
#     next(reader)  # Skip the header row
#     max_length = 0
#     for row in reader:
#         # Process the data in each row
#         if len(row) < 4: continue
#         tsne_data = row[2].split()
#         tsne_data[0] = tsne_data[0][1:-1]
#         tsne_data[1] = tsne_data[1][:-1]
#         data.append(dict({ 
#             "x": float(tsne_data[0]), 
#             "y": float(tsne_data[1]), 
#             "z": float(row[3]), 
#             "image": "images/"+row[0]+".jpg", 
#             "caption": row[1],
#             "caption_length": len(row[1]),
#         }))
#         max_length = max(max_length, len(row[1]))


import json
from PIL import Image
import fasttext

with open("public/data-clip.json", 'r') as readfile:
    data = json.load(readfile)


# Load the pre-trained language identification model
model = fasttext.load_model('lid.176.bin')

for i, item in enumerate(data):
    image_path = item["image"]
    image = Image.open("public/"+image_path)
    w, h = image.size
    data[i]["smaller_dim"] = min(w,h)
    data[i]["aspect_ratio"] = w/h

    # Predict the language of the caption
    caption = item["caption"].replace("\n"," ")
    prediction = model.predict(caption)
    language = prediction[0][0].split("__")[-1]
    if language == 'en':
        data[i]["is_english"] = 1
    else:
        data[i]["is_english"] = 0

with open("public/data-clip-new.json", 'w') as outfile:
    json.dump(data, outfile)