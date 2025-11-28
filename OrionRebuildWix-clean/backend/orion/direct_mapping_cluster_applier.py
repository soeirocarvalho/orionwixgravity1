#!/usr/bin/env python3
"""
Direct Mapping Cluster Applier
Apply exact cluster assignments using direct 1:1 correspondence between files
NO processing needed - just direct mapping!
"""
import pickle
import pandas as pd
import psycopg2
import psycopg2.extras
import os

def main():
    """
    Apply exact cluster assignments using direct 1:1 mapping
    """
    print("🎯 Direct Mapping Cluster Applier")
    print("=" * 50)
    
    # File paths
    pickle_path = "attached_assets/precomputed_features-2_1758018366314.pkl"
    parquet_path = "attached_assets/ORION_Scanning_DB_Updated_1758018366314.parquet"
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not found")
        return False
    
    try:
        # Load both files
        print("📂 Loading data with direct correspondence...")
        with open(pickle_path, 'rb') as f:
            features = pickle.load(f)
        
        data = pd.read_parquet(parquet_path)
        
        cluster_labels = features.get('cluster_labels', [])
        cluster_titles = features.get('cluster_titles', {})
        
        print(f"✅ Data rows: {len(data)}")
        print(f"✅ Cluster labels: {len(cluster_labels)}")
        print(f"✅ Cluster titles: {len(cluster_titles)} exact terms from original ORION")
        
        # Verify perfect correspondence
        if len(data) != len(cluster_labels):
            print(f"❌ Length mismatch! Data: {len(data)}, Clusters: {len(cluster_labels)}")
            return False
        
        # Direct 1:1 mapping - NO processing needed!
        print("🔗 Applying direct 1:1 mapping...")
        data['Cluster'] = features['cluster_labels']
        
        print("✅ Clusters applied via direct mapping - NO computation!")
        print("✅ Using EXACT cluster terms from precomputed features")
        
        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Get project ID
        cursor.execute("SELECT id FROM projects LIMIT 1")
        project_id = cursor.fetchone()[0]
        
        # Clear existing clusters
        print("🗑️ Clearing existing clusters...")
        cursor.execute("UPDATE driving_forces SET cluster_id = NULL, cluster_label = NULL")
        cursor.execute("DELETE FROM clusters")
        
        # Create title to force ID mapping for database update
        print("🔍 Creating database mapping...")
        cursor.execute("SELECT title, id FROM driving_forces WHERE title IS NOT NULL")
        db_forces = dict(cursor.fetchall())  # title -> force_id
        
        # Verify mapping with test case
        test_title = "Social Welfare & Inequalities"
        if test_title in db_forces:
            print(f"✅ Test mapping: '{test_title}' -> {db_forces[test_title]}")
        else:
            print(f"❌ Test mapping failed: '{test_title}' not found")
        
        print(f"📊 Found {len(db_forces)} forces in database")
        
        # Create direct mappings using row indices
        cluster_groups = {}
        force_updates = []
        matched_count = 0
        
        print("🔍 Processing direct mappings...")
        for index, row in data.iterrows():
            title = row['Title']
            cluster_id = row['Cluster']
            
            # Debug first few entries
            if index < 3:
                print(f"  Row {index}: '{title}' -> Cluster {cluster_id} (type: {type(cluster_id)})")
            
            # Check if title and cluster are valid
            if pd.notna(title) and pd.notna(cluster_id) and title in db_forces:
                force_id = db_forces[title]
                cluster_id = int(cluster_id)  # Ensure it's an integer
                cluster_name = cluster_titles.get(cluster_id, f"Cluster {cluster_id}")
                
                # Group by cluster for cluster creation
                if cluster_id not in cluster_groups:
                    cluster_groups[cluster_id] = []
                cluster_groups[cluster_id].append(force_id)
                
                # Prepare force updates
                force_updates.append((cluster_name, force_id))
                matched_count += 1
            
            # Debug why no matches
            elif index < 5:
                in_db = title in db_forces if pd.notna(title) else False
                print(f"  No match Row {index}: title_valid={pd.notna(title)}, cluster_valid={pd.notna(cluster_id)}, in_db={in_db}")
        
        print(f"✅ Matched {matched_count} forces using direct correspondence")
        print(f"📊 Found {len(cluster_groups)} unique clusters")
        
        # Create clusters
        print("🏗️ Creating clusters...")
        cluster_id_map = {}
        
        for cluster_id, force_ids in sorted(cluster_groups.items()):
            cluster_name = cluster_titles.get(cluster_id, f"Cluster {cluster_id}")
            cluster_size = len(force_ids)
            
            cursor.execute("""
                INSERT INTO clusters (label, force_ids, project_id, method, size, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                RETURNING id
            """, (cluster_name, force_ids, project_id, 'direct_correspondence', cluster_size))
            
            cluster_db_id = cursor.fetchone()[0]
            cluster_id_map[cluster_name] = cluster_db_id
            
            print(f"  ✅ {cluster_name}: {cluster_size} forces")
        
        # Batch update forces
        print("🔄 Updating driving forces...")
        
        batch_updates = []
        for cluster_label, force_id in force_updates:
            cluster_db_id = cluster_id_map[cluster_label]
            batch_updates.append((cluster_db_id, cluster_label, force_id))
        
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
        
        # Commit everything
        conn.commit()
        
        # Test the specific problematic case
        cursor.execute("SELECT title, cluster_label FROM driving_forces WHERE title = %s", 
                      ('Social Welfare & Inequalities',))
        test_result = cursor.fetchone()
        if test_result:
            print(f"🎯 Test case: '{test_result[0]}' -> {test_result[1]}")
        
        # Show final results
        cursor.execute("""
            SELECT cluster_label, COUNT(*) 
            FROM driving_forces 
            WHERE cluster_label IS NOT NULL 
            GROUP BY cluster_label 
            ORDER BY COUNT(*) DESC 
            LIMIT 10
        """)
        results = cursor.fetchall()
        
        print(f"\n📊 Top 10 clusters:")
        total_clustered = 0
        for label, count in results:
            print(f"  {label}: {count} forces")
            total_clustered += count
        
        cursor.execute("SELECT COUNT(*) FROM driving_forces")
        total_forces = cursor.fetchone()[0]
        
        print(f"\n🎉 Direct mapping completed successfully!")
        print(f"  Total forces: {total_forces}")
        print(f"  Clustered forces: {total_clustered}")
        print(f"  Match rate: {(total_clustered/total_forces)*100:.1f}%")
        print("✅ Used exact precomputed assignments with direct correspondence")
        
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