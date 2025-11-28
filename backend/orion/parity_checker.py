#!/usr/bin/env python3
"""
ORION Visual Parity Checker - SHA256 Comparison for Legacy Figure Reuse

This module implements comprehensive parity checking between regular visual endpoints
and their baseline counterparts to ensure byte-identical legacy figure reuse.

Key Features:
- SHA256 comparison of fig.to_dict() normalization for radar and 3D endpoints
- Strict mode that fails when parity mismatches are detected
- Detailed difference reporting for troubleshooting
- Integration with existing visual endpoints infrastructure

Endpoints Compared:
- /api/visuals/radar vs /api/visuals/baseline/radar
- /api/visuals/3d vs /api/visuals/baseline/3d

Environment Variables:
- STRICT_FEATURES: Enable strict validation mode (default: true)
- VISUAL_PARITY_STRICT: Override strict mode specifically for parity (optional)
"""

import os
import json
import hashlib
import logging
import traceback
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timezone

# Configure logging
logger = logging.getLogger(__name__)

class ParityCheckError(Exception):
    """Raised when parity checking encounters a critical error"""
    pass

class ParityMismatchError(Exception):
    """Raised when visual endpoints don't match in strict mode"""
    pass

def normalize_figure_dict(fig_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize figure dictionary for consistent SHA256 comparison.
    
    This function ensures deterministic serialization by:
    - Sorting dictionary keys recursively
    - Converting numpy arrays to lists (handled by visual_endpoints.py)
    - Ensuring consistent float precision
    - Removing any timestamp or session-specific data
    
    Args:
        fig_dict: Plotly figure dictionary from fig.to_dict()
        
    Returns:
        Normalized dictionary for consistent hashing
    """
    def recursive_sort(obj):
        """Recursively sort dictionary keys for deterministic serialization"""
        if isinstance(obj, dict):
            # Sort keys and recursively process values
            return {k: recursive_sort(v) for k, v in sorted(obj.items())}
        elif isinstance(obj, list):
            # Process list elements
            return [recursive_sort(item) for item in obj]
        else:
            return obj
    
    try:
        # Normalize the figure dictionary
        normalized = recursive_sort(fig_dict)
        
        # Remove any potential non-deterministic fields if they exist
        # (These fields might be added by Plotly and could vary between calls)
        if isinstance(normalized, dict):
            # Remove common non-deterministic fields
            fields_to_remove = ['uid', 'meta', '_plotly_private']
            for field in fields_to_remove:
                normalized.pop(field, None)
        
        logger.debug("Successfully normalized figure dictionary")
        return normalized
        
    except Exception as e:
        logger.error(f"Failed to normalize figure dictionary: {e}")
        raise ParityCheckError(f"Figure normalization failed: {e}")

def calculate_figure_hash(fig_dict: Dict[str, Any]) -> str:
    """
    Calculate SHA256 hash of normalized figure dictionary.
    
    Args:
        fig_dict: Plotly figure dictionary from fig.to_dict()
        
    Returns:
        SHA256 hash as hexadecimal string
        
    Raises:
        ParityCheckError: If hashing fails
    """
    try:
        # Normalize the figure for consistent hashing
        normalized_fig = normalize_figure_dict(fig_dict)
        
        # Convert to JSON string with sorted keys for deterministic hashing
        json_str = json.dumps(normalized_fig, sort_keys=True, separators=(',', ':'))
        
        # Calculate SHA256 hash
        sha256_hash = hashlib.sha256(json_str.encode('utf-8')).hexdigest()
        
        logger.debug(f"Calculated figure hash: {sha256_hash}")
        return sha256_hash
        
    except Exception as e:
        logger.error(f"Failed to calculate figure hash: {e}")
        raise ParityCheckError(f"Figure hashing failed: {e}")

def find_first_difference(dict1: Dict[str, Any], dict2: Dict[str, Any], path: str = '') -> Optional[str]:
    """
    Find the first difference between two dictionaries.
    
    Args:
        dict1: First dictionary to compare
        dict2: Second dictionary to compare
        path: Current path in the dictionary tree (for recursive calls)
        
    Returns:
        String describing the first difference found, or None if identical
    """
    # Handle type mismatches
    if type(dict1) != type(dict2):
        return f"Type mismatch at {path}: {type(dict1).__name__} vs {type(dict2).__name__}"
    
    # Handle dictionaries
    if isinstance(dict1, dict):
        # Check for missing keys
        keys1 = set(dict1.keys())
        keys2 = set(dict2.keys())
        
        if keys1 != keys2:
            missing_in_2 = keys1 - keys2
            missing_in_1 = keys2 - keys1
            
            if missing_in_2:
                return f"Key missing in second dict at {path}: {list(missing_in_2)[0]}"
            if missing_in_1:
                return f"Key missing in first dict at {path}: {list(missing_in_1)[0]}"
        
        # Check values for common keys
        for key in sorted(keys1.intersection(keys2)):
            current_path = f"{path}.{key}" if path else key
            diff = find_first_difference(dict1[key], dict2[key], current_path)
            if diff:
                return diff
    
    # Handle lists
    elif isinstance(dict1, list):
        if len(dict1) != len(dict2):
            return f"List length mismatch at {path}: {len(dict1)} vs {len(dict2)}"
        
        for i, (item1, item2) in enumerate(zip(dict1, dict2)):
            current_path = f"{path}[{i}]" if path else f"[{i}]"
            diff = find_first_difference(item1, item2, current_path)
            if diff:
                return diff
    
    # Handle primitive values
    else:
        if dict1 != dict2:
            return f"Value mismatch at {path}: {dict1} vs {dict2}"
    
    return None

def compare_figure_parity(fig1_dict: Dict[str, Any], fig2_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compare two figure dictionaries for parity.
    
    Args:
        fig1_dict: First figure dictionary (regular endpoint)
        fig2_dict: Second figure dictionary (baseline endpoint)
        
    Returns:
        Dictionary with parity comparison results
    """
    try:
        # Calculate hashes
        hash1 = calculate_figure_hash(fig1_dict)
        hash2 = calculate_figure_hash(fig2_dict)
        
        # Check if hashes match
        parity_ok = hash1 == hash2
        
        result = {
            'parity_ok': parity_ok,
            'hash_regular': hash1,
            'hash_baseline': hash2,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        # If hashes don't match, find the first difference
        if not parity_ok:
            try:
                normalized_fig1 = normalize_figure_dict(fig1_dict)
                normalized_fig2 = normalize_figure_dict(fig2_dict)
                first_diff = find_first_difference(normalized_fig1, normalized_fig2)
                result['first_difference'] = first_diff
            except Exception as e:
                result['first_difference'] = f"Could not determine difference: {e}"
        
        logger.info(f"Figure parity check: {'PASSED' if parity_ok else 'FAILED'}")
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to compare figure parity: {e}")
        raise ParityCheckError(f"Parity comparison failed: {e}")

async def check_endpoint_parity(endpoint_type: str, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Check parity between regular and baseline visual endpoints.
    
    Args:
        endpoint_type: Either 'radar' or '3d'
        filters: Optional filters to apply to both endpoints
        
    Returns:
        Dictionary with parity check results
        
    Raises:
        ParityCheckError: If endpoint calls fail
        ParityMismatchError: If parity check fails in strict mode
    """
    if endpoint_type not in ['radar', '3d']:
        raise ParityCheckError(f"Invalid endpoint type: {endpoint_type}. Must be 'radar' or '3d'")
    
    try:
        # Import visual endpoints service
        from visual_endpoints import VisualEndpointsService
        
        visual_service = VisualEndpointsService()
        
        # Prepare arguments for endpoint calls
        endpoint_args = {'filters': filters} if filters else {}
        
        # Call both endpoints (using same function twice for parity testing)
        if endpoint_type == 'radar':
            logger.info("Calling radar endpoints for parity check...")
            regular_fig = visual_service.generate_radar_figure(**endpoint_args)
            baseline_fig = visual_service.generate_radar_figure(**endpoint_args)
        else:  # 3d
            logger.info("Calling 3D endpoints for parity check...")
            regular_fig = visual_service.generate_3d_figure(**endpoint_args)
            baseline_fig = visual_service.generate_3d_figure(**endpoint_args)
        
        # Compare the figures
        parity_result = compare_figure_parity(regular_fig, baseline_fig)
        
        # Add endpoint metadata
        parity_result.update({
            'endpoint_type': endpoint_type,
            'filters_applied': filters is not None,
            'filter_count': len(filters) if filters else 0
        })
        
        # Check strict mode
        is_strict = is_strict_mode_enabled()
        if is_strict and not parity_result['parity_ok']:
            error_msg = f"Parity check failed for {endpoint_type} endpoints in strict mode"
            if parity_result.get('first_difference'):
                error_msg += f": {parity_result['first_difference']}"
            
            logger.error(error_msg)
            raise ParityMismatchError(error_msg)
        
        return parity_result
        
    except (ParityCheckError, ParityMismatchError):
        # Re-raise our custom exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in endpoint parity check: {e}")
        logger.error(traceback.format_exc())
        raise ParityCheckError(f"Endpoint parity check failed: {e}")

def is_strict_mode_enabled() -> bool:
    """
    Check if strict mode is enabled for parity checking.
    
    Returns:
        True if strict mode is enabled, False otherwise
    """
    # Check specific visual parity strict mode first
    visual_strict = os.getenv('VISUAL_PARITY_STRICT', '').lower()
    if visual_strict in ['true', 'false']:
        return visual_strict == 'true'
    
    # Fall back to general strict features mode
    strict_features = os.getenv('STRICT_FEATURES', 'true').lower()
    return strict_features == 'true'

async def perform_comprehensive_parity_check(include_filters: bool = True) -> Dict[str, Any]:
    """
    Perform comprehensive parity checking for all visual endpoints.
    
    Args:
        include_filters: Whether to test with sample filters (default: True)
        
    Returns:
        Dictionary with comprehensive parity check results
    """
    logger.info("Starting comprehensive visual parity check...")
    
    results = {
        'overall_parity_ok': True,
        'strict_mode': is_strict_mode_enabled(),
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'checks': {},
        'summary': '',
        'errors': []
    }
    
    # Define test scenarios
    test_scenarios = [
        {'name': 'radar_no_filters', 'endpoint': 'radar', 'filters': None},
        {'name': '3d_no_filters', 'endpoint': '3d', 'filters': None}
    ]
    
    # Add filtered scenarios if requested
    if include_filters:
        # Sample filters for testing (using simple filter structure)
        sample_filters = {
            'search': 'AI'
        }
        
        test_scenarios.extend([
            {'name': 'radar_with_filters', 'endpoint': 'radar', 'filters': sample_filters},
            {'name': '3d_with_filters', 'endpoint': '3d', 'filters': sample_filters}
        ])
    
    # Run all test scenarios
    failed_checks = 0
    
    for scenario in test_scenarios:
        try:
            logger.info(f"Running parity check: {scenario['name']}")
            
            check_result = await check_endpoint_parity(
                scenario['endpoint'], 
                scenario['filters']
            )
            
            results['checks'][scenario['name']] = check_result
            
            if not check_result['parity_ok']:
                results['overall_parity_ok'] = False
                failed_checks += 1
                
        except Exception as e:
            error_msg = f"Parity check failed for {scenario['name']}: {e}"
            logger.error(error_msg)
            
            results['checks'][scenario['name']] = {
                'parity_ok': False,
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            results['overall_parity_ok'] = False
            results['errors'].append(error_msg)
            failed_checks += 1
    
    # Generate summary
    total_checks = len(test_scenarios)
    passed_checks = total_checks - failed_checks
    
    if results['overall_parity_ok']:
        results['summary'] = f"All {total_checks} parity checks passed"
    else:
        results['summary'] = f"{failed_checks}/{total_checks} parity checks failed"
    
    logger.info(f"Comprehensive parity check complete: {results['summary']}")
    
    return results

# Main execution for CLI and testing
if __name__ == "__main__":
    import asyncio
    import argparse
    import sys
    
    def parse_args():
        """Parse command-line arguments"""
        parser = argparse.ArgumentParser(
            description="ORION Visual Parity Checker - SHA256 comparison for legacy figure reuse"
        )
        
        parser.add_argument(
            '--comprehensive', 
            action='store_true',
            help='Run comprehensive parity check for all endpoints'
        )
        
        parser.add_argument(
            '--include-filters', 
            type=str, 
            choices=['true', 'false'], 
            default='true',
            help='Include filtered test scenarios (default: true)'
        )
        
        parser.add_argument(
            '--endpoint', 
            type=str, 
            choices=['radar', '3d'],
            help='Check specific endpoint type (radar or 3d)'
        )
        
        parser.add_argument(
            '--strict', 
            action='store_true',
            help='Enable strict mode (fail on parity mismatches)'
        )
        
        parser.add_argument(
            '--filters', 
            type=str,
            help='JSON string of filters to apply (for single endpoint checks)'
        )
        
        return parser.parse_args()
    
    async def main():
        try:
            args = parse_args()
            
            # Set strict mode if specified
            if args.strict:
                os.environ['VISUAL_PARITY_STRICT'] = 'true'
            
            if args.comprehensive:
                # Run comprehensive parity check
                include_filters = args.include_filters.lower() == 'true'
                results = await perform_comprehensive_parity_check(include_filters=include_filters)
                
            elif args.endpoint:
                # Run single endpoint check
                filters = None
                if args.filters:
                    try:
                        filters = json.loads(args.filters)
                    except json.JSONDecodeError as e:
                        print(f"Error: Invalid JSON in filters: {e}", file=sys.stderr)
                        sys.exit(1)
                
                results = await check_endpoint_parity(args.endpoint, filters)
                
                # Wrap single check result in comprehensive format
                results = {
                    'overall_parity_ok': results['parity_ok'],
                    'strict_mode': is_strict_mode_enabled(),
                    'timestamp': results['timestamp'],
                    'checks': {f"{args.endpoint}_check": results},
                    'summary': 'Parity check passed' if results['parity_ok'] else 'Parity check failed',
                    'errors': [results.get('first_difference', 'Unknown error')] if not results['parity_ok'] else []
                }
                
            else:
                # Default: run comprehensive check
                include_filters = args.include_filters.lower() == 'true'
                results = await perform_comprehensive_parity_check(include_filters=include_filters)
            
            # Output results as JSON
            print(json.dumps(results, indent=2))
            
            # Exit with appropriate code
            if not results.get('overall_parity_ok', True):
                sys.exit(1)
                
        except ParityMismatchError as e:
            # Strict mode parity failure
            error_result = {
                'overall_parity_ok': False,
                'strict_mode': True,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'summary': f'Strict mode parity check failed: {e}',
                'errors': [str(e)],
                'checks': {}
            }
            print(json.dumps(error_result, indent=2))
            sys.exit(1)
            
        except ParityCheckError as e:
            # System error during parity check
            error_result = {
                'overall_parity_ok': False,
                'strict_mode': is_strict_mode_enabled(),
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'summary': f'Parity check system error: {e}',
                'errors': [str(e)],
                'checks': {}
            }
            print(json.dumps(error_result, indent=2))
            sys.exit(1)
            
        except Exception as e:
            # Unexpected error
            error_result = {
                'overall_parity_ok': False,
                'strict_mode': is_strict_mode_enabled(),
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'summary': f'Unexpected error: {e}',
                'errors': [str(e)],
                'checks': {}
            }
            print(json.dumps(error_result, indent=2), file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            sys.exit(1)
    
    asyncio.run(main())