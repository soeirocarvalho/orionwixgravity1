#!/usr/bin/env python3
"""
Title-Based Cluster Mapper
Map exact cluster assignments by matching force titles instead of IDs
"""
import pickle
import pandas as pd
import psycopg2
import os
from typing import Dict, List, Any

def load_exact_clusters_and_titles(pickle_path: str, parquet_path: str) -> Dict[str, Any]:
    """
    Load exact cluster assignments and match with titles from parquet
    """
    print(f"🔄 Loading cluster assignments and titles...")
    
    try:
        # Load pickle data
        with open(pickle_path, 'rb') as f:
            features = pickle.load(f)
        
        # Load parquet data for titles
        df = pd.read_parquet(parquet_path)
        
        cluster_labels = features.get('cluster_labels', [])
        titles = df['Title'].tolist()
        
        if len(cluster_labels) != len(titles):
            print(f"❌ Mismatch: {len(cluster_labels)} clusters vs {len(titles)} titles")
            return {}
        
        # Create title to cluster mapping
        title_to_cluster = {}
        for i, (title, cluster_id) in enumerate(zip(titles, cluster_labels)):
            if cluster_id is not None and isinstance(title, str) and title.strip():
                clean_title = title.strip()
                title_to_cluster[clean_title] = int(cluster_id)
        
        print(f"✅ Created title-based mapping for {len(title_to_cluster)} forces")
        return {
            'title_to_cluster': title_to_cluster,
            'features': features
        }
        
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        import traceback
        traceback.print_exc()
        return {}

def apply_title_based_clusters(title_mapping: Dict[str, int]):
    """
    Apply exact cluster assignments by matching titles
    """
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not found")
        return False
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Get default project ID
        cursor.execute("SELECT id FROM projects LIMIT 1")
        project_result = cursor.fetchone()
        if not project_result:
            print("❌ No project found in database")
            return False
        project_id = project_result[0]
        
        # Fixed cluster names (0-35)
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
        
        # Clear existing clusters and force cluster assignments
        print("🗑️ Clearing existing clusters...")
        cursor.execute("DELETE FROM clusters")
        cursor.execute("UPDATE driving_forces SET cluster_id = NULL, cluster_label = NULL")
        
        # Get all forces with their titles from database
        cursor.execute("SELECT id, title FROM driving_forces WHERE title IS NOT NULL")
        db_forces = cursor.fetchall()
        print(f"📊 Found {len(db_forces)} forces in database")
        
        # First pass: collect cluster assignments without updating database
        matched_forces = 0
        cluster_assignments = {}
        force_cluster_mapping = {}
        
        for force_id, db_title in db_forces:
            if db_title and db_title.strip() in title_mapping:
                cluster_id = title_mapping[db_title.strip()]
                
                # Track for cluster creation
                if cluster_id not in cluster_assignments:
                    cluster_assignments[cluster_id] = []
                cluster_assignments[cluster_id].append(force_id)
                
                # Track force to cluster mapping for later update
                force_cluster_mapping[force_id] = cluster_id
                matched_forces += 1
        
        print(f"✅ Matched {matched_forces} forces")
        print(f"📊 Found {len(cluster_assignments)} unique clusters")
        
        # Create cluster records first
        cluster_db_ids = {}
        for cluster_id, force_ids in cluster_assignments.items():
            cluster_name = CLUSTER_NAMES.get(cluster_id, f"Cluster {cluster_id}")
            cluster_size = len(force_ids)
            
            cursor.execute("""
                INSERT INTO clusters (label, force_ids, project_id, method, size, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                RETURNING id
            """, (cluster_name, force_ids, project_id, 'exact_title_match', cluster_size))
            
            cluster_db_id = cursor.fetchone()[0]
            cluster_db_ids[cluster_id] = cluster_db_id
            
            print(f"✅ Created cluster {cluster_id}: '{cluster_name}' with {cluster_size} forces")
        
        # Now update driving forces with proper cluster database IDs
        print("🔗 Updating driving forces with cluster assignments...")
        for force_id, cluster_id in force_cluster_mapping.items():
            cluster_db_id = cluster_db_ids[cluster_id]
            cluster_name = CLUSTER_NAMES.get(cluster_id, f"Cluster {cluster_id}")
            
            cursor.execute("""
                UPDATE driving_forces 
                SET cluster_id = %s, cluster_label = %s
                WHERE id = %s
            """, (cluster_db_id, cluster_name, force_id))
        
        print(f"✅ Updated {len(force_cluster_mapping)} forces with cluster assignments")
        
        # Commit all changes
        conn.commit()
        
        # Verify results
        cursor.execute("""
            SELECT cluster_label, COUNT(*) 
            FROM driving_forces 
            WHERE cluster_label IS NOT NULL
            GROUP BY cluster_label 
            ORDER BY COUNT(*) DESC
        """)
        
        results = cursor.fetchall()
        print(f"\n📊 Final cluster distribution:")
        total_clustered = 0
        for label, count in results:
            print(f"  {label}: {count} forces")
            total_clustered += count
        
        cursor.execute("SELECT COUNT(*) FROM driving_forces")
        total_forces = cursor.fetchone()[0]
        
        print(f"\n📈 Summary:")
        print(f"  Total forces: {total_forces}")
        print(f"  Clustered forces: {total_clustered}")
        print(f"  Unclustered forces: {total_forces - total_clustered}")
        print(f"  Match rate: {(total_clustered/total_forces)*100:.1f}%")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error applying title-based clusters: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """
    Main function to apply exact clusters using title matching
    """
    print("🎯 Title-Based Exact Cluster Mapper")
    print("=" * 50)
    
    # File paths
    pickle_path = "attached_assets/precomputed_features-2_1758018366314.pkl"
    parquet_path = "attached_assets/ORION_Scanning_DB_Updated_1758018366314.parquet"
    
    # Load title-to-cluster mapping
    data = load_exact_clusters_and_titles(pickle_path, parquet_path)
    if not data:
        print("❌ Failed to load cluster data")
        return False
    
    title_mapping = data['title_to_cluster']
    
    # Apply clusters using title matching
    success = apply_title_based_clusters(title_mapping)
    
    if success:
        print("\n🎉 Title-based exact cluster replication completed!")
        print("✅ NO recomputation performed")
        print("✅ Used exact precomputed assignments matched by title")
    else:
        print("\n❌ Failed to apply title-based cluster assignments")
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)