#!/usr/bin/env python3
"""
Debug Direct Mapping
Check why title matching failed
"""
import pickle
import pandas as pd
import psycopg2
import os

def debug_direct_mapping():
    """
    Debug why direct mapping failed to match titles
    """
    print("🔍 Debugging Direct Mapping")
    print("=" * 50)
    
    # Load files
    pickle_path = "attached_assets/precomputed_features-2_1758018366314.pkl"
    parquet_path = "attached_assets/ORION_Scanning_DB_Updated_1758018366314.parquet"
    
    with open(pickle_path, 'rb') as f:
        features = pickle.load(f)
    
    data = pd.read_parquet(parquet_path)
    data['Cluster'] = features['cluster_labels']
    
    print(f"✅ Parquet data: {len(data)} rows")
    
    # Connect to database
    database_url = os.getenv('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    cursor.execute("SELECT title FROM driving_forces WHERE title IS NOT NULL LIMIT 10")
    db_titles = [row[0] for row in cursor.fetchall()]
    
    parquet_titles = data['Title'].head(10).tolist()
    
    print(f"\n📊 Sample titles from database:")
    for i, title in enumerate(db_titles):
        print(f"  {i}: '{title}'")
    
    print(f"\n📊 Sample titles from parquet:")
    for i, title in enumerate(parquet_titles):
        print(f"  {i}: '{title}'")
    
    # Check if there are any exact matches
    cursor.execute("SELECT title FROM driving_forces WHERE title IS NOT NULL")
    all_db_titles = set(row[0] for row in cursor.fetchall())
    
    parquet_title_set = set(data['Title'].dropna())
    
    matches = all_db_titles.intersection(parquet_title_set)
    print(f"\n🔍 Title matching analysis:")
    print(f"  Database titles: {len(all_db_titles)}")
    print(f"  Parquet titles: {len(parquet_title_set)}")
    print(f"  Exact matches: {len(matches)}")
    
    if len(matches) > 0:
        print(f"\n✅ Sample matches:")
        for i, title in enumerate(list(matches)[:5]):
            print(f"  {i}: '{title}'")
    
    # Check if database has the specific test case
    test_title = "Social Welfare & Inequalities"
    cursor.execute("SELECT title FROM driving_forces WHERE title LIKE %s", (f"%{test_title}%",))
    db_social_welfare = cursor.fetchall()
    
    parquet_social_welfare = data[data['Title'].str.contains('Social Welfare', na=False)]
    
    print(f"\n🎯 Test case analysis:")
    print(f"  Database 'Social Welfare': {len(db_social_welfare)} matches")
    for row in db_social_welfare:
        print(f"    '{row[0]}'")
    
    print(f"  Parquet 'Social Welfare': {len(parquet_social_welfare)} matches")
    for idx, row in parquet_social_welfare.iterrows():
        print(f"    Row {idx}: '{row['Title']}' -> Cluster {row['Cluster']}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    debug_direct_mapping()