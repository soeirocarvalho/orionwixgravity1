#!/usr/bin/env python3
"""
Find Correct Mapping
Investigate how to properly align the pickle cluster data with the parquet force data
"""
import pickle
import pandas as pd
import psycopg2
import os

def investigate_alignment():
    """
    Try to find the correct way to align the cluster assignments
    """
    print("🔍 Investigating Correct Data Alignment")
    print("=" * 50)
    
    # Load the data
    pickle_path = "attached_assets/precomputed_features-2_1758018366314.pkl"
    parquet_path = "attached_assets/ORION_Scanning_DB_Updated_1758018366314.parquet"
    
    print("📂 Loading data...")
    with open(pickle_path, 'rb') as f:
        features = pickle.load(f)
    
    df = pd.read_parquet(parquet_path)
    
    cluster_labels = features.get('cluster_labels', [])
    
    # Check if there are other ways to match the data
    print(f"📊 Pickle features keys: {list(features.keys())}")
    
    # Check if there's a date or creation order that could help
    if 'Created' in df.columns:
        print(f"✅ Found 'Created' column in parquet")
        # Try sorting by creation date
        df_sorted_by_date = df.sort_values('Created')
        print(f"   Earliest: {df_sorted_by_date['Created'].iloc[0]}")
        print(f"   Latest: {df_sorted_by_date['Created'].iloc[-1]}")
        
        # Check first few titles when sorted by date
        print(f"   First 5 titles by creation date:")
        for i in range(5):
            print(f"     {i}: {df_sorted_by_date['Title'].iloc[i]}")
    
    # Check if the parquet has any other identifier fields
    if 'ID' in df.columns:
        # Let's see if the ID field has any pattern
        ids = df['ID'].tolist()
        print(f"\n🔢 Analyzing ID field:")
        print(f"   Range: {min(ids)} to {max(ids)}")
        print(f"   Is sequential: {ids == list(range(1, len(ids) + 1))}")
        
    # Try different sorting approaches to see if we can find the right alignment
    print(f"\n🔧 Testing different sorting approaches...")
    
    # Test 1: Sort by Title alphabetically
    df_alpha = df.sort_values('Title')
    print(f"📝 First 5 titles alphabetically:")
    for i in range(5):
        title = df_alpha['Title'].iloc[i]
        cluster_id = cluster_labels[i] if i < len(cluster_labels) else "N/A"
        print(f"   {title} -> Cluster {cluster_id}")
    
    # Test 2: Sort by original ID
    df_by_id = df.sort_values('ID')
    print(f"\n🔢 First 5 titles by ID:")
    for i in range(5):
        title = df_by_id['Title'].iloc[i]
        cluster_id = cluster_labels[i] if i < len(cluster_labels) else "N/A"
        print(f"   ID {df_by_id['ID'].iloc[i]}: {title} -> Cluster {cluster_id}")
    
    # Test 3: Original order (as loaded)
    print(f"\n📄 First 5 titles in original parquet order:")
    for i in range(5):
        title = df['Title'].iloc[i]
        cluster_id = cluster_labels[i] if i < len(cluster_labels) else "N/A"
        print(f"   Row {i}: {title} -> Cluster {cluster_id}")
    
    # Check the Name of Cluster column - this might give us hints
    if 'Name of Cluster' in df.columns:
        print(f"\n🏷️ Checking 'Name of Cluster' column:")
        unique_cluster_names = df['Name of Cluster'].unique()
        print(f"   Found {len(unique_cluster_names)} unique cluster names:")
        for name in sorted(unique_cluster_names)[:10]:  # Show first 10
            print(f"     {name}")
        
        # Check what cluster name "Social Welfare & Inequalities" has
        social_welfare_row = df[df['Title'] == 'Social Welfare & Inequalities']
        if len(social_welfare_row) > 0:
            original_cluster_name = social_welfare_row['Name of Cluster'].iloc[0]
            print(f"\n🎯 'Social Welfare & Inequalities' should be in: '{original_cluster_name}'")
            
            # Find what cluster ID this should map to
            CLUSTER_NAMES = {
                0: "AI & Automation", 1: "Healthcare Tech", 2: "Sustainability", 3: "Financial Tech",
                4: "Social Dynamics", 5: "Smart Cities", 6: "Energy Systems", 7: "Digital Transformation",
                8: "Education Innovation", 9: "Manufacturing 4.0", 10: "Space & Defense", 11: "Food & Agriculture",
                12: "Materials Science", 13: "Quantum Computing", 14: "Biotechnology", 15: "Cybersecurity",
                16: "Transportation", 17: "Climate Action", 18: "Governance", 19: "Future of Work",
                20: "Consumer Tech", 21: "Media Evolution", 22: "Supply Chain", 23: "Data Economy",
                24: "Health & Wellness", 25: "Urban Development", 26: "Resource Management", 27: "Scientific Research",
                28: "Risk & Resilience", 29: "Human Enhancement", 30: "Digital Society", 31: "Environmental Tech",
                32: "Infrastructure", 33: "Global Systems", 34: "Emerging Markets", 35: "Innovation Ecosystems"
            }
            
            # Find which cluster ID should match
            for cluster_id, cluster_name in CLUSTER_NAMES.items():
                if cluster_name.lower() in original_cluster_name.lower() or original_cluster_name.lower() in cluster_name.lower():
                    print(f"   Should probably be cluster {cluster_id}: {cluster_name}")
    
    return True

if __name__ == "__main__":
    investigate_alignment()