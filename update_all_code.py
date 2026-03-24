import os
import datetime
import hashlib

# Configuration
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(ROOT_DIR, 'all_code.txt')

# Directories to ignore completely
IGNORE_DIRS = {
    '.git', 'node_modules', '__pycache__', 'dist', 'venv', '.idea', '.vscode', 
    'build', 'coverage', 'qrcodes_output', 'static', 'public', 'assets'
}

# Files to ignore completely
IGNORE_FILES = {
    'all_code.txt', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 
    'gulangyu.db', '.DS_Store', 'ngrok.exe', 'update_all_code.py', 'merge_code.py'
}

# Extensions to include as source code
INCLUDE_EXTS = {
    '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c', '.h', 
    '.css', '.scss', '.less', '.html', '.json', '.md', '.txt', '.xml', 
    '.yaml', '.yml', '.ini', '.cfg', '.conf', '.sh', '.bat', '.ps1', '.svg'
}

def is_source_file(filename):
    ext = os.path.splitext(filename)[1].lower()
    return ext in INCLUDE_EXTS

def get_file_info(filepath):
    stat = os.stat(filepath)
    return {
        'path': os.path.relpath(filepath, ROOT_DIR).replace('\\', '/'),
        'size': stat.st_size,
        'mtime': datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
        'is_source': is_source_file(filepath)
    }

def generate_snapshot():
    files_data = []
    
    print(f"Scanning directory: {ROOT_DIR}")
    
    # Walk directory
    for root, dirs, files in os.walk(ROOT_DIR):
        # Modify dirs in-place to skip ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if file in IGNORE_FILES:
                continue
            
            filepath = os.path.join(root, file)
            
            # Check if it's a source file we want to capture
            if is_source_file(file):
                try:
                    info = get_file_info(filepath)
                    files_data.append(info)
                except Exception as e:
                    print(f"Error accessing {filepath}: {e}")

    # Sort files by path
    files_data.sort(key=lambda x: x['path'])
    
    timestamp = datetime.datetime.now().isoformat()
    
    print(f"Found {len(files_data)} source files. Writing to {OUTPUT_FILE}...")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        # 1. Header
        f.write("================================================================================\n")
        f.write("PROJECT CODE SNAPSHOT\n")
        f.write(f"Timestamp: {timestamp}\n")
        f.write(f"Root Directory: {ROOT_DIR}\n")
        f.write(f"Total Files: {len(files_data)}\n")
        f.write("================================================================================\n\n")
        
        # 2. File Index
        f.write("FILE INDEX:\n")
        for item in files_data:
            f.write(f"{item['path']} ({item['size']} bytes)\n")
        f.write("\n================================================================================\n\n")
        
        # 3. File Contents
        for item in files_data:
            f.write(f"--- START FILE: {item['path']} ---\n")
            f.write(f"Metadata: Size={item['size']} bytes, Modified={item['mtime']}\n")
            f.write("Content:\n")
            
            try:
                with open(os.path.join(ROOT_DIR, item['path']), 'r', encoding='utf-8', errors='replace') as source_f:
                    content = source_f.read()
                    f.write(content)
                    # Ensure newline at end of file content
                    if content and not content.endswith('\n'):
                        f.write('\n')
            except Exception as e:
                f.write(f"[Error reading file content: {e}]\n")
                
            f.write(f"--- END FILE: {item['path']} ---\n")
            f.write("\n" + "="*80 + "\n\n")

    # 4. Calculate SHA-256
    print("Calculating SHA-256 checksum...")
    sha256_hash = hashlib.sha256()
    with open(OUTPUT_FILE, "rb") as f:
        # Read and update hash string value in blocks of 4K
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    
    checksum = sha256_hash.hexdigest()
    
    # Append checksum
    with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
        f.write(f"SNAPSHOT SHA-256 CHECKSUM: {checksum}\n")
        
    print(f"Snapshot generated successfully.")
    print(f"SHA-256: {checksum}")

if __name__ == "__main__":
    generate_snapshot()
