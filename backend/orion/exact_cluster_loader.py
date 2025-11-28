#!/usr/bin/env python3
"""
EXACT Cluster Loader - NO RECOMPUTATION
Load the exact precomputed cluster assignments from pickle file
and apply them directly to the driving forces data.
"""
import pickle
import pandas as pd
import psycopg2
import os
from typing import Dict, List, Any

def load_exact_clusters(pickle_path: str) -> Dict[str, Any]:
    """
    Load EXACT cluster assignments from pickle file - NO recomputation
    """
    print(f"🔄 Loading EXACT cluster assignments from: {pickle_path}")
    
    try:
        with open(pickle_path, 'rb') as f:
            features = pickle.load(f)
        
        print(f"✅ Loaded pickle file successfully")
        print(f"✅ Available keys: {list(features.keys())}")
        
        # Check what data we have
        if 'cluster_labels' in features:
            cluster_labels = features['cluster_labels']
            print(f"✅ Found {len(cluster_labels)} cluster assignments")
            print(f"✅ Cluster range: {min(cluster_labels)} to {max(cluster_labels)}")
            print(f"✅ Unique clusters: {len(set(cluster_labels))}")
        
        if 'id' in features:
            ids = features['id']
            print(f"✅ Found {len(ids)} force IDs")
        
        return features
        
    except Exception as e:
        print(f"❌ Error loading pickle file: {e}")
        return {}

def load_parquet_data(parquet_path: str) -> pd.DataFrame:
    """
    Load the driving forces data from parquet file
    """
    print(f"🔄 Loading driving forces data from: {parquet_path}")
    
    try:
        df = pd.read_parquet(parquet_path)
        print(f"✅ Loaded {len(df)} driving forces")
        print(f"✅ Columns: {list(df.columns)}")
        return df
        
    except Exception as e:
        print(f"❌ Error loading parquet file: {e}")
        return pd.DataFrame()

def apply_exact_clusters_to_database(features: Dict[str, Any], parquet_df: pd.DataFrame = None):
    """
    Apply the EXACT cluster assignments to the database
    NO recomputation - just direct mapping
    """
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not found")
        return False
    
    try:
        # Extract the essential data
        cluster_labels = features.get('cluster_labels', [])
        
        if not cluster_labels:
            print("❌ Missing cluster_labels in features")
            return False
        
        if parquet_df is None or parquet_df.empty:
            print("❌ Missing parquet data with IDs")
            return False
        
        print(f"📊 Processing {len(cluster_labels)} exact cluster assignments...")
        
        # Get the IDs from parquet file (should be same order as cluster_labels)
        if 'ID' not in parquet_df.columns:
            print("❌ Missing ID column in parquet data")
            return False
        
        ids = parquet_df['ID'].tolist()
        
        if len(ids) != len(cluster_labels):
            print(f"❌ Mismatch: {len(ids)} IDs vs {len(cluster_labels)} cluster labels")
            return False
        
        # Create force ID to cluster mapping
        force_to_cluster = {}
        for i, (force_id, cluster_id) in enumerate(zip(ids, cluster_labels)):
            if cluster_id is not None:
                force_to_cluster[str(force_id)] = int(cluster_id)
        
        print(f"✅ Created exact mapping for {len(force_to_cluster)} forces")
        
        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Get the default project ID
        cursor.execute("SELECT id FROM projects LIMIT 1")
        project_result = cursor.fetchone()
        if not project_result:
            print("❌ No project found in database")
            return False
        project_id = project_result[0]
        print(f"✅ Using project ID: {project_id}")
        
        # Create the 36 fixed cluster names (IDs 0-35)
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
        
        # Clear existing clusters first
        print("🗑️ Clearing existing clusters...")
        cursor.execute("DELETE FROM clusters")
        
        # Group forces by cluster
        cluster_to_forces = {}
        for force_id, cluster_id in force_to_cluster.items():
            if cluster_id not in cluster_to_forces:
                cluster_to_forces[cluster_id] = []
            cluster_to_forces[cluster_id].append(force_id)
        
        print(f"📊 Found {len(cluster_to_forces)} unique clusters")
        
        # Create new clusters with exact assignments
        for cluster_id, force_ids in cluster_to_forces.items():
            cluster_name = CLUSTER_NAMES.get(cluster_id, f"Cluster {cluster_id}")
            
            # Insert cluster with all required fields
            cluster_size = len(force_ids)
            cursor.execute("""
                INSERT INTO clusters (label, force_ids, project_id, method, size, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                RETURNING id
            """, (cluster_name, force_ids, project_id, 'fixed_precomputed', cluster_size))
            
            cluster_db_id = cursor.fetchone()[0]
            
            # Update driving forces with cluster info
            cursor.execute("""
                UPDATE driving_forces 
                SET cluster_id = %s, cluster_label = %s
                WHERE id = ANY(%s)
            """, (str(cluster_db_id), cluster_name, force_ids))
            
            print(f"✅ Created cluster {cluster_id}: '{cluster_name}' with {len(force_ids)} forces")
        
        # Commit changes
        conn.commit()
        print(f"✅ Successfully applied exact cluster assignments to database")
        
        # Verify the results
        cursor.execute("""
            SELECT cluster_label, COUNT(*) 
            FROM driving_forces 
            WHERE cluster_label IS NOT NULL
            GROUP BY cluster_label 
            ORDER BY COUNT(*) DESC
        """)
        
        results = cursor.fetchall()
        print(f"\n📊 Final cluster distribution (top 10):")
        for i, (label, count) in enumerate(results[:10]):
            print(f"  {i+1}. {label}: {count} forces")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error applying clusters to database: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """
    Main function to load exact clusters and apply to database
    """
    print("🎯 EXACT Cluster Loader - NO RECOMPUTATION")
    print("=" * 50)
    
    # File paths
    pickle_path = "attached_assets/precomputed_features-2_1758018366314.pkl"
    parquet_path = "attached_assets/ORION_Scanning_DB_Updated_1758018366314.parquet"
    
    # Load exact cluster assignments
    features = load_exact_clusters(pickle_path)
    if not features:
        print("❌ Failed to load cluster features")
        return False
    
    # Load parquet data (optional, for reference)
    parquet_df = load_parquet_data(parquet_path)
    
    # Apply exact assignments to database
    success = apply_exact_clusters_to_database(features, parquet_df)
    
    if success:
        print("\n🎉 EXACT cluster replication completed successfully!")
        print("✅ NO recomputation performed")
        print("✅ Used exact precomputed assignments")
    else:
        print("\n❌ Failed to apply exact cluster assignments")
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)