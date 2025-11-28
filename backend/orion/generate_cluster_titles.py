#!/usr/bin/env python3
"""
Generate meaningful 4-word cluster titles from TF-IDF terms and force content
"""
import pickle
import pandas as pd
import psycopg2
import os
import re
import json
from collections import Counter, defaultdict

def extract_terms_from_tfidf(cluster_title):
    """Extract meaningful terms from TF-IDF concatenated string"""
    # Split on separators and camelCase boundaries
    terms = re.split(r'[&/\-\s]+|(?=[A-Z])', cluster_title.lower())
    
    # Filter out stopwords and short terms
    stopwords = {'the', 'and', 'or', 'of', 'in', 'to', 'for', 'with', 'by', 'on', 'at', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'}
    
    # Domain-specific meaningful terms
    domain_terms = {'ai', 'artificial', 'intelligence', 'automation', 'technology', 'biotech', 'biotechnology', 'cyber', 'cybersecurity', 'energy', 'sustainability', 'urban', 'urbanization', 'quantum', 'computing', 'health', 'medicine', 'space', 'aviation', 'finance', 'economy', 'governance', 'education', 'democracy', 'research', 'innovation', 'manufacturing', 'digital', 'virtual', 'environment', 'climate', 'renewable', 'battery', 'vaccine', 'food', 'agriculture', 'transport', 'mobility', 'blockchain', 'nuclear', 'resilience', 'social', 'economic', 'political'}
    
    filtered_terms = []
    for term in terms:
        term = term.strip()
        if (len(term) > 2 and 
            term not in stopwords and 
            (term in domain_terms or len(term) > 4)):
            filtered_terms.append(term)
    
    return filtered_terms

def extract_terms_from_forces(force_titles):
    """Extract meaningful terms from driving force titles"""
    all_text = ' '.join(force_titles).lower()
    
    # Extract meaningful phrases and words
    words = re.findall(r'\b[a-z]{3,}\b', all_text)
    
    # Count frequency
    word_counts = Counter(words)
    
    # Filter by frequency and meaningfulness
    meaningful_words = []
    for word, count in word_counts.items():
        if count >= 3 and len(word) > 3:  # Appears at least 3 times
            meaningful_words.append((word, count))
    
    return sorted(meaningful_words, key=lambda x: x[1], reverse=True)

def score_candidates(candidates, cluster_force_count, total_clusters=37):
    """Score candidate terms for title generation"""
    scored = []
    
    for candidate, freq in candidates:
        # Simple scoring: frequency + length preference
        score = freq * 2 + (len(candidate) * 0.1)
        scored.append((candidate, score))
    
    return sorted(scored, key=lambda x: x[1], reverse=True)

def generate_title(tfidf_terms, force_terms, cluster_id):
    """Generate a 4-word title for a cluster"""
    
    # Combine and score all candidates
    all_candidates = []
    
    # Add TF-IDF terms (higher weight)
    for term in tfidf_terms[:10]:  # Top 10 TF-IDF terms
        all_candidates.append((term, 10))
    
    # Add force terms (lower weight)
    for term, freq in force_terms[:15]:  # Top 15 force terms
        all_candidates.append((term, freq))
    
    # Manual mapping for better semantics
    title_overrides = {
        0: "Digital Education Technology",
        1: "Biotechnology & Genetics", 
        2: "Corporate Technology Networks",
        3: "Mobility & Economics",
        4: "Future of Work",
        5: "Cybersecurity & Warfare", 
        6: "Urbanization & Development",
        7: "Digital Technology Infrastructure",
        8: "Environmental Sustainability",
        9: "Quantum Computing",
        10: "Global Politics & Economics",
        11: "Social Resilience",
        12: "AI & Information Systems",
        13: "Residential Development",
        14: "Renewable Energy Technology",
        15: "Health & Medical Technology",
        16: "Tourism & Climate",
        17: "Sustainable Materials",
        18: "Law & Justice",
        19: "Battery & Energy Storage",
        20: "Vaccines & Health Prevention",
        21: "Food & Nutrition Culture",
        22: "Vision & Neuroscience",
        23: "Recycling & Automation",
        24: "Tax & Government Policy",
        25: "Health & Wellness Brands",
        26: "AI Manufacturing Systems",
        27: "Economics & Finance",
        28: "Entertainment & Venues",
        29: "Demographics & Population",
        30: "Social Activism",
        31: "Environmental Governance",
        32: "Aerospace & Transportation",
        33: "Automotive Industry",
        34: "Space & Lunar Technology",
        35: "Nuclear Power",
        36: "Blockchain Technology"
    }
    
    if cluster_id in title_overrides:
        return title_overrides[cluster_id]
    
    # Fallback: generate from terms
    if len(all_candidates) >= 2:
        # Pick the two best terms
        sorted_candidates = sorted(all_candidates, key=lambda x: x[1], reverse=True)
        term1 = sorted_candidates[0][0].title()
        term2 = sorted_candidates[1][0].title()
        return f"{term1} & {term2}"
    
    return f"Cluster {cluster_id}"

def main():
    """Generate meaningful cluster titles"""
    print("🎯 Generating Meaningful Cluster Titles")
    print("=" * 50)
    
    # Load pickle data
    pickle_path = "attached_assets/precomputed_features-2_1758018366314.pkl"
    with open(pickle_path, 'rb') as f:
        features = pickle.load(f)
    
    cluster_labels = features['cluster_labels']
    cluster_titles = features['cluster_titles']
    
    # Load parquet data
    parquet_path = "attached_assets/ORION_Scanning_DB_Updated_1758018366314.parquet"
    data = pd.read_parquet(parquet_path)
    data['Cluster'] = cluster_labels
    
    print(f"✅ Loaded {len(data)} forces with clusters")
    
    # Connect to database
    database_url = os.getenv('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    # Generate titles for each cluster
    generated_titles = {}
    
    for cluster_id in sorted(cluster_titles.keys()):
        print(f"\n🔍 Processing Cluster {cluster_id}...")
        
        # Get TF-IDF terms
        tfidf_title = cluster_titles[cluster_id]
        tfidf_terms = extract_terms_from_tfidf(tfidf_title)
        
        # Get forces in this cluster
        cluster_forces = data[data['Cluster'] == cluster_id]['Title'].tolist()
        force_terms = extract_terms_from_forces(cluster_forces)
        
        # Generate title
        human_title = generate_title(tfidf_terms, force_terms, cluster_id)
        generated_titles[cluster_id] = human_title
        
        print(f"  Original: {tfidf_title[:80]}...")
        print(f"  Generated: {human_title}")
        print(f"  Forces: {len(cluster_forces)}")
    
    # Save mapping (convert int64 keys to strings for JSON)
    mapping_file = "backend/orion/cluster_title_mapping.json"
    json_titles = {str(k): v for k, v in generated_titles.items()}
    with open(mapping_file, 'w') as f:
        json.dump(json_titles, f, indent=2)
    
    print(f"\n💾 Saved title mapping to {mapping_file}")
    
    # Update database
    print("\n🔄 Updating database with new titles...")
    
    for cluster_id, human_title in generated_titles.items():
        original_title = cluster_titles[cluster_id]
        
        cursor.execute("""
            UPDATE clusters 
            SET label = %s, 
                method = %s 
            WHERE label = %s
        """, (human_title, f"human_readable:{original_title[:100]}", original_title))
    
    # Also update driving forces
    cursor.execute("""
        UPDATE driving_forces 
        SET cluster_label = clusters.label
        FROM clusters 
        WHERE driving_forces.cluster_id = clusters.id
    """)
    
    conn.commit()
    
    print("✅ Database updated with human-readable cluster titles")
    
    # Show final results
    cursor.execute("""
        SELECT cluster_label, COUNT(*) 
        FROM driving_forces 
        WHERE cluster_label IS NOT NULL 
        GROUP BY cluster_label 
        ORDER BY COUNT(*) DESC 
        LIMIT 15
    """)
    
    results = cursor.fetchall()
    
    print(f"\n📊 Top 15 clusters with new titles:")
    for label, count in results:
        print(f"  {label}: {count} forces")
    
    cursor.close()
    conn.close()
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)