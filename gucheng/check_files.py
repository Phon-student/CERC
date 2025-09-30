import pandas as pd
import os

df = pd.read_excel('SportMeta.xlsx')
print('Checking file ID mapping:')
print(f'Total entries in SportMeta: {len(df)}')

for i in range(5):
    row = df.iloc[i]
    file_id = int(row['File ID'])
    activity = row['Activity']
    filepath = f'Data/BMI270/Ex1/DI_{file_id:05d}.CSV'
    exists = os.path.exists(filepath)
    print(f'ID {file_id}: {activity} -> {filepath} (exists: {exists})')
