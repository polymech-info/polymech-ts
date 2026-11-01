
import sys
import json
import argparse
import pygadm
import traceback
import hashlib
import os

CACHE_DIR = os.environ.get('GADM_CACHE', './cache/gadm')

def get_cache_path(prefix, value):
    hash_object = hashlib.md5(value.encode('utf-8'))
    hash_hex = hash_object.hexdigest()
    return os.path.join(CACHE_DIR, f"{prefix}_{hash_hex}.json")

def read_cache(path):
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return None
    return None

def write_cache(path, data):
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f)
    except Exception as e:
        sys.stderr.write(f"Cache write failed: {e}\n")

def search_regions(query, content_level=None, geojson=False, admin=None):
    path = get_cache_path(f"search_{content_level if content_level else 'all'}_{'geo' if geojson else 'meta'}_{admin if admin else 'all'}", query)
    cached = read_cache(path)
    if cached:
        print(json.dumps(cached, default=str))
        return

    try:
        # If geojson is requested, we need pygadm.Items to get the geometry
        if geojson:
             # NOTE: This might still fail if name is ambiguous. 
             # Ideally the UI should search first (getting GIDs), then request boundary by ID.
             # If a user requests search+geojson by name, they better be specific.
             kwargs = {'name': [query]}
             if content_level:
                kwargs['content_level'] = int(content_level)
             if admin:
                kwargs['admin'] = admin
             
             try:
                 gdf = pygadm.Items(**kwargs)
             except Exception as e:
                 # Check if query contains comma
                 if ',' in query:
                     first_part = query.split(',')[0].strip()
                     kwargs['name'] = [first_part]
                     try:
                         gdf = pygadm.Items(**kwargs)
                     except:
                         print(json.dumps({"data": []}))
                         return
                 else:
                     raise e
        else:
             # Metadata search -> Use pygadm.Names to find all matches (handles ambiguity)
             kwargs = {'name': query}
             if content_level:
                kwargs['content_level'] = int(content_level)
             if admin:
                kwargs['admin'] = admin
                
             try:
                 gdf = pygadm.Names(**kwargs)
             except Exception as e:
                 # Check if query contains comma
                 if ',' in query:
                     # Try searching for the first part
                     first_part = query.split(',')[0].strip()
                     kwargs['name'] = first_part
                     try:
                         gdf = pygadm.Names(**kwargs)
                     except:
                         # Still failed, raise original error or return empty?
                         # Let's print empty for consistent client handling
                         print(json.dumps({"data": []}))
                         return
                 else:
                     # No comma, propagate empty result
                     print(json.dumps({"data": []}))
                     return

        if gdf is None or gdf.empty:
            print(json.dumps({"data": []}))
            return

        # Convert to list of dicts for JSON serialization
        # safe stringify helper
        def safe_str(v):
            return str(v) if v is not None else ""

        if geojson:
            # Full GeoJSON conversion with manual fallback
            features = []
            cols_props = [c for c in gdf.columns if c != 'geometry']
            
            for index, row in gdf.iterrows():
                properties = {c: safe_str(row[c]) for c in cols_props}
                try:
                    geometry = row['geometry'].__geo_interface__ if row['geometry'] else None
                except:
                    geometry = None
                    
                features.append({
                    "type": "Feature",
                    "properties": properties,
                    "geometry": geometry
                })
            
            output = {
                "type": "FeatureCollection",
                "features": features
            }
        else:
            # Metadata only (from Names or Items)
            results = []
            cols = gdf.columns.tolist()
            for index, row in gdf.iterrows():
                r = {}
                for c in cols:
                    r[c] = safe_str(row[c])
                results.append(r)
            output = {"data": results}
            
        write_cache(path, output)
        print(json.dumps(output, default=str))

    except Exception as e:
        print(json.dumps({"error": traceback.format_exc()}))
        sys.exit(1)

