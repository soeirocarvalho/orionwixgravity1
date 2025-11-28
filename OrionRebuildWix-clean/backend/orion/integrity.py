"""
ORION FixedClusters Patch - Integrity Validation Module

This module implements comprehensive integrity validation and manifest generation
for the FixedClusters Patch, ensuring data consistency and validation.

Key Features:
- SHA256 file hashing for integrity verification
- DataFrame column validation
- Coverage calculation between ID sets
- Manifest file generation and validation
- Strict mode integrity checking
- Integration with data_loader_fixed module

Environment Variables:
- STRICT_FEATURES: Enable strict validation mode (default: true)
- APP_VERSION: Application version for manifest (fallback to git hash)
"""

import os
import json
import hashlib
import logging
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Set, Union, Any

import pandas as pd

# Import from the data loader module
try:
    # Try relative import first (when used as package)
    from .data_loader_fixed import (
        StartupIntegrityError,
        get_file_paths,
        REQUIRED_FEATURES_COLUMNS
    )
except ImportError:
    # Fallback to absolute import (for standalone testing)
    from data_loader_fixed import (
        StartupIntegrityError,
        get_file_paths,
        REQUIRED_FEATURES_COLUMNS
    )


# Configure logging
logger = logging.getLogger(__name__)

# Constants
MANIFEST_FILE = "data/features.manifest.json"
MIN_COVERAGE_PERCENT = 99.5


def sha256_file(file_path: str) -> str:
    """
    Calculate SHA256 hash of a file.
    
    Args:
        file_path: Path to the file to hash
        
    Returns:
        str: SHA256 hash as hexadecimal string
        
    Raises:
        FileNotFoundError: If file doesn't exist
        IOError: If file can't be read
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    sha256_hash = hashlib.sha256()
    
    try:
        with open(file_path, "rb") as f:
            # Read file in chunks to handle large files efficiently
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        
        result = sha256_hash.hexdigest()
        logger.debug(f"SHA256 of {file_path}: {result}")
        return result
        
    except IOError as e:
        logger.error(f"Failed to read file {file_path}: {e}")
        raise


def require_columns(df: pd.DataFrame, required_cols: List[str]) -> None:
    """
    Validate that DataFrame has all required columns.
    
    Args:
        df: DataFrame to validate
        required_cols: List of required column names
        
    Raises:
        StartupIntegrityError: If any required columns are missing
    """
    if df is None:
        raise StartupIntegrityError("DataFrame is None")
    
    missing_cols = [col for col in required_cols if col not in df.columns]
    
    if missing_cols:
        available_cols = list(df.columns)
        raise StartupIntegrityError(
            f"Missing required columns: {missing_cols}. "
            f"Available columns: {available_cols}"
        )
    
    logger.debug(f"All required columns present: {required_cols}")


def coverage(left_ids: Set[str], right_ids: Set[str]) -> float:
    """
    Calculate coverage percentage between two ID sets.
    Coverage is defined as the percentage of left_ids that exist in right_ids.
    
    Args:
        left_ids: Set of IDs from the left dataset (typically the main dataset)
        right_ids: Set of IDs from the right dataset (typically features)
        
    Returns:
        float: Coverage percentage (0.0 to 100.0)
    """
    if not left_ids:
        logger.warning("Left ID set is empty, returning 100% coverage")
        return 100.0
    
    if not right_ids:
        logger.warning("Right ID set is empty, returning 0% coverage")
        return 0.0
    
    intersection = left_ids.intersection(right_ids)
    coverage_pct = (len(intersection) / len(left_ids)) * 100.0
    
    logger.debug(f"Coverage calculation: {len(intersection)}/{len(left_ids)} = {coverage_pct:.2f}%")
    
    return coverage_pct


def get_app_version() -> str:
    """
    Get application version from environment or git hash.
    
    Returns:
        str: Application version or git hash
    """
    # Try environment variable first
    app_version = os.getenv('APP_VERSION')
    if app_version:
        return app_version
    
    # Try to get git hash as fallback
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--short', 'HEAD'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
        logger.debug("Could not get git hash")
    
    # Final fallback
    return "unknown"


def create_manifest(dataset_file: str, features_file: str, dataset_df: pd.DataFrame, 
                   features_data: Dict[str, Any], coverage_pct: float, 
                   strict_mode: bool) -> Dict[str, Any]:
    """
    Create integrity manifest with file hashes and metadata.
    
    Args:
        dataset_file: Path to dataset file
        features_file: Path to features file
        dataset_df: Dataset DataFrame
        features_data: Features data dictionary
        coverage_pct: Coverage percentage between datasets
        strict_mode: Whether strict mode is enabled
        
    Returns:
        Dict: Manifest data
        
    Raises:
        IOError: If file hashing fails
    """
    logger.info("Creating integrity manifest")
    
    # Calculate file hashes
    dataset_hash = sha256_file(dataset_file)
    features_hash = sha256_file(features_file)
    
    # Get row counts
    rows_dataset = len(dataset_df)
    rows_features = len(features_data.get('id', []))
    
    # Create manifest
    manifest = {
        "features_sha256": features_hash,
        "dataset_sha256": dataset_hash,
        "rows_dataset": rows_dataset,
        "rows_features": rows_features,
        "coverage_pct": round(coverage_pct, 2),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "strict_mode": strict_mode,
        "app_version": get_app_version(),
        "dataset_file": dataset_file,
        "features_file": features_file,
        "required_columns": REQUIRED_FEATURES_COLUMNS
    }
    
    logger.info(f"Created manifest with coverage {coverage_pct:.2f}% for {rows_dataset} dataset rows")
    
    return manifest


def write_manifest(manifest: Dict[str, Any], manifest_path: str = MANIFEST_FILE) -> None:
    """
    Write manifest to file.
    
    Args:
        manifest: Manifest data to write
        manifest_path: Path to write manifest file
        
    Raises:
        IOError: If writing fails
    """
    logger.info(f"Writing manifest to {manifest_path}")
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
    
    try:
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        logger.info(f"Successfully wrote manifest to {manifest_path}")
        
    except IOError as e:
        logger.error(f"Failed to write manifest to {manifest_path}: {e}")
        raise


def read_manifest(manifest_path: str = MANIFEST_FILE) -> Optional[Dict[str, Any]]:
    """
    Read existing manifest file.
    
    Args:
        manifest_path: Path to manifest file
        
    Returns:
        Dict or None: Manifest data if file exists and is valid, None otherwise
    """
    if not os.path.exists(manifest_path):
        logger.debug(f"Manifest file does not exist: {manifest_path}")
        return None
    
    try:
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        
        logger.info(f"Successfully read manifest from {manifest_path}")
        return manifest
        
    except (IOError, json.JSONDecodeError) as e:
        logger.warning(f"Failed to read manifest from {manifest_path}: {e}")
        return None


def validate_strict_mode(dataset_df: pd.DataFrame, features_data: Dict[str, Any], 
                        coverage_pct: float) -> None:
    """
    Perform strict mode validation according to FixedClusters Patch specifications.
    
    Args:
        dataset_df: Dataset DataFrame
        features_data: Features data dictionary
        coverage_pct: Coverage percentage
        
    Raises:
        StartupIntegrityError: If strict mode validation fails
    """
    logger.info("Performing strict mode validation")
    
    # Check (a): required columns missing
    try:
        require_columns(pd.DataFrame(features_data), REQUIRED_FEATURES_COLUMNS)
    except StartupIntegrityError as e:
        logger.error(f"Strict mode validation failed - missing columns: {e}")
        raise
    
    # Check (b): coverage < 99.5%
    if coverage_pct < MIN_COVERAGE_PERCENT:
        error_msg = (f"Strict mode validation failed - coverage {coverage_pct:.2f}% "
                    f"is below minimum {MIN_COVERAGE_PERCENT}%")
        logger.error(error_msg)
        raise StartupIntegrityError(error_msg)
    
    # Check (c): files missing (handled by caller - file loading would fail earlier)
    
    logger.info(f"Strict mode validation passed - coverage {coverage_pct:.2f}%")


def generate_or_validate_manifest(dataset_file: str, features_file: str, 
                                dataset_df: pd.DataFrame, features_data: Dict[str, Any],
                                strict_mode: bool) -> Dict[str, Any]:
    """
    Generate new manifest or validate against existing one.
    
    Args:
        dataset_file: Path to dataset file
        features_file: Path to features file
        dataset_df: Dataset DataFrame
        features_data: Features data dictionary
        strict_mode: Whether strict mode is enabled
        
    Returns:
        Dict: Manifest data (newly created or existing)
        
    Raises:
        StartupIntegrityError: If validation fails in strict mode
    """
    logger.info("Starting manifest generation/validation")
    
    # Calculate coverage
    dataset_ids = set(dataset_df['id'].astype(str))
    features_ids = set(str(id_val) for id_val in features_data.get('id', []))
    coverage_pct = coverage(dataset_ids, features_ids)
    
    # Perform strict mode validation if enabled
    if strict_mode:
        validate_strict_mode(dataset_df, features_data, coverage_pct)
    
    # Check for existing manifest
    existing_manifest = read_manifest()
    
    if existing_manifest:
        logger.info("Found existing manifest, validating...")
        
        # Compare key metrics
        current_dataset_hash = sha256_file(dataset_file)
        current_features_hash = sha256_file(features_file)
        
        hash_matches = (
            existing_manifest.get('dataset_sha256') == current_dataset_hash and
            existing_manifest.get('features_sha256') == current_features_hash
        )
        
        if hash_matches:
            logger.info("Existing manifest is valid and up-to-date")
            return existing_manifest
        else:
            logger.info("File hashes changed, generating new manifest")
    
    # Create new manifest
    manifest = create_manifest(
        dataset_file, features_file, dataset_df, features_data, 
        coverage_pct, strict_mode
    )
    
    # Write manifest to file
    write_manifest(manifest)
    
    return manifest


def validate_data_integrity(dataset_df: pd.DataFrame, features_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Comprehensive data integrity validation.
    
    Args:
        dataset_df: Dataset DataFrame
        features_data: Features data dictionary
        
    Returns:
        Dict: Integrity validation results
    """
    logger.info("Performing comprehensive data integrity validation")
    
    try:
        # Basic validations
        require_columns(dataset_df, ['id'])
        require_columns(pd.DataFrame(features_data), REQUIRED_FEATURES_COLUMNS)
        
        # Calculate coverage
        dataset_ids = set(dataset_df['id'].astype(str))
        features_ids = set(str(id_val) for id_val in features_data.get('id', []))
        coverage_pct = coverage(dataset_ids, features_ids)
        
        # Determine status
        if coverage_pct >= MIN_COVERAGE_PERCENT:
            status = "PASS"
        elif coverage_pct >= 95.0:
            status = "WARNING"
        else:
            status = "FAIL"
        
        result = {
            "status": status,
            "coverage_percent": coverage_pct,
            "dataset_rows": len(dataset_df),
            "features_rows": len(features_data.get('id', [])),
            "matched_ids": len(dataset_ids.intersection(features_ids)),
            "unmatched_ids": len(dataset_ids - features_ids),
            "validation_time": datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"Data integrity validation completed: {status} (coverage: {coverage_pct:.2f}%)")
        
        return result
        
    except Exception as e:
        logger.error(f"Data integrity validation failed: {e}")
        return {
            "status": "ERROR",
            "error": str(e),
            "validation_time": datetime.now(timezone.utc).isoformat()
        }


