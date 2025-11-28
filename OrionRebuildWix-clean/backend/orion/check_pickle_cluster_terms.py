#!/usr/bin/env python3
"""
Check what cluster terms are actually in the pickle file
"""
import pickle

def check_pickle_terms():
    pickle_path = "attached_assets/precomputed_features-2_1758018366314.pkl"
    
    with open(pickle_path, 'rb') as f:
        features = pickle.load(f)
    
    print("🔍 Keys in pickle file:")
    for key in features.keys():
        print(f"  {key}")
    
    if 'cluster_titles' in features:
        print(f"\n✅ Found cluster_titles with {len(features['cluster_titles'])} entries")
        for i, title in features['cluster_titles'].items():
            print(f"  Cluster {i}: {title}")
    else:
        print("\n❌ No 'cluster_titles' key found")
        
        # Check if cluster labels give us any hint about terms
        if 'cluster_labels' in features:
            unique_clusters = set(features['cluster_labels'])
            print(f"\n📊 Found {len(unique_clusters)} unique cluster IDs: {sorted(unique_clusters)}")

if __name__ == "__main__":
    check_pickle_terms()