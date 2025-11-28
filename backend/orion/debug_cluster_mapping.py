#!/usr/bin/env python3
"""
Debug Cluster Mapping
Investigate why cluster assignments are incorrect
"""
import pickle
import pandas as pd
import psycopg2
import os

def debug_mapping():
    """
    Debug the cluster mapping to find the issue
    """
    print("🔍 Debugging Cluster Mapping")
    print("=" * 50)
    
    # Load the data
    pickle_path = "attached_assets/precomputed_features-2_1758018366314.pkl"
    parquet_path = "attached_assets/ORION_Scanning_DB_Updated_1758018366314.parquet"
    
    print("📂 Loading data...")
    with open(pickle_path, 'rb') as f:
        features = pickle.load(f)
    
    df = pd.read_parquet(parquet_path)
    
    cluster_labels = features.get('cluster_labels', [])
    
    print(f"✅ Pickle file: {len(cluster_labels)} cluster assignments")
    print(f"✅ Parquet file: {len(df)} rows")
    
    # Check if there are IDs in the parquet file that could match
    print(f"\n📊 Parquet columns: {list(df.columns)}")
    
    if 'ID' in df.columns:
        print(f"✅ Found ID column in parquet")
        print(f"   First 5 IDs: {df['ID'].head().tolist()}")
    
    # Check titles
    if 'Title' in df.columns:
        print(f"✅ Found Title column in parquet")
        print(f"   First 5 titles: {df['Title'].head().tolist()}")
    
    # Look for the problematic "Social Welfare & Inequalities" force
    social_welfare_rows = df[df['Title'].str.contains('Social Welfare', na=False)]
    print(f"\n🔍 Found {len(social_welfare_rows)} rows with 'Social Welfare':")
    for idx, row in social_welfare_rows.iterrows():
        cluster_id = cluster_labels[idx] if idx < len(cluster_labels) else "N/A"
        print(f"   Row {idx}: '{row['Title']}' -> Cluster {cluster_id}")
    
    # Check what cluster ID 10 (Space & Defense) should contain
    space_defense_indices = [i for i, cluster_id in enumerate(cluster_labels) if cluster_id == 10]
    print(f"\n🚀 Cluster 10 (Space & Defense) has {len(space_defense_indices)} forces:")
    for i in space_defense_indices[:5]:  # Show first 5
        if i < len(df):
            title = df.iloc[i]['Title']
            print(f"   Index {i}: '{title}'")
    
    # Check database connection to see current assignments
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        print(f"\n💾 Checking database...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Find the problematic force in database
        cursor.execute("SELECT id, title, cluster_label FROM driving_forces WHERE title LIKE %s", ('%Social Welfare%',))
        db_results = cursor.fetchall()
        
        print(f"🔍 Database forces with 'Social Welfare': {len(db_results)}")
        for force_id, title, cluster_label in db_results:
            print(f"   '{title}' -> {cluster_label}")
        
        cursor.close()
        conn.close()
    
    # Try to find the correct mapping approach
    print(f"\n🔧 Investigating mapping approach...")
    
    # Check if there's another field that could be used for mapping
    # Look for any unique identifiers
    if 'ID' in df.columns:
        # Check if IDs in parquet might correspond to some other data
        ids = df['ID'].tolist()
        print(f"   ID range: {min(ids)} to {max(ids)}")
        print(f"   Sample IDs: {ids[:10]}")
    
    return True

if __name__ == "__main__":
    debug_mapping()