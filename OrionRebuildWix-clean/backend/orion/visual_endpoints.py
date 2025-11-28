#!/usr/bin/env python3
"""
ORION Visual Endpoints - Node.js to Python Bridge
Provides interface for calling legacy visualization functions from Node.js routes.

GOLDEN RULE: Return exact legacy figures with no modifications.
All functions must use existing legacy_adapter functions for byte-identical output.
"""

import sys
import os
import json
import logging
import traceback
from typing import Dict, Any, Optional, List
import pandas as pd

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add current directory to path for local imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from legacy_adapter import build_trend_radar, build_scatter_3d
    from data_loader import ORIONDataLoader
    logger.info("Successfully imported legacy_adapter and data_loader")
except ImportError as e:
    logger.error(f"Failed to import required modules: {e}")
    sys.exit(1)

class VisualEndpointsService:
    """Service class for handling visual endpoint requests from Node.js"""
    
    def __init__(self):
        self.data_loader = ORIONDataLoader()
        self._merged_data = None
        logger.info("VisualEndpointsService initialized")
    
    def get_merged_dataframe(self, force_reload: bool = False) -> pd.DataFrame:
        """
        Get merged dataset with legacy clustering data
        
        Args:
            force_reload: Whether to force reload data from files
            
        Returns:
            Merged DataFrame with legacy structure
        """
        if self._merged_data is None or force_reload:
            try:
                logger.info("Loading merged dataframe with legacy clustering...")
                self._merged_data = self.data_loader.merge_data()
                logger.info(f"Loaded merged data: {len(self._merged_data)} rows, {len(self._merged_data.columns)} columns")
                
                # Log sample of columns for debugging
                logger.info(f"Available columns: {list(self._merged_data.columns)}")
                
                return self._merged_data
            except Exception as e:
                logger.error(f"Failed to load merged dataframe: {e}")
                raise
        
        return self._merged_data
    
    def generate_radar_figure(self, 
                             filters: Optional[Dict[str, Any]] = None,
                             show_connections: Optional[Dict[str, bool]] = None,
                             show_node_titles: Optional[Dict[str, bool]] = None) -> Dict[str, Any]:
        """
        Generate legacy trend radar figure
        
        Args:
            filters: Optional filters to apply to data
            show_connections: Dict with 'show' key to enable connections
            show_node_titles: Dict with 'titles' key to enable node titles
            
        Returns:
            Plotly figure as dictionary (fig.to_dict())
        """
        try:
            logger.info("Generating legacy trend radar figure...")
            
            # Get merged dataframe
            df = self.get_merged_dataframe()
            
            # Apply filters if provided
            if filters:
                df = self._apply_filters(df, filters)
                logger.info(f"Applied filters, remaining rows: {len(df)}")
            
            # Generate legacy radar using exact legacy function
            fig = build_trend_radar(
                df=df,
                show_connections=show_connections,
                show_node_titles=show_node_titles
            )
            
            logger.info("Successfully generated legacy trend radar figure")
            
            # Convert to dictionary for JSON response with numpy array handling
            import json
            fig_dict = fig.to_dict()
            
            # Ensure all numpy arrays are converted to lists for JSON serialization
            def convert_numpy_arrays(obj):
                if hasattr(obj, 'tolist'):  # numpy array
                    return obj.tolist()
                elif isinstance(obj, dict):
                    return {k: convert_numpy_arrays(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_numpy_arrays(item) for item in obj]
                else:
                    return obj
            
            return convert_numpy_arrays(fig_dict)
            
        except Exception as e:
            logger.error(f"Error generating radar figure: {e}")
            logger.error(traceback.format_exc())
            raise
    
    def generate_3d_figure(self, 
                          filters: Optional[Dict[str, Any]] = None,
                          camera_settings: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate legacy 3D scatter figure
        
        Args:
            filters: Optional filters to apply to data
            camera_settings: Optional camera settings for 3D view
            
        Returns:
            Plotly figure as dictionary (fig.to_dict())
        """
        try:
            logger.info("Generating legacy 3D scatter figure...")
            
            # Get merged dataframe
            df = self.get_merged_dataframe()
            
            # Apply filters if provided
            if filters:
                df = self._apply_filters(df, filters)
                logger.info(f"Applied filters, remaining rows: {len(df)}")
            
            # Generate legacy 3D scatter using exact legacy function signature
            fig = build_scatter_3d(df)
            
            logger.info("Successfully generated legacy 3D scatter figure")
            
            # Convert to dictionary for JSON response with numpy array handling
            import json
            fig_dict = fig.to_dict()
            
            # Ensure all numpy arrays are converted to lists for JSON serialization
            def convert_numpy_arrays(obj):
                if hasattr(obj, 'tolist'):  # numpy array
                    return obj.tolist()
                elif isinstance(obj, dict):
                    return {k: convert_numpy_arrays(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_numpy_arrays(item) for item in obj]
                else:
                    return obj
            
            return convert_numpy_arrays(fig_dict)
            
        except Exception as e:
            logger.error(f"Error generating 3D figure: {e}")
            logger.error(traceback.format_exc())
            raise
    
    def _apply_filters(self, df: pd.DataFrame, filters: Dict[str, Any]) -> pd.DataFrame:
        """
        Apply filters to dataframe based on legacy structure
        
        Args:
            df: Input dataframe
            filters: Filter specifications
            
        Returns:
            Filtered dataframe
        """
        filtered_df = df.copy()
        
        # Apply search filter if provided
        if 'search' in filters and filters['search']:
            search_term = str(filters['search']).lower()
            mask = (
                filtered_df['Title'].str.lower().str.contains(search_term, na=False) |
                filtered_df.get('Description', pd.Series(['']*len(filtered_df))).str.lower().str.contains(search_term, na=False) |
                filtered_df.get('Tags', pd.Series(['']*len(filtered_df))).str.lower().str.contains(search_term, na=False)
            )
            filtered_df = filtered_df[mask]
        
        # Apply type filter if provided
        if 'types' in filters and filters['types']:
            if isinstance(filters['types'], list):
                filtered_df = filtered_df[filtered_df['Driving Force'].isin(filters['types'])]
            else:
                filtered_df = filtered_df[filtered_df['Driving Force'] == filters['types']]
        
        # Apply STEEP filter if provided
        if 'steep' in filters and filters['steep']:
            if 'STEEP Category' in filtered_df.columns:
                if isinstance(filters['steep'], list):
                    filtered_df = filtered_df[filtered_df['STEEP Category'].isin(filters['steep'])]
                else:
                    filtered_df = filtered_df[filtered_df['STEEP Category'] == filters['steep']]
        
        # Apply cluster filter if provided
        if 'clusters' in filters and filters['clusters']:
            if 'Cluster' in filtered_df.columns:
                if isinstance(filters['clusters'], list):
                    filtered_df = filtered_df[filtered_df['Cluster'].isin(filters['clusters'])]
                else:
                    filtered_df = filtered_df[filtered_df['Cluster'] == filters['clusters']]
        
        return filtered_df

def main():
    """
    Main entry point for command-line execution from Node.js
    Expects JSON input via stdin with command and parameters
    """
    try:
        # Read input from stdin
        input_data = sys.stdin.read().strip()
        if not input_data:
            raise ValueError("No input data provided")
        
        # Parse JSON input
        request = json.loads(input_data)
        command = request.get('command')
        params = request.get('params', {})
        
        logger.info(f"Executing command: {command}")
        logger.info(f"Parameters: {params}")
        
        # Initialize service
        service = VisualEndpointsService()
        
        # Execute command
        if command == 'radar':
            result = service.generate_radar_figure(
                filters=params.get('filters'),
                show_connections=params.get('show_connections'),
                show_node_titles=params.get('show_node_titles')
            )
        elif command == '3d':
            result = service.generate_3d_figure(
                filters=params.get('filters'),
                camera_settings=params.get('camera_settings')
            )
        elif command == 'baseline_radar':
            # Identical to radar for parity checking
            result = service.generate_radar_figure(
                filters=params.get('filters'),
                show_connections=params.get('show_connections'),
                show_node_titles=params.get('show_node_titles')
            )
        elif command == 'baseline_3d':
            # Identical to 3d for parity checking
            result = service.generate_3d_figure(
                filters=params.get('filters'),
                camera_settings=params.get('camera_settings')
            )
        else:
            raise ValueError(f"Unknown command: {command}")
        
        response = {
            'success': True,
            'data': result,
            'command': command,
            'timestamp': pd.Timestamp.now().isoformat()
        }
        
        print(json.dumps(response))
        logger.info(f"Successfully completed command: {command}")
        
    except Exception as e:
        # Return error response
        error_response = {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc(),
            'timestamp': pd.Timestamp.now().isoformat()
        }
        
        print(json.dumps(error_response))
        logger.error(f"Command failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()