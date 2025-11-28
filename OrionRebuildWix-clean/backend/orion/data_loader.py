#!/usr/bin/env python3
"""
ORION Data Loader with Integrity Checks
Loads dataset and precomputed features with strict validation for legacy figure reuse
"""
import os
import pickle
import pandas as pd
import numpy as np
import logging
from typing import Optional, Dict, Any, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)

class ORIONDataLoader:
    """Data loader with integrity checks for legacy visualization compatibility"""
    
    def __init__(self):
        self.features_file = os.getenv('FEATURES_FILE', 'data/precomputed_features.pkl')
        self.dataset_file = os.getenv('DATASET_FILE', 'data/ORION_Scanning_DB_Updated.parquet')
        self.strict_mode = os.getenv('STRICT_FEATURES', 'false').lower() == 'true'
        
        self._dataset = None
        self._features = None
        self._merged_data = None
        
        logger.info(f"ORION Data Loader initialized:")
        logger.info(f"  Features file: {self.features_file}")
        logger.info(f"  Dataset file: {self.dataset_file}")
        logger.info(f"  Strict mode: {self.strict_mode}")
    
    def load_dataset(self) -> pd.DataFrame:
        """Load the main dataset from parquet file"""
        if self._dataset is not None:
            return self._dataset
            
        if not os.path.exists(self.dataset_file):
            raise FileNotFoundError(f"Dataset file not found: {self.dataset_file}")
        
        try:
            if self.dataset_file.endswith('.parquet'):
                self._dataset = pd.read_parquet(self.dataset_file)
            elif self.dataset_file.endswith('.xlsx'):
                self._dataset = pd.read_excel(self.dataset_file)
            else:
                raise ValueError(f"Unsupported dataset format: {self.dataset_file}")
            
            logger.info(f"Loaded dataset: {len(self._dataset)} rows, {len(self._dataset.columns)} columns")
            
            # Ensure we have a unique identifier
            if 'ID' not in self._dataset.columns and 'id' not in self._dataset.columns:
                self._dataset['ID'] = range(len(self._dataset))
                logger.warning("No ID column found, created sequential IDs")
            
            return self._dataset
            
        except Exception as e:
            logger.error(f"Failed to load dataset: {e}")
            raise
    
    def load_features(self) -> Dict[str, Any]:
        """Load precomputed features from pickle file"""
        if self._features is not None:
            return self._features
            
        if not os.path.exists(self.features_file):
            raise FileNotFoundError(f"Features file not found: {self.features_file}")
        
        try:
            with open(self.features_file, 'rb') as f:
                self._features = pickle.load(f)
            
            logger.info(f"Loaded features with keys: {list(self._features.keys())}")
            
            # Validate required columns
            required_columns = ['cluster_labels']
            optional_columns = ['cluster_titles', 'umap2d_x', 'umap2d_y', 'tsne_x', 'tsne_y', 'tsne_z']
            
            missing_required = [col for col in required_columns if col not in self._features]
            if missing_required:
                if self.strict_mode:
                    raise ValueError(f"Missing required features in strict mode: {missing_required}")
                else:
                    logger.warning(f"Missing required features (non-strict mode): {missing_required}")
            
            missing_optional = [col for col in optional_columns if col not in self._features]
            if missing_optional:
                logger.info(f"Missing optional features: {missing_optional}")
            
            return self._features
            
        except Exception as e:
            logger.error(f"Failed to load features: {e}")
            raise
    
    def validate_coverage(self, dataset: pd.DataFrame, features: Dict[str, Any]) -> Tuple[float, int, int]:
        """Validate coverage between dataset and features"""
        dataset_size = len(dataset)
        
        # Get feature array size (using cluster_labels as reference)
        if 'cluster_labels' in features:
            features_size = len(features['cluster_labels'])
        else:
            features_size = 0
        
        # For direct correspondence, we expect exact match
        if dataset_size == features_size:
            coverage = 100.0
            matched = dataset_size
        else:
            # Calculate coverage based on smaller dataset
            matched = min(dataset_size, features_size)
            coverage = (matched / dataset_size) * 100 if dataset_size > 0 else 0.0
        
        logger.info(f"Coverage validation:")
        logger.info(f"  Dataset rows: {dataset_size}")
        logger.info(f"  Features rows: {features_size}")
        logger.info(f"  Matched: {matched}")
        logger.info(f"  Coverage: {coverage:.2f}%")
        
        if self.strict_mode and coverage < 99.5:
            raise ValueError(f"Coverage {coverage:.2f}% below required 99.5% in strict mode")
        
        return coverage, matched, dataset_size
    
    def merge_data(self) -> pd.DataFrame:
        """Merge dataset with features using direct correspondence"""
        if self._merged_data is not None:
            return self._merged_data
        
        # Load both datasets
        dataset = self.load_dataset()
        features = self.load_features()
        
        # Validate coverage
        coverage, matched, total = self.validate_coverage(dataset, features)
        
        # Create merged dataframe with direct row correspondence
        merged = dataset.copy()
        
        # Add features using direct index mapping
        if 'cluster_labels' in features:
            feature_size = len(features['cluster_labels'])
            cluster_labels = list(features['cluster_labels'])
            
            # Apply direct correspondence: row i gets cluster_labels[i]
            merged['Cluster'] = None
            for i in range(min(len(merged), feature_size)):
                merged.loc[i, 'Cluster'] = cluster_labels[i]
        
        # Add coordinate features if available
        coordinate_features = ['tsne_x', 'tsne_y', 'tsne_z', 'umap2d_x', 'umap2d_y']
        for coord_name in coordinate_features:
            if coord_name in features:
                feature_data = features[coord_name]
                merged[coord_name] = None
                
                for i in range(min(len(merged), len(feature_data))):
                    merged.loc[i, coord_name] = feature_data[i]
        
        # Add cluster titles if available
        if 'cluster_titles' in features:
            cluster_titles = features['cluster_titles']
            merged['cluster_title'] = merged['Cluster'].map(cluster_titles)
        
        self._merged_data = merged
        
        logger.info(f"Merged data created:")
        logger.info(f"  Total rows: {len(merged)}")
        logger.info(f"  Columns: {list(merged.columns)}")
        logger.info(f"  Rows with clusters: {merged['Cluster'].notna().sum()}")
        
        return merged
    
    def get_merged_dataframe(self) -> pd.DataFrame:
        """Public interface to get merged dataframe"""
        return self.merge_data()
    
    def get_integrity_status(self) -> Dict[str, Any]:
        """Get integrity status for monitoring"""
        try:
            dataset = self.load_dataset()
            features = self.load_features()
            coverage, matched, total = self.validate_coverage(dataset, features)
            
            return {
                "status": "ok" if coverage >= 99.5 or not self.strict_mode else "fail",
                "coverage": coverage,
                "matched": matched,
                "total_dataset": total,
                "total_features": len(features.get('cluster_labels', [])),
                "strict_mode": self.strict_mode,
                "files_exist": {
                    "dataset": os.path.exists(self.dataset_file),
                    "features": os.path.exists(self.features_file)
                }
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "strict_mode": self.strict_mode
            }

# Global instance
_loader = None

def get_data_loader() -> ORIONDataLoader:
    """Get global data loader instance"""
    global _loader
    if _loader is None:
        _loader = ORIONDataLoader()
    return _loader

def get_merged_dataframe() -> pd.DataFrame:
    """Get merged dataframe - main public interface"""
    loader = get_data_loader()
    return loader.get_merged_dataframe()

def get_integrity_status() -> Dict[str, Any]:
    """Get integrity status - for monitoring endpoints"""
    loader = get_data_loader()
    return loader.get_integrity_status()

if __name__ == "__main__":
    # Test the data loader
    loader = get_data_loader()
    df = loader.get_merged_dataframe()
    status = loader.get_integrity_status()
    
    print(f"Loaded {len(df)} rows")
    print(f"Status: {status}")