"""
ORION FixedClusters Patch - Data Loader Module

This module implements the FixedClusters Patch specifications for loading and merging
dataset and precomputed features files with strict validation and integrity checking.

Key Features:
- Parquet-preferred dataset loading with xlsx fallback
- Pickle/Parquet features loading with required column validation
- Left-join merging with strict mode validation
- ID column derivation for datasets missing ID
- Comprehensive error handling and logging

Environment Variables:
- FEATURES_FILE: Path to precomputed features file (.pkl or .parquet)
- DATASET_FILE: Path to main dataset file (.parquet or .xlsx)
- STRICT_FEATURES: Enable strict validation mode (default: true)
"""

import os
import pickle
import logging
import hashlib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Union, Any


# Configure logging
logger = logging.getLogger(__name__)


class StartupIntegrityError(Exception):
    """
    Raised when data integrity checks fail during startup.
    Used specifically for FixedClusters Patch validation failures.
    """
    pass


# Default file paths - can be overridden by environment variables
DEFAULT_DATASET_FILE = "data/ORION_Scanning_DB_Updated.parquet"
DEFAULT_FEATURES_FILE = "data/precomputed_features.pkl"

# Required columns in features file
REQUIRED_FEATURES_COLUMNS = [
    'id', 
    'cluster_labels', 
    'cluster_titles', 
    'umap2d_x', 
    'umap2d_y'
]

# Optional additional columns in features file
OPTIONAL_FEATURES_COLUMNS = [
    'tsne_x', 
    'tsne_y', 
    'tsne_z', 
    'umap3d_x', 
    'umap3d_y', 
    'umap3d_z'
]

# Global state for cached data
_cached_dataset = None
_cached_features = None
_cached_merged_df = None
_features_columns_present = None


def get_file_paths() -> tuple[str, str, bool]:
    """
    Get file paths from environment variables with fallbacks.
    
    Returns:
        tuple: (dataset_file_path, features_file_path, strict_mode)
    """
    dataset_file = os.getenv('DATASET_FILE', DEFAULT_DATASET_FILE)
    features_file = os.getenv('FEATURES_FILE', DEFAULT_FEATURES_FILE)
    strict_mode = os.getenv('STRICT_FEATURES', 'true').lower() in ('true', '1', 'yes')
    
    return dataset_file, features_file, strict_mode


def _derive_id_from_content(row: pd.Series) -> str:
    """
    Deterministically derive an ID from row content using SHA-256.
    Uses title|type|steep|source pattern as specified.
    
    Args:
        row: DataFrame row
        
    Returns:
        str: SHA-256 hash of concatenated content
    """
    # Collect available fields for ID derivation
    content_parts = []
    
    # Use title if available
    if 'title' in row.index:
        content_parts.append(str(row.get('title', '')))
    elif 'Title' in row.index:
        content_parts.append(str(row.get('Title', '')))
    
    # Use type if available
    if 'type' in row.index:
        content_parts.append(str(row.get('type', '')))
    elif 'Type' in row.index:
        content_parts.append(str(row.get('Type', '')))
    elif 'Driving Force' in row.index:
        content_parts.append(str(row.get('Driving Force', '')))
    
    # Use steep if available (signals classification)
    if 'steep' in row.index:
        content_parts.append(str(row.get('steep', '')))
    elif 'STEEP' in row.index:
        content_parts.append(str(row.get('STEEP', '')))
    
    # Use source if available
    if 'source' in row.index:
        content_parts.append(str(row.get('source', '')))
    elif 'Source' in row.index:
        content_parts.append(str(row.get('Source', '')))
    
    # If no suitable fields found, use index position as fallback
    if not content_parts:
        content_parts = [str(row.name)]
    
    # Create deterministic hash
    content_string = '|'.join(content_parts)
    return hashlib.sha256(content_string.encode('utf-8')).hexdigest()[:16]