def get_manifest_info() -> Optional[Dict[str, Any]]:
    """
    Get current manifest information.
    
    Returns:
        Dict or None: Current manifest data if available
    """
    return read_manifest()


def clear_manifest(manifest_path: str = MANIFEST_FILE) -> bool:
    """
    Clear/delete the manifest file.
    
    Args:
        manifest_path: Path to manifest file
        
    Returns:
        bool: True if successfully cleared, False otherwise
    """
    try:
        if os.path.exists(manifest_path):
            os.remove(manifest_path)
            logger.info(f"Successfully cleared manifest file: {manifest_path}")
            return True
        else:
            logger.debug(f"Manifest file does not exist: {manifest_path}")
            return True
    except OSError as e:
        logger.error(f"Failed to clear manifest file {manifest_path}: {e}")
        return False


# Module initialization logging
logger.debug("ORION FixedClusters Patch integrity module initialized")


if __name__ == "__main__":
    # Test the module
    import logging
    logging.basicConfig(level=logging.INFO)
    
    print("Testing integrity module...")
    
    # Test helper functions
    try:
        # Test coverage calculation
        left = {"a", "b", "c", "d"}
        right = {"a", "b", "c"}
        cov = coverage(left, right)
        print(f"Coverage test: {cov}% (expected 75%)")
        
        # Test app version
        version = get_app_version()
        print(f"App version: {version}")
        
        print("Integrity module test completed successfully!")
        
    except Exception as e:
        print(f"Integrity module test failed: {e}")
        import traceback
        traceback.print_exc()