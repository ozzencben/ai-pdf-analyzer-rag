import hashlib

def calculate_hash_file(file_path: str) -> str:
  hash_obj = hashlib.sha256()
  with open(file_path, "rb") as file:
    while chunk := file.read(64 * 1024):
      hash_obj.update(chunk)

  return hash_obj.hexdigest()