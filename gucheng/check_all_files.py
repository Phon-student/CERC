import pandas as pd
import os

df = pd.read_excel('SportMeta.xlsx')
missing_files = []
existing_files = []

for _, row in df.iterrows():
    file_id = int(row['File ID'])
    activity = row['Activity']
    filepath = f'Data/BMI270/Ex1/DI_{file_id:05d}.CSV'
    if os.path.exists(filepath):
        existing_files.append((file_id, activity))
    else:
        missing_files.append((file_id, activity))

print(f'Total files in SportMeta: {len(df)}')
print(f'Existing files: {len(existing_files)}')
print(f'Missing files: {len(missing_files)}')

if missing_files:
    print('\nMissing files:')
    for fid, activity in missing_files[:10]:  # Show first 10 missing
        print(f'  ID {fid}: {activity}')

print('\nActivity distribution in existing files:')
activities = [activity for _, activity in existing_files]
for activity in set(activities):
    count = activities.count(activity)
    print(f'  {activity}: {count} files')