def get_boundary(gadm_id, name, content_level):
    path = get_cache_path("boundary", gadm_id)
    cached = read_cache(path)
    if cached:
        print(json.dumps(cached, default=str))
        return

    try:
        # Use admin code (GID) directly to avoid ambiguity
        # pygadm.Items supports 'admin' to fetch by GID
        kwargs = {'admin': [gadm_id]}
        
        # content_level is not strictly needed if GID is specific, 
        # but passing it doesn't hurt if we want to be explicit, 
        # however 'admin' usually overrides or implies level.
        # Let's rely on GID as the primary key.
            
        gdf = pygadm.Items(**kwargs)
        
        if gdf is None or gdf.empty:
            print(json.dumps({"error": "Region not found"}))
            sys.exit(1)

        # Convert to GeoJSON manually to avoid pandas errors
        features = []
        cols_props = [c for c in gdf.columns if c != 'geometry']
        
        # Helper for safe string conversion
        def safe_str(v):
            return str(v) if v is not None else ""

        for index, row in gdf.iterrows():
            properties = {c: safe_str(row[c]) for c in cols_props}
            try:
                geometry = row['geometry'].__geo_interface__ if row['geometry'] else None
            except:
                geometry = None
                
            features.append({
                "type": "Feature",
                "properties": properties,
                "geometry": geometry
            })
        
        output = {
            "type": "FeatureCollection",
            "features": features
        }
        
        write_cache(path, output)
        print(json.dumps(output, default=str))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

def get_names(admin, content_level=None, depth=1):
    path = get_cache_path(f"names_{admin}_{content_level}_{depth}", "names")
    cached = read_cache(path)
    if cached:
        print(json.dumps(cached, default=str))
        return

    try:
        all_results = []
        
        # Determine starting level
        # If content_level is explicit, start there.
        # Else derive from admin code: e.g. "ESP.6_1" (1 dot) -> Level 1. Next is 2.
        # "ESP" (0 dots) -> Level 0. Next is 1.
        if content_level:
            start_level = int(content_level)
        else:
            # GID format: XXX.L1.L2_1
            # Count dots:
            # ESP -> 0 -> start 1
            # ESP.1_1 -> 1 -> start 2
            start_level = admin.count('.') + 1
            
        # Handle infinite depth (passed as -1 or similar string)
        if str(depth).lower() in ['infinite', 'inf', '-1']:
            limit = 5 # Reasonable cap for GADM (rarely goes beyond level 5)
        else:
            limit = int(depth)

        current_level = start_level
        
        for i in range(limit):
            # Fetch names for this level
            kwargs = {'admin': admin, 'content_level': current_level}
            
            try:
                gdf = pygadm.Names(**kwargs)
            except:
                # Likely level doesn't exist
                break
            
            if gdf is None or gdf.empty:
                # No more levels
                break

            # Convert to list of dicts
            cols = gdf.columns.tolist()
            def safe_str(v):
                return str(v) if v is not None else ""

            for index, row in gdf.iterrows():
                r = {}
                for c in cols:
                    r[c] = safe_str(row[c])
                all_results.append(r)
            
            current_level += 1
        
        output = {"data": all_results}
        write_cache(path, output)
        print(json.dumps(output, default=str))

    except Exception as e:
        print(json.dumps({"error": traceback.format_exc()}))
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='PyGADM Wrapper')
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')

    # Search command
    search_parser = subparsers.add_parser('search', help='Search for regions')
    search_parser.add_argument('--query', required=True, help='Name to search for')
    search_parser.add_argument('--content_level', required=False, help='Content level filter')
    search_parser.add_argument('--geojson', action='store_true', help='Include GeoJSON geometry')
    search_parser.add_argument('--country', required=False, help='Country filter (Admin code or name)')

    # Boundary command
    boundary_parser = subparsers.add_parser('boundary', help='Get region boundary')
    boundary_parser.add_argument('--id', required=True, help='GADM ID (for cache)')
    boundary_parser.add_argument('--name', required=True, help='Region Name')
    boundary_parser.add_argument('--content_level', required=False, help='Content Level')

    # Names command
    names_parser = subparsers.add_parser('names', help='Get region names')
    names_parser.add_argument('--admin', required=True, help='Admin code (e.g. FRA)')
    names_parser.add_argument('--content_level', required=False, help='Content level')
    names_parser.add_argument('--depth', required=False, default=1, help='Depth of recursion (1=default, -1=infinite)')

    args = parser.parse_args()

    if args.command == 'search':
        search_regions(args.query, args.content_level, args.geojson, args.country)
    elif args.command == 'boundary':
        get_boundary(args.id, args.name, args.content_level)
    elif args.command == 'names':
        get_names(args.admin, args.content_level, args.depth)
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == '__main__':
    main()