def _load_dataset(dataset_file: str) -> pd.DataFrame:
    """
    Load dataset from Parquet (preferred) or xlsx (fallback).
    
    Args:
        dataset_file: Path to dataset file
        
    Returns:
        pd.DataFrame: Loaded dataset
        
    Raises:
        FileNotFoundError: If no valid dataset file found
        Exception: If loading fails
    """
    logger.info(f"Loading dataset from: {dataset_file}")
    
    # Try Parquet first (preferred)
    if dataset_file.endswith('.parquet') and os.path.exists(dataset_file):
        try:
            df = pd.read_parquet(dataset_file)
            logger.info(f"Successfully loaded {len(df)} rows from Parquet file")
            return df
        except Exception as e:
            logger.warning(f"Failed to load Parquet file: {e}")
    
    # Try xlsx fallback
    xlsx_file = dataset_file.replace('.parquet', '.xlsx')
    if os.path.exists(xlsx_file):
        try:
            df = pd.read_excel(xlsx_file, engine='openpyxl')
            logger.info(f"Successfully loaded {len(df)} rows from Excel file")
            return df
        except Exception as e:
            logger.error(f"Failed to load Excel file: {e}")
            raise
    elif dataset_file.endswith('.xlsx') and os.path.exists(dataset_file):
        try:
            df = pd.read_excel(dataset_file, engine='openpyxl')
            logger.info(f"Successfully loaded {len(df)} rows from Excel file")
            return df
        except Exception as e:
            logger.error(f"Failed to load Excel file: {e}")
            raise
    
    # No valid file found
    raise FileNotFoundError(f"No valid dataset file found at {dataset_file} or fallback locations")


def _load_features(features_file: str) -> Dict[str, Any]:
    """
    Load features from pickle or Parquet file with required column validation.
    
    Args:
        features_file: Path to features file
        
    Returns:
        Dict: Features data with required columns
        
    Raises:
        FileNotFoundError: If features file not found
        ValueError: If required columns missing
        Exception: If loading fails
    """
    logger.info(f"Loading features from: {features_file}")
    
    if not os.path.exists(features_file):
        raise FileNotFoundError(f"Features file not found: {features_file}")
    
    # Try pickle first
    if features_file.endswith('.pkl'):
        try:
            with open(features_file, 'rb') as f:
                features = pickle.load(f)
            logger.info("Successfully loaded features from pickle file")
        except Exception as e:
            logger.error(f"Failed to load pickle file: {e}")
            raise
    
    # Try Parquet
    elif features_file.endswith('.parquet'):
        try:
            df = pd.read_parquet(features_file)
            # Convert DataFrame to dictionary format
            features = {col: df[col].tolist() for col in df.columns}
            logger.info("Successfully loaded features from Parquet file")
        except Exception as e:
            logger.error(f"Failed to load Parquet file: {e}")
            raise
    
    else:
        # Try to auto-detect format
        try:
            # Try pickle first
            with open(features_file, 'rb') as f:
                features = pickle.load(f)
            logger.info("Successfully loaded features from pickle file (auto-detected)")
        except:
            try:
                # Try Parquet
                df = pd.read_parquet(features_file)
                features = {col: df[col].tolist() for col in df.columns}
                logger.info("Successfully loaded features from Parquet file (auto-detected)")
            except Exception as e:
                logger.error(f"Failed to load features file with auto-detection: {e}")
                raise
    
    # Handle missing 'id' column by generating synthetic IDs
    if 'id' not in features:
        logger.warning("'id' column missing from features file, generating synthetic IDs")
        
        # Try to determine the length from other required columns
        cluster_labels = features.get('cluster_labels', [])
        umap2d_x = features.get('umap2d_x', [])
        umap2d_y = features.get('umap2d_y', [])
        
        # Use the longest available array to determine the count
        lengths = [len(arr) for arr in [cluster_labels, umap2d_x, umap2d_y] if hasattr(arr, '__len__') and len(arr) > 0]
        if not lengths:
            raise ValueError("No data arrays found to determine record count for ID generation")
        
        n_records = max(lengths)
        logger.info(f"Generating {n_records} synthetic IDs using pattern: orion_XXXXXX")
        
        # Generate synthetic IDs using pattern: orion_<6-digit-index>
        features['id'] = [f"orion_{i:06d}" for i in range(n_records)]
    
    # Validate required columns (including the generated 'id' if it was missing)
    missing_columns = [col for col in REQUIRED_FEATURES_COLUMNS if col not in features]
    if missing_columns:
        raise ValueError(f"Missing required columns in features file: {missing_columns}")
    
    # Log available columns
    available_columns = list(features.keys())
    logger.info(f"Features file contains columns: {available_columns}")
    
    return features


def _ensure_id_column(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ensure dataset has an 'id' column, deriving it if necessary.
    
    Args:
        df: Dataset DataFrame
        
    Returns:
        pd.DataFrame: DataFrame with 'id' column
    """
    if 'id' in df.columns:
        logger.info("Dataset already has 'id' column")
        return df
    elif 'ID' in df.columns:
        # Rename ID to id for consistency
        df = df.copy()
        df['id'] = df['ID']
        logger.info("Renamed 'ID' column to 'id'")
        return df
    
    # Derive ID column from content
    logger.info("Deriving 'id' column from content using SHA-256 hash")
    df = df.copy()
    df['id'] = df.apply(_derive_id_from_content, axis=1)
    logger.info(f"Generated {len(df)} unique IDs")
    
    return df


def _merge_features_with_dataset(dataset: pd.DataFrame, features: Dict[str, Any], strict_mode: bool) -> pd.DataFrame:
    """
    Left-join features onto dataset by ID with strict mode validation.
    
    Args:
        dataset: Main dataset DataFrame
        features: Features dictionary
        strict_mode: Enable strict validation
        
    Returns:
        pd.DataFrame: Merged DataFrame
        
    Raises:
        StartupIntegrityError: If strict mode validation fails
    """
    logger.info("Merging features with dataset")
    
    # Ensure dataset has ID column
    dataset = _ensure_id_column(dataset)
    
    # Convert features to DataFrame for merging
    features_df = pd.DataFrame(features)
    
    # Ensure features has same length as other columns
    n_features = len(features['id'])
    for col, values in features.items():
        if len(values) != n_features:
            logger.warning(f"Feature column '{col}' has mismatched length: {len(values)} vs {n_features}")
    
    logger.info(f"Dataset shape: {dataset.shape}")
    logger.info(f"Features shape: {features_df.shape}")
    
    # Perform left join
    merged_df = dataset.merge(features_df, on='id', how='left', suffixes=('', '_features'))
    
    logger.info(f"Merged dataset shape: {merged_df.shape}")
    
    # Calculate match statistics
    unmatched_count = merged_df['cluster_labels'].isna().sum()
    total_count = len(merged_df)
    unmatched_rate = unmatched_count / total_count if total_count > 0 else 0
    
    logger.info(f"Merge statistics: {total_count - unmatched_count}/{total_count} matched ({(1-unmatched_rate)*100:.1f}%)")
    logger.info(f"Unmatched records: {unmatched_count} ({unmatched_rate*100:.1f}%)")
    
    # Strict mode validation
    if strict_mode and unmatched_rate > 0.005:  # 0.5%
        raise StartupIntegrityError(
            f"Strict mode validation failed: unmatched rate {unmatched_rate*100:.2f}% exceeds 0.5% threshold. "
            f"{unmatched_count} out of {total_count} records could not be matched with features."
        )
    
    # In non-strict mode, we do not synthesize missing coordinates/labels
    # They remain as NaN which can be handled by downstream components
    if not strict_mode and unmatched_count > 0:
        logger.warning(f"Non-strict mode: {unmatched_count} records without features will have NaN values")
    
    return merged_df


def _load_and_merge_data() -> tuple[pd.DataFrame, List[str]]:
    """
    Load and merge dataset and features with caching.
    
    Returns:
        tuple: (merged_dataframe, features_columns_present)
    """
    global _cached_dataset, _cached_features, _cached_merged_df, _features_columns_present
    
    # Return cached data if available
    if _cached_merged_df is not None and _features_columns_present is not None:
        logger.debug("Returning cached merged data")
        return _cached_merged_df, _features_columns_present
    
    # Get configuration
    dataset_file, features_file, strict_mode = get_file_paths()
    
    logger.info(f"Loading data with strict_mode={strict_mode}")
    
    try:
        # Load dataset
        if _cached_dataset is None:
            _cached_dataset = _load_dataset(dataset_file)
        
        # Load features
        if _cached_features is None:
            _cached_features = _load_features(features_file)
        
        # Merge data
        _cached_merged_df = _merge_features_with_dataset(_cached_dataset, _cached_features, strict_mode)
        
        # Determine which feature columns are present
        _features_columns_present = [col for col in (REQUIRED_FEATURES_COLUMNS + OPTIONAL_FEATURES_COLUMNS) 
                                   if col in _cached_merged_df.columns]
        
        logger.info(f"Data loading completed successfully. Features columns present: {_features_columns_present}")
        
        return _cached_merged_df, _features_columns_present
        
    except Exception as e:
        logger.error(f"Failed to load and merge data: {e}")
        raise


def get_merged_dataframe() -> pd.DataFrame:
    """
    Get the merged dataset with features.
    This is the single source for scanning/analytics data.
    
    Returns:
        pd.DataFrame: Merged dataset with features
        
    Raises:
        Various exceptions based on loading failures
    """
    merged_df, _ = _load_and_merge_data()
    return merged_df


def get_features_columns_present() -> List[str]:
    """
    Get list of feature columns present in the merged dataset.
    
    Returns:
        List[str]: Names of feature columns available
    """
    _, features_columns = _load_and_merge_data()
    return features_columns


def clear_cache() -> None:
    """
    Clear cached data to force reload on next access.
    Useful for testing or when files change.
    """
    global _cached_dataset, _cached_features, _cached_merged_df, _features_columns_present
    
    _cached_dataset = None
    _cached_features = None
    _cached_merged_df = None
    _features_columns_present = None
    
    logger.info("Data cache cleared")


def validate_data_integrity() -> Dict[str, Any]:
    """
    Validate data integrity and return diagnostic information.
    
    Returns:
        Dict: Diagnostic information about data quality
    """
    try:
        merged_df, features_columns = _load_and_merge_data()
        
        # Basic statistics
        total_records = len(merged_df)
        features_matched = merged_df['cluster_labels'].notna().sum()
        match_rate = features_matched / total_records if total_records > 0 else 0
        
        # Cluster statistics
        unique_clusters = merged_df['cluster_labels'].nunique()
        cluster_sizes = merged_df['cluster_labels'].value_counts().to_dict()
        
        diagnostics = {
            'total_records': total_records,
            'features_matched': features_matched,
            'match_rate': match_rate,
            'unique_clusters': unique_clusters,
            'cluster_sizes': cluster_sizes,
            'features_columns_present': features_columns,
            'data_shape': merged_df.shape,
            'integrity_status': 'PASS' if match_rate > 0.995 else 'WARNING' if match_rate > 0.99 else 'FAIL'
        }
        
        logger.info(f"Data integrity validation completed: {diagnostics['integrity_status']}")
        
        return diagnostics
        
    except Exception as e:
        logger.error(f"Data integrity validation failed: {e}")
        return {
            'integrity_status': 'ERROR',
            'error': str(e)
        }


# Initialize logging for this module
if __name__ == "__main__":
    # Test the module
    logging.basicConfig(level=logging.INFO)
    
    try:
        print("Testing data_loader_fixed module...")
        
        # Test basic functionality
        df = get_merged_dataframe()
        features = get_features_columns_present()
        
        print(f"Loaded dataset with shape: {df.shape}")
        print(f"Features columns present: {features}")
        
        # Test integrity validation
        diagnostics = validate_data_integrity()
        print(f"Data integrity status: {diagnostics.get('integrity_status', 'UNKNOWN')}")
        
        print("Module test completed successfully!")
        
    except Exception as e:
        print(f"Module test failed: {e}")
        import traceback
        traceback.print_exc()