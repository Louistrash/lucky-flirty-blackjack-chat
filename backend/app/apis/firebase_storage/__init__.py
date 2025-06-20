from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
import json
import base64
from datetime import datetime, timedelta
import tempfile
import aiofiles
import pathlib
import io

# PIL/Pillow imports
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("⚠️ PIL/Pillow not available. Install with: pip install Pillow")

# Firebase imports
try:
    import firebase_admin
    from firebase_admin import credentials, storage as admin_storage
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("⚠️ Firebase Admin SDK not available. Install with: pip install firebase-admin")

router = APIRouter(prefix="/firebase-storage", tags=["Firebase Storage"])

# Initialize Firebase Admin SDK
firebase_app = None
firebase_bucket = None

def convert_to_webp(image_data: bytes, quality: int = 85, max_width: int = 1200) -> bytes:
    """Convert image to WebP format for optimal web delivery"""
    if not PIL_AVAILABLE:
        print("⚠️ PIL not available, returning original image data")
        return image_data
        
    try:
        # Open image with PIL
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary (WebP doesn't support all formats)
        if image.mode in ('RGBA', 'LA', 'P'):
            # Convert to RGB, using white background for transparency
            rgb_image = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            if image.mode in ('RGBA', 'LA'):
                rgb_image.paste(image, mask=image.split()[-1])  # Use alpha channel as mask
            image = rgb_image
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if too large (maintain aspect ratio)
        if image.width > max_width:
            ratio = max_width / image.width
            new_height = int(image.height * ratio)
            image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)
            print(f"🔄 Resized image to {max_width}x{new_height}")
        
        # Convert to WebP
        output = io.BytesIO()
        image.save(output, format='WEBP', quality=quality, optimize=True)
        webp_data = output.getvalue()
        
        original_kb = len(image_data) / 1024
        webp_kb = len(webp_data) / 1024
        reduction = ((original_kb - webp_kb) / original_kb) * 100
        
        print(f"🗜️ WebP conversion: {original_kb:.1f}KB → {webp_kb:.1f}KB ({reduction:.1f}% reduction)")
        
        return webp_data
        
    except Exception as e:
        print(f"❌ WebP conversion failed: {e}")
        # Return original data if conversion fails
        return image_data

def init_firebase():
    """Initialize Firebase Admin SDK"""
    global firebase_app, firebase_bucket
    
    if not FIREBASE_AVAILABLE:
        print("❌ Firebase Admin SDK not available")
        return False
    
    try:
        # Try to get existing app
        firebase_app = firebase_admin.get_app()
        print("✅ Using existing Firebase app")
    except ValueError:
        # App doesn't exist, create it
        try:
            # Try to get service account from environment
            service_account_info = None
            
            # Try environment variable for service account JSON
            service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")
            if service_account_json:
                try:
                    service_account_info = json.loads(service_account_json)
                    print("🔑 Using service account from environment variable")
                except json.JSONDecodeError:
                    print("❌ Invalid JSON in FIREBASE_SERVICE_ACCOUNT environment variable")
            
            # Try Google Application Credentials path
            if not service_account_info:
                cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
                if cred_path and os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    firebase_app = firebase_admin.initialize_app(cred)
                    print(f"🔑 Using service account from {cred_path}")
                else:
                    print("❌ No valid Firebase credentials found")
                    return False
            else:
                # Use service account info from environment
                cred = credentials.Certificate(service_account_info)
                firebase_app = firebase_admin.initialize_app(cred)
                
        except Exception as e:
            print(f"❌ Failed to initialize Firebase: {e}")
            return False
    
    try:
        # Get storage configuration
        config = get_storage_config()
        bucket_name = config.get('storage_bucket', 'flirty-chat-a045e.firebasestorage.app')
        
        # Initialize bucket
        firebase_bucket = admin_storage.bucket(bucket_name)
        print(f"✅ Firebase Storage configured with bucket: {bucket_name}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to configure Firebase Storage: {e}")
        return False

# --- Health Check ---
@router.get("/health")
async def health_check():
    """Check Firebase Storage health"""
    try:
        if firebase_bucket is None:
            # Try to initialize if not already done
            if not init_firebase():
                return {
                    "status": "error",
                    "message": "Firebase Storage not available",
                    "firebase_available": FIREBASE_AVAILABLE,
                    "bucket_initialized": False
                }
        
        # Test bucket access
        config = get_storage_config()
        return {
            "status": "healthy",
            "message": "Firebase Storage is available",
            "firebase_available": FIREBASE_AVAILABLE,
            "bucket_initialized": firebase_bucket is not None,
            "bucket_name": config.get('storage_bucket'),
            "project_id": config.get('project_id')
        }
        
    except Exception as e:
        return {
            "status": "error", 
            "message": f"Firebase Storage error: {str(e)}",
            "firebase_available": FIREBASE_AVAILABLE,
            "bucket_initialized": False
        }

# --- File Upload Models ---
class UploadResponse(BaseModel):
    success: bool
    message: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    storage_method: Optional[str] = None
    download_url: Optional[str] = None

# --- Upload Routes ---
@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Form("uploads"),
    convert_webp: bool = Form(True),
    webp_quality: int = Form(85)
):
    """Upload file to Firebase Storage with optional WebP conversion"""
    try:
        if firebase_bucket is None:
            if not init_firebase():
                raise HTTPException(status_code=500, detail="Firebase Storage not available")
        
        # Read file content
        file_content = await file.read()
        content_type = file.content_type
        file_ext = pathlib.Path(file.filename).suffix.lower() if file.filename else ""
        
        # Convert to WebP if it's an image and conversion is enabled
        if convert_webp and content_type and content_type.startswith('image/'):
            try:
                webp_content = convert_to_webp(file_content, quality=webp_quality)
                file_content = webp_content
                content_type = 'image/webp'
                file_ext = '.webp'
                print("✅ Image converted to WebP format")
            except Exception as e:
                print(f"⚠️ WebP conversion failed, using original: {e}")
        
        # Generate unique filename with correct extension
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = f"{folder}/{unique_filename}"
        
        # Upload to Firebase Storage
        blob = firebase_bucket.blob(file_path)
        blob.upload_from_string(file_content, content_type=content_type)
        
        # Make file publicly accessible
        blob.make_public()
        
        # Get public URL
        public_url = blob.public_url
        
        return UploadResponse(
            success=True,
            message="File uploaded successfully",
            file_url=public_url,
            file_name=unique_filename,
            storage_method="firebase_storage",
            download_url=public_url
        )
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return UploadResponse(
            success=False,
            message=f"Upload failed: {str(e)}"
        )

# --- Configuration ---
def get_storage_config() -> Dict[str, Any]:
    """Get Firebase Storage configuration from environment variables"""
    try:
        config = {
            'project_id': os.getenv('FIREBASE_PROJECT_ID', 'flirty-chat-a045e'),
            'storage_bucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'flirty-chat-a045e.firebasestorage.app'),
        }
        print("📊 Using environment storage config")
        return config
    except Exception as e:
        print(f"Error getting storage config: {e}")
        # Fallback to default
        config = {
            'project_id': 'flirty-chat-a045e',
            'storage_bucket': 'flirty-chat-a045e.firebasestorage.app',
        }
        print("📊 Using default storage config")
        return config

# Initialize Firebase on module load
init_firebase() 