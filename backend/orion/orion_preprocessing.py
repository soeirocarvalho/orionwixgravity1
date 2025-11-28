#!/usr/bin/env python3
"""
ORION Preprocessing Script
Implements Sentence Transformers + UMAP + Louvain clustering for ORION system

This script replaces the old TF-IDF + K-means approach with:
- Sentence Transformers (all-MiniLM-L6-v2) for embeddings
- UMAP for dimensionality reduction and 3D coordinates
- Louvain community detection on k-NN graph for clustering
- KeyBERT for generating semantic cluster titles

Usage:
    python orion_preprocessing.py --input data.json --output features.pkl [--target-clusters 37]
"""

import os
import sys
import json
import pickle
import argparse
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    import nltk
    from nltk.corpus import stopwords
    from sentence_transformers import SentenceTransformer
    import umap
    from sklearn.neighbors import NearestNeighbors
    from sklearn.metrics import silhouette_score
    import networkx as nx
    import community as community_louvain
    from keybert import KeyBERT
    import re
except ImportError as e:
    logger.error(f"Missing required dependency: {e}")
    logger.error("Please install required packages:")
    logger.error("pip install sentence-transformers umap-learn keybert python-louvain nltk networkx scikit-learn")
    sys.exit(1)

class OrionPreprocessor:
    """
    ORION clustering preprocessing pipeline using modern ML techniques
    """
    
    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.embedder = None
        self.kw_model = None
        self.stopwords = None
        
    def initialize_models(self):
        """Initialize all required models and download NLTK data"""
        logger.info("Initializing models...")
        
        # Download NLTK stopwords
        try:
            nltk.download("stopwords", quiet=True)
            self.stopwords = set(stopwords.words("english"))
        except Exception as e:
            logger.warning(f"Could not download NLTK stopwords: {e}")
            self.stopwords = set()
        
        # Initialize Sentence Transformer
        logger.info("Loading Sentence Transformer model (all-MiniLM-L6-v2)...")
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
        
        # Initialize KeyBERT
        logger.info("Initializing KeyBERT model...")
        self.kw_model = KeyBERT(model=self.embedder)
        
        logger.info("All models initialized successfully")
    
    def preprocess_text(self, text: str) -> str:
        """
        Preprocess text: lowercase, remove non-alphanumeric, filter stopwords
        """
        if not text or pd.isna(text):
            return ""
        
        text = str(text).lower()
        text = re.sub(r"[^a-z0-9\s]", "", text)
        tokens = text.split()
        tokens = [w for w in tokens if w not in self.stopwords and len(w) > 2]
        return " ".join(tokens)
    
    def prepare_texts(self, forces_data: List[Dict[str, Any]]) -> List[str]:
        """
        Prepare text data by combining title, text, and tags
        """
        logger.info(f"Preprocessing {len(forces_data)} text documents...")
        
        preprocessed_texts = []
        for force in forces_data:
            # Combine title + text (description) + tags like in the original script
            combined_text = " ".join([
                str(force.get("title", "") or ""),
                str(force.get("text", "") or ""),
                str(force.get("tags", "") or "")
            ])
            
            preprocessed = self.preprocess_text(combined_text)
            preprocessed_texts.append(preprocessed)
        
        logger.info(f"Preprocessed {len(preprocessed_texts)} documents")
        return preprocessed_texts
    
    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Generate sentence embeddings using Sentence Transformers
        """
        logger.info("Generating sentence embeddings...")
        embeddings = self.embedder.encode(
            texts,
            show_progress_bar=True,
            convert_to_numpy=True
        )
        logger.info(f"Generated embeddings shape: {embeddings.shape}")
        return embeddings
    
    def apply_umap_reduction(self, embeddings: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Apply UMAP dimensionality reduction for both 2D and 3D coordinates
        """
        logger.info("Applying UMAP dimensionality reduction...")
        
        # UMAP 3D for visualization (matching original script parameters)
        umap_3d = umap.UMAP(
            n_components=3,
            metric="cosine", 
            random_state=self.random_state,
            min_dist=0.01,    # Tighter cluster packing
            spread=1.0,       
            n_neighbors=20    # Stronger cluster structure
        )
        coords_3d = umap_3d.fit_transform(embeddings)
        
        logger.info("UMAP 3D coordinates range:")
        logger.info(f"  X: {np.min(coords_3d[:, 0]):.3f} to {np.max(coords_3d[:, 0]):.3f}")
        logger.info(f"  Y: {np.min(coords_3d[:, 1]):.3f} to {np.max(coords_3d[:, 1]):.3f}")
        logger.info(f"  Z: {np.min(coords_3d[:, 2]):.3f} to {np.max(coords_3d[:, 2]):.3f}")
        
        # UMAP 2D for clearer, denser cluster plots
        umap_2d = umap.UMAP(
            n_components=2,
            metric="cosine",
            random_state=self.random_state,
            min_dist=0.001,   # Much tighter clusters
            spread=1.2,       # Slight cluster separation
            n_neighbors=15    # More local structure
        )
        coords_2d = umap_2d.fit_transform(embeddings)
        
        logger.info("UMAP 2D coordinates range:")
        logger.info(f"  X: {np.min(coords_2d[:, 0]):.3f} to {np.max(coords_2d[:, 0]):.3f}")
        logger.info(f"  Y: {np.min(coords_2d[:, 1]):.3f} to {np.max(coords_2d[:, 1]):.3f}")
        
        return coords_2d, coords_3d
    
    def perform_louvain_clustering(
        self, 
        embeddings: np.ndarray, 
        target_clusters: Optional[int] = None
    ) -> Tuple[np.ndarray, float]:
        """
        Perform Louvain community detection on k-NN graph
        """
        logger.info("Performing Louvain community detection...")
        
        # Build k-NN graph
        knn = NearestNeighbors(n_neighbors=15, metric="cosine").fit(embeddings)
        knn_graph = knn.kneighbors_graph(mode="connectivity")
        
        # Create NetworkX graph (handle version differences)
        if hasattr(nx, "from_scipy_sparse_array"):
            G = nx.from_scipy_sparse_array(knn_graph)
        else:  # NetworkX <= 2.8
            G = nx.from_scipy_sparse_matrix(knn_graph)
        
        # Perform Louvain clustering with resolution tuning
        best_partition = None
        best_resolution = 1.4
        target_reached = False
        
        if target_clusters:
            # Try to find resolution that gives target number of clusters
            resolutions = [0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.5, 3.0]
            
            for resolution in resolutions:
                partition = community_louvain.best_partition(
                    G, 
                    resolution=resolution, 
                    random_state=self.random_state
                )
                n_clusters = len(set(partition.values()))
                logger.info(f"Resolution {resolution:.1f}: {n_clusters} clusters")
                
                if n_clusters == target_clusters:
                    best_partition = partition
                    best_resolution = resolution
                    target_reached = True
                    break
                elif best_partition is None or abs(n_clusters - target_clusters) < abs(len(set(best_partition.values())) - target_clusters):
                    best_partition = partition
                    best_resolution = resolution
        
        if not best_partition:
            # Fallback to default resolution
            best_partition = community_louvain.best_partition(
                G, 
                resolution=1.4, 
                random_state=self.random_state
            )
        
        # Convert to cluster labels array
        cluster_labels = np.array([best_partition[i] for i in range(len(embeddings))])
        n_clusters = len(np.unique(cluster_labels))
        
        if target_clusters and not target_reached:
            logger.warning(f"Could not achieve exactly {target_clusters} clusters. Got {n_clusters} clusters with resolution {best_resolution:.1f}")
        else:
            logger.info(f"Successfully generated {n_clusters} clusters with resolution {best_resolution:.1f}")
        
        return cluster_labels, best_resolution
    
    def generate_cluster_titles(
        self, 
        cluster_labels: np.ndarray, 
        texts: List[str]
    ) -> Dict[int, str]:
        """
        Generate semantic cluster titles using KeyBERT
        """
        logger.info("Generating cluster titles with KeyBERT...")
        
        cluster_titles = {}
        unique_clusters = np.unique(cluster_labels)
        
        for cluster_id in unique_clusters:
            # Get texts for this cluster
            cluster_indices = np.where(cluster_labels == cluster_id)[0]
            cluster_texts = [texts[i] for i in cluster_indices]
            
            # Combine texts (limit to avoid memory issues)
            joined_text = " ".join(cluster_texts[:100])  # Limit to first 100 docs
            if len(joined_text) > 10000:  # Further limit by character count
                joined_text = joined_text[:10000]
            
            if joined_text.strip():
                try:
                    # Extract top 2 keywords
                    keywords = self.kw_model.extract_keywords(
                        joined_text, 
                        top_n=2, 
                        stop_words=list(self.stopwords)
                    )
                    
                    if keywords:
                        cluster_titles[cluster_id] = " & ".join([kw for kw, _ in keywords])
                    else:
                        cluster_titles[cluster_id] = f"Cluster {cluster_id}"
                        
                except Exception as e:
                    logger.warning(f"Failed to generate title for cluster {cluster_id}: {e}")
                    cluster_titles[cluster_id] = f"Cluster {cluster_id}"
            else:
                cluster_titles[cluster_id] = f"Cluster {cluster_id}"
        
        logger.info(f"Generated titles for {len(cluster_titles)} clusters")
        return cluster_titles
    
    def process_forces(
        self, 
        forces_data: List[Dict[str, Any]], 
        target_clusters: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Complete preprocessing pipeline for ORION forces
        """
        logger.info("Starting ORION preprocessing pipeline...")
        
        # Initialize models
        self.initialize_models()
        
        # Step 1: Preprocess texts
        texts = self.prepare_texts(forces_data)
        
        # Step 2: Generate embeddings
        embeddings = self.generate_embeddings(texts)
        
        # Step 3: Apply UMAP reduction
        coords_2d, coords_3d = self.apply_umap_reduction(embeddings)
        
        # Step 4: Perform clustering
        cluster_labels, resolution_used = self.perform_louvain_clustering(
            embeddings, target_clusters
        )
        
        # Step 5: Generate cluster titles
        cluster_titles = self.generate_cluster_titles(cluster_labels, texts)
        
        # Step 6: Calculate quality metrics
        silhouette = silhouette_score(embeddings, cluster_labels, metric="cosine")
        
        # Step 7: Prepare results
        results = {
            "id": [force.get("id", f"force_{i}") for i, force in enumerate(forces_data)],
            "cluster_labels": cluster_labels.tolist(),
            "cluster_titles": cluster_titles,
            "umap2d_x": coords_2d[:, 0].astype(float).tolist(),
            "umap2d_y": coords_2d[:, 1].astype(float).tolist(),
            "tsne_x": coords_3d[:, 0].astype(float).tolist(),  # Using UMAP 3D as tsne for compatibility
            "tsne_y": coords_3d[:, 1].astype(float).tolist(),
            "tsne_z": coords_3d[:, 2].astype(float).tolist(),
            "umap3d_x": coords_3d[:, 0].astype(float).tolist(),
            "umap3d_y": coords_3d[:, 1].astype(float).tolist(),
            "umap3d_z": coords_3d[:, 2].astype(float).tolist(),
            "silhouette_score": float(silhouette),
            "n_clusters": int(len(cluster_titles)),
            "resolution_used": float(resolution_used)
        }
        
        logger.info(f"Preprocessing completed successfully!")
        logger.info(f"Generated {results['n_clusters']} clusters with silhouette score: {silhouette:.3f}")
        
        return results

def main():
    parser = argparse.ArgumentParser(description="ORION Clustering Preprocessing")
    parser.add_argument("--input", required=True, help="Input JSON file with forces data")
    parser.add_argument("--output", required=True, help="Output pickle file for results")
    parser.add_argument("--target-clusters", type=int, default=None, 
                       help="Target number of clusters (optional)")
    parser.add_argument("--random-state", type=int, default=42,
                       help="Random state for reproducibility")
    
    args = parser.parse_args()
    
    try:
        # Load input data
        logger.info(f"Loading data from {args.input}")
        with open(args.input, 'r') as f:
            forces_data = json.load(f)
        
        if not isinstance(forces_data, list):
            logger.error("Input data must be a list of force objects")
            sys.exit(1)
        
        logger.info(f"Loaded {len(forces_data)} forces")
        
        # Process data
        preprocessor = OrionPreprocessor(random_state=args.random_state)
        results = preprocessor.process_forces(forces_data, args.target_clusters)
        
        # Save results - support both JSON and pickle formats
        logger.info(f"Saving results to {args.output}")
        
        if args.output.endswith('.json'):
            # Save as JSON for TypeScript integration
            with open(args.output, 'w') as f:
                json.dump(results, f, indent=2)
        else:
            # Save as pickle (default)
            with open(args.output, 'wb') as f:
                pickle.dump(results, f)
        
        logger.info("✅ ORION preprocessing completed successfully!")
        
        # Print summary
        print("\n" + "="*50)
        print("PREPROCESSING SUMMARY")
        print("="*50)
        print(f"Input forces: {len(forces_data)}")
        print(f"Generated clusters: {results['n_clusters']}")
        print(f"Silhouette score: {results['silhouette_score']:.3f}")
        print(f"Resolution used: {results['resolution_used']:.2f}")
        print(f"Output saved to: {args.output}")
        print("="*50)
        
    except Exception as e:
        logger.error(f"Error during preprocessing: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()