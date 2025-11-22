import pandas as pd
from typing import Dict, Optional
import io


class ExcelLoaderService:
    """
    Service for loading and parsing Excel files containing plant data.
    Maintains dataframes in memory for each dome section.
    """
    
    def __init__(self):
        self.dome_dataframes: Dict[str, pd.DataFrame] = {}
        self.is_loaded = False
    
    def load_excel_file(self, file_content: bytes) -> Dict[str, any]:
        """
        Load an Excel file from bytes and parse it into dome-specific dataframes.
        
        Args:
            file_content: Bytes content of the Excel file
            
        Returns:
            Dictionary with status information and plant counts
        """
        try:
            # Read the Excel file from bytes
            excel_file = io.BytesIO(file_content)
            df_raw = pd.read_excel(excel_file, header=None)
            
            # Find the row with "Common Name" in the first column (header row)
            header_row_idx = None
            for idx in range(len(df_raw)):
                first_col = str(df_raw.iloc[idx, 0]).strip() if pd.notna(df_raw.iloc[idx, 0]) else ""
                if first_col == "Common Name":
                    header_row_idx = idx
                    break
            
            if header_row_idx is None:
                raise ValueError("Could not find header row with 'Common Name'")
            
            # Get column names from header row and sub-header row
            col_names_main = df_raw.iloc[header_row_idx].values
            col_names_sub = df_raw.iloc[header_row_idx + 1].values
            
            # Build column names by combining main and sub headers
            final_columns = []
            for i in range(len(col_names_main)):
                col_main = str(col_names_main[i]).strip() if pd.notna(col_names_main[i]) else ""
                col_sub = str(col_names_sub[i]).strip() if pd.notna(col_names_sub[i]) else ""
                
                if i in [0, 1, 2, 7]:  # Common Name, Scientific Name, Qty, Notes
                    final_columns.append(col_main)
                elif i in [3, 4]:  # Buy New columns
                    final_columns.append(f"Buy New - {col_sub}" if col_sub else col_main)
                elif i in [5, 6]:  # Move It columns
                    final_columns.append(f"Move It - {col_sub}" if col_sub else col_main)
                elif i == 8:  # Display
                    final_columns.append("Display")
                elif i == 9:  # Stop
                    final_columns.append("Stop")
                else:
                    final_columns.append(f"{col_main} - {col_sub}" if (col_main and col_sub) else (col_main or col_sub or f"Unnamed_{i}"))
            
            # Find dome headers and split data into separate DataFrames
            dome_rows = []
            for idx, row in df_raw.iterrows():
                first_col = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
                if "Dome" in first_col and idx > header_row_idx + 1:  # Skip header rows
                    dome_rows.append((idx, first_col))
            
            # Create a dictionary to store DataFrames for each dome
            dome_dataframes = {}
            
            # Process each dome section
            for i, (dome_start_idx, dome_name) in enumerate(dome_rows):
                # Determine the end of this section (start of next dome, or end of file)
                if i + 1 < len(dome_rows):
                    dome_end_idx = dome_rows[i + 1][0]
                else:
                    dome_end_idx = len(df_raw)
                
                # Extract the data for this dome (skip the dome header row itself)
                dome_data = df_raw.iloc[dome_start_idx + 1:dome_end_idx].copy()
                
                # Set proper column names
                dome_data.columns = final_columns
                
                # Remove rows that are all NaN or empty
                dome_data = dome_data.dropna(how='all')
                
                # Remove rows where Common Name is NaN (these are likely empty separator rows)
                dome_data = dome_data[dome_data['Common Name'].notna()]
                
                # Reset index and set to match Excel row numbers (1-indexed)
                dome_data = dome_data.reset_index(drop=True)
                # Start index from dome_start_idx + 2 (Excel row number: dome header + 1)
                dome_data.index = dome_data.index + dome_start_idx + 2
                
                # Convert 'x' to 1 (True) and NaN to 0 (False) for boolean columns
                boolean_columns = [
                    "Buy New - Won't Survive/Not Worth Moving",
                    "Buy New - Readily Available",
                    "Move It - Can be done by Domes staff",
                    "Move It - Requires consult - might not survive move",
                    "Display"
                ]
                
                for col in boolean_columns:
                    if col in dome_data.columns:
                        # Convert 'x' to 1, everything else (NaN, empty) to 0
                        dome_data[col] = dome_data[col].apply(
                            lambda x: 1 if (pd.notna(x) and str(x).strip().lower() == 'x') else 0
                        )
                
                # Convert Notes NaN to empty string
                if 'Notes' in dome_data.columns:
                    dome_data['Notes'] = dome_data['Notes'].fillna('').astype(str)
                    # Replace 'nan' string with empty string
                    dome_data['Notes'] = dome_data['Notes'].replace('nan', '')
                
                # Convert Stop NaN to 'N/A'
                if 'Stop' in dome_data.columns:
                    dome_data['Stop'] = dome_data['Stop'].fillna('N/A')
                    # Also replace 'nan' string with 'N/A' if it exists
                    dome_data['Stop'] = dome_data['Stop'].replace('nan', 'N/A')
                
                # Add a Dome column
                dome_data['Dome'] = dome_name
                
                # Store in dictionary
                dome_dataframes[dome_name] = dome_data
            
            # Create combined "All" DataFrame with Dome column
            dome_dataframes_with_dome = []
            for dome_name in list(dome_dataframes.keys()):
                if dome_name != 'All':  # Skip if 'All' already exists
                    df = dome_dataframes[dome_name]
                    df_with_dome = df.copy()
                    df_with_dome['Dome'] = dome_name
                    dome_dataframes_with_dome.append(df_with_dome)
                    
                    # Remove Dome column from individual DataFrame if it exists
                    if 'Dome' in df.columns:
                        dome_dataframes[dome_name] = df.drop(columns=['Dome'])
            
            # Create combined "All" DataFrame with Dome column
            if dome_dataframes_with_dome:
                dome_dataframes['All'] = pd.concat(dome_dataframes_with_dome, ignore_index=True)
            
            # Store the dataframes
            self.dome_dataframes = dome_dataframes
            self.is_loaded = True
            
            # Calculate statistics
            dome_counts = {name: len(df) for name, df in dome_dataframes.items()}
            total_plants = sum(count for name, count in dome_counts.items() if name != 'All')
            
            return {
                "success": True,
                "message": "Excel file loaded successfully",
                "dome_counts": dome_counts,
                "total_plants": total_plants,
                "domes": list(dome_dataframes.keys())
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error loading Excel file: {str(e)}"
            }
    
    def get_dome_dataframe(self, dome_name: str) -> Optional[pd.DataFrame]:
        """
        Get a dataframe for a specific dome.
        
        Args:
            dome_name: Name of the dome (e.g., "Tropical Dome", "Desert Dome", "All")
            
        Returns:
            DataFrame for the dome, or None if not found
        """
        return self.dome_dataframes.get(dome_name)
    
    def get_all_domes(self) -> list[str]:
        """
        Get list of all available dome names.
        
        Returns:
            List of dome names
        """
        return list(self.dome_dataframes.keys())
    
    def get_plant_by_index(self, dome_name: str, index: int) -> Optional[dict]:
        """
        Get a plant by its index in a specific dome dataframe.
        
        Args:
            dome_name: Name of the dome
            index: Index of the plant in the dataframe
            
        Returns:
            Dictionary with plant data, or None if not found
        """
        df = self.get_dome_dataframe(dome_name)
        if df is None or index not in df.index:
            return None
        
        plant = df.loc[index].to_dict()
        return plant
    
    def search_plants(self, dome_name: str, search_term: str, search_in: list[str] = None) -> list[dict]:
        """
        Search for plants in a dome dataframe.
        
        Args:
            dome_name: Name of the dome to search in
            search_term: Term to search for
            search_in: List of column names to search in (defaults to Common Name and Scientific Name)
            
        Returns:
            List of plant dictionaries matching the search
        """
        df = self.get_dome_dataframe(dome_name)
        if df is None:
            return []
        
        if search_in is None:
            search_in = ['Common Name', 'Scientific Name']
        
        # Create a mask for matching rows
        mask = pd.Series([False] * len(df))
        for col in search_in:
            if col in df.columns:
                mask |= df[col].astype(str).str.contains(search_term, case=False, na=False)
        
        matching_plants = df[mask]
        return matching_plants.to_dict('records')
    
    def get_statistics(self) -> dict:
        """
        Get statistics about the loaded data.
        
        Returns:
            Dictionary with statistics
        """
        if not self.is_loaded:
            return {
                "is_loaded": False,
                "message": "No Excel file loaded"
            }
        
        stats = {
            "is_loaded": True,
            "domes": {},
            "total_plants": 0
        }
        
        for dome_name, df in self.dome_dataframes.items():
            if dome_name != 'All':
                stats["domes"][dome_name] = {
                    "plant_count": len(df),
                    "columns": list(df.columns)
                }
                stats["total_plants"] += len(df)
        
        return stats

