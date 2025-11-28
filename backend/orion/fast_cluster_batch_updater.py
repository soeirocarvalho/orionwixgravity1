#!/usr/bin/env python3
"""
Fast Cluster Batch Updater
Efficiently apply exact cluster assignments using batch updates
"""
import pickle
import pandas as pd
import psycopg2
import psycopg2.extras
import os
from typing import Dict, List, Any

def main():
    """
    Fast batch update of cluster assignments
    """
    print("🚀 Fast Cluster Batch Updater")
    print("=" * 50)
    
    # File paths
    pickle_path = "attached_assets/precomputed_features-2_1758018366314.pkl"
    parquet_path = "attached_assets/ORION_Scanning_DB_Updated_1758018366314.parquet"
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not found")
        return False
    
    try:
        # Load data quickly
        print("📂 Loading data...")
        with open(pickle_path, 'rb') as f:
            features = pickle.load(f)
        
        df = pd.read_parquet(parquet_path)
        
        cluster_labels = features.get('cluster_labels', [])
        titles = df['Title'].tolist()
        
        # Create title to cluster mapping
        title_to_cluster = {}
        for i, (title, cluster_id) in enumerate(zip(titles, cluster_labels)):
            if cluster_id is not None and isinstance(title, str) and title.strip():
                title_to_cluster[title.strip()] = int(cluster_id)
        
        print(f"✅ Created mapping for {len(title_to_cluster)} forces")
        
        # Fixed cluster names
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
        
        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Get project ID
        cursor.execute("SELECT id FROM projects LIMIT 1")
        project_id = cursor.fetchone()[0]
        
        # Clear existing clusters
        print("🗑️ Clearing existing clusters...")
        cursor.execute("DELETE FROM clusters")
        cursor.execute("UPDATE driving_forces SET cluster_id = NULL, cluster_label = NULL")
        
        # Get all forces from database
        cursor.execute("SELECT id, title FROM driving_forces WHERE title IS NOT NULL")
        db_forces = cursor.fetchall()
        print(f"📊 Processing {len(db_forces)} forces from database")
        
        # Collect cluster assignments
        cluster_groups = {}
        update_data = []
        
        for force_id, db_title in db_forces:
            if db_title and db_title.strip() in title_to_cluster:
                cluster_id = title_to_cluster[db_title.strip()]
                cluster_name = CLUSTER_NAMES.get(cluster_id, f"Cluster {cluster_id}")
                
                # Track for cluster creation
                if cluster_id not in cluster_groups:
                    cluster_groups[cluster_id] = []
                cluster_groups[cluster_id].append(force_id)
                
                # Prepare batch update data
                update_data.append((cluster_name, force_id))
        
        print(f"✅ Matched {len(update_data)} forces to {len(cluster_groups)} clusters")
        
        # Create clusters in batch
        print("🏗️ Creating clusters...")
        cluster_id_map = {}
        
        for cluster_id, force_ids in cluster_groups.items():
            cluster_name = CLUSTER_NAMES.get(cluster_id, f"Cluster {cluster_id}")
            cluster_size = len(force_ids)
            
            cursor.execute("""
                INSERT INTO clusters (label, force_ids, project_id, method, size, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                RETURNING id
            """, (cluster_name, force_ids, project_id, 'exact_batch', cluster_size))
            
            cluster_db_id = cursor.fetchone()[0]
            cluster_id_map[cluster_name] = cluster_db_id
            
            print(f"  ✅ {cluster_name}: {cluster_size} forces")
        
        # Batch update forces with cluster assignments
        print("🔄 Batch updating driving forces...")
        
        batch_updates = []
        for cluster_label, force_id in update_data:
            cluster_db_id = cluster_id_map[cluster_label]
            batch_updates.append((cluster_db_id, cluster_label, force_id))
        
        # Execute batch update using execute_values for speed
        psycopg2.extras.execute_values(
            cursor,
            """
            UPDATE driving_forces 
            SET cluster_id = data.cluster_id, cluster_label = data.cluster_label
            FROM (VALUES %s) AS data(cluster_id, cluster_label, force_id)
            WHERE driving_forces.id = data.force_id
            """,
            batch_updates,
            template=None,
            page_size=1000
        )
        
        print(f"✅ Batch updated {len(batch_updates)} forces")
        
        # Commit everything
        conn.commit()
        
        # Verify results
        cursor.execute("SELECT cluster_label, COUNT(*) FROM driving_forces WHERE cluster_label IS NOT NULL GROUP BY cluster_label ORDER BY COUNT(*) DESC LIMIT 10")
        results = cursor.fetchall()
        
        print(f"\n📊 Top 10 clusters:")
        total_clustered = 0
        for label, count in results:
            print(f"  {label}: {count} forces")
            total_clustered += count
        
        cursor.execute("SELECT COUNT(*) FROM driving_forces")
        total_forces = cursor.fetchone()[0]
        
        print(f"\n🎉 Success!")
        print(f"  Total forces: {total_forces}")
        print(f"  Clustered forces: {total_clustered}")
        print(f"  Match rate: {(total_clustered/total_forces)*100:.1f}%")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)