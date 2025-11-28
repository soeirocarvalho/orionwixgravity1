#!/usr/bin/env python3
"""
ORION FixedClusters Bridge Script

This script provides a bridge between Node.js and the Python data_loader_fixed.py module.
It loads precomputed features from pickle files and returns JSON data that can be consumed
by the OrionClusteringService.

Usage:
    python3 orion_fixed_bridge.py --output <output_file.json>

Environment Variables:
- FEATURES_FILE: Path to precomputed features file (.pkl)
- DATASET_FILE: Path to main dataset file (.parquet or .xlsx) 
- STRICT_FEATURES: Enable strict validation mode (default: true)
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path
from typing import Dict, Any

# Add the current directory to Python path to import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from data_loader_fixed import (
        get_merged_dataframe, 
        get_features_columns_present,
        validate_data_integrity,
        get_file_paths,
        _load_features
    )
    from integrity import (
        validate_data_integrity as integrity_validate,
        generate_or_validate_manifest,
        get_manifest_info
    )
except ImportError as e:
    print(f"Error importing required modules: {e}", file=sys.stderr)
    sys.exit(1)


def setup_logging(verbose: bool = False):
    """Setup logging configuration."""
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stderr)  # Log to stderr so stdout is clean JSON
        ]
    )


def convert_features_to_orion_format(features_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert features data to the format expected by OrionClusteringService.
    
    Args:
        features_data: Raw features data from pickle file
        
    Returns:
        Dict: Features in OrionClusteringService format
    """
    logger = logging.getLogger(__name__)
    
    # Handle missing 'id' column by generating synthetic IDs
    if 'id' not in features_data:
        logger.warning("'id' column missing from features data, generating synthetic IDs")
        
        # Try to determine the length from other columns
        cluster_labels = features_data.get('cluster_labels', [])
        umap2d_x = features_data.get('umap2d_x', [])
        
        # Use the longest available array to determine the count
        lengths = [len(arr) for arr in [cluster_labels, umap2d_x] if len(arr) > 0]
        if not lengths:
            raise ValueError("No data arrays found to determine record count")
        
        n_features = max(lengths)
        logger.info(f"Generating {n_features} synthetic IDs")
        
        # Generate synthetic IDs using pattern: orion_<index>
        features_data['id'] = [f"orion_{i:06d}" for i in range(n_features)]
    else:
        n_features = len(features_data.get('id', []))
    
    logger.info(f"Converting {n_features} features to ORION format")
    
    # Extract cluster information
    cluster_labels = features_data.get('cluster_labels', [])
    
    # Use fixed cluster names mapping instead of dynamic titles
    from .cluster_mapping import get_cluster_name
    
    # Generate fixed cluster titles based on cluster IDs present in data
    cluster_titles = {}
    if cluster_labels:
        unique_cluster_ids = set(cluster_labels)
        for cluster_id in unique_cluster_ids:
            if isinstance(cluster_id, (int, float)) and cluster_id is not None:
                try:
                    cluster_titles[int(cluster_id)] = get_cluster_name(int(cluster_id))
                except (ValueError, TypeError):
                    continue
    
    logger.info(f"Applied fixed cluster mapping for {len(cluster_titles)} clusters")
    
    # Get coordinate arrays with fallbacks
    umap2d_x = features_data.get('umap2d_x', [])
    umap2d_y = features_data.get('umap2d_y', [])
    
    # For 3D coordinates, prefer umap3d if available, otherwise use tsne coordinates
    if 'umap3d_x' in features_data and features_data.get('umap3d_x'):
        tsne_x = features_data['umap3d_x']
        tsne_y = features_data['umap3d_y']
        tsne_z = features_data['umap3d_z']
        logger.info("Using umap3d coordinates for 3D visualization")
    else:
        # Fallback to tsne coordinates (legacy compatibility)
        tsne_x = features_data.get('tsne_x', [])
        tsne_y = features_data.get('tsne_y', [])
        tsne_z = features_data.get('tsne_z', [])
        logger.info("Using tsne coordinates for 3D visualization")
    
    # Calculate derived metrics
    n_clusters = len(set(cluster_labels)) if cluster_labels else 0
    silhouette_score = features_data.get('silhouette_score', 0.0)
    
    # Validate array lengths
    expected_length = n_features
    arrays_to_check = {
        'cluster_labels': cluster_labels,
        'umap2d_x': umap2d_x,
        'umap2d_y': umap2d_y,
        'tsne_x': tsne_x,
        'tsne_y': tsne_y,
        'tsne_z': tsne_z
    }
    
    for name, array in arrays_to_check.items():
        if len(array) != expected_length:
            logger.warning(f"Array {name} has length {len(array)}, expected {expected_length}")
    
    # Prepare result in OrionClusteringService format
    result = {
        "id": features_data.get('id', []),
        "cluster_labels": cluster_labels,
        "cluster_titles": cluster_titles,
        "umap2d_x": umap2d_x,
        "umap2d_y": umap2d_y,
        "tsne_x": tsne_x,
        "tsne_y": tsne_y,
        "tsne_z": tsne_z,
        "silhouette_score": float(silhouette_score),
        "n_clusters": n_clusters,
        "resolution_used": features_data.get('resolution_used', None)
    }
    
    logger.info(f"Converted features: {n_clusters} clusters, {n_features} data points")
    logger.info(f"Silhouette score: {silhouette_score}")
    logger.info(f"Cluster titles: {list(cluster_titles.values())[:5]}...")  # Show first 5 titles
    
    return result


def load_fixed_clusters() -> Dict[str, Any]:
    """
    Load precomputed clusters using the FixedClusters approach.
    
    Returns:
        Dict: Complete clustering data in OrionClusteringService format
        
    Raises:
        Exception: If loading fails
    """
    logger = logging.getLogger(__name__)
    
    # Get configuration
    dataset_file, features_file, strict_mode = get_file_paths()
    
    logger.info(f"Loading fixed clusters with strict_mode={strict_mode}")
    logger.info(f"Features file: {features_file}")
    
    try:
        # Load the precomputed features directly (features-only mode)
        features_data = _load_features(features_file)
        logger.info(f"Loaded features from {features_file}")
        
        # In FixedClusters mode, we work with features only and skip dataset merging
        # This is because the features file contains all the necessary clustering information
        logger.info("FixedClusters mode: Working with features-only (no dataset merging required)")
        
        # Convert to OrionClusteringService format
        orion_features = convert_features_to_orion_format(features_data)
        
        # Basic validation on the features data
        n_records = len(orion_features.get('id', []))
        n_clusters = orion_features.get('n_clusters', 0)
        silhouette_score = orion_features.get('silhouette_score', 0.0)
        
        # Validate that we have the expected structure
        if n_records == 0:
            raise Exception("No records found in features data")
        
        if n_clusters == 0:
            raise Exception("No clusters found in features data")
        
        logger.info(f"Features validation: {n_records} records, {n_clusters} clusters, silhouette={silhouette_score:.3f}")
        
        # Add metadata
        result = {
            "features": orion_features,
            "metadata": {
                "features_file": features_file,
                "strict_mode": strict_mode,
                "total_records": n_records,
                "total_clusters": n_clusters,
                "silhouette_score": silhouette_score,
                "features_columns_present": list(features_data.keys()),
                "integrity_status": "FEATURES_ONLY",
                "mode": "FixedClusters"
            }
        }
        
        logger.info("Successfully loaded fixed clusters in features-only mode")
        return result
        
    except Exception as e:
        logger.error(f"Failed to load fixed clusters: {e}")
        raise


def get_integrity_status() -> Dict[str, Any]:
    """
    Get comprehensive integrity status for the FixedClusters setup.
    
    Returns:
        Dict: Integrity status information
    """
    logger = logging.getLogger(__name__)
    
    try:
        # Get configuration
        dataset_file, features_file, strict_mode = get_file_paths()
        
        # Load data
        merged_df = get_merged_dataframe()
        features_data = _load_features(features_file)
        
        # Run integrity validation
        integrity_result = integrity_validate(merged_df, features_data)
        
        # Generate/validate manifest
        manifest = generate_or_validate_manifest(
            dataset_file, features_file, merged_df, features_data, strict_mode
        )
        
        # Combine results
        status = {
            "integrity": integrity_result,
            "manifest": manifest,
            "configuration": {
                "dataset_file": dataset_file,
                "features_file": features_file,
                "strict_mode": strict_mode
            },
            "file_status": {
                "dataset_exists": os.path.exists(dataset_file),
                "features_exists": os.path.exists(features_file)
            }
        }
        
        logger.info(f"Integrity status: {integrity_result.get('status', 'UNKNOWN')}")
        return status
        
    except Exception as e:
        logger.error(f"Failed to get integrity status: {e}")
        return {
            "integrity": {"status": "ERROR", "error": str(e)},
            "configuration": {"error": str(e)}
        }


def main():
    """Main entry point for the bridge script."""
    parser = argparse.ArgumentParser(description="ORION FixedClusters Bridge Script")
    parser.add_argument("--output", required=True, help="Output JSON file path")
    parser.add_argument("--mode", choices=["clusters", "integrity"], default="clusters",
                       help="Operation mode: load clusters or get integrity status")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.verbose)
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Starting ORION FixedClusters bridge in {args.mode} mode")
        
        if args.mode == "clusters":
            result = load_fixed_clusters()
        elif args.mode == "integrity":
            result = get_integrity_status()
        else:
            raise ValueError(f"Unknown mode: {args.mode}")
        
        # Write result to output file
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2, default=str)
        
        logger.info(f"Successfully wrote result to {args.output}")
        
        # Print success message to stdout
        print(json.dumps({"success": True, "output_file": args.output}))
        
    except Exception as e:
        logger.error(f"Bridge script failed: {e}")
        error_result = {
            "success": False,
            "error": str(e),
            "mode": args.mode
        }
        
        # Try to write error result to output file
        try:
            with open(args.output, 'w') as f:
                json.dump(error_result, f, indent=2)
        except:
            pass
        
        # Print error to stdout
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()