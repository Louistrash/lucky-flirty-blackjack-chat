# 🔥 Firebase Storage Connection Test Guide

## 🎯 Quick Tests (Browser Console)

Open your browser console (`F12`) and run these commands:

### 1. Quick Storage Test
```javascript
// Quick test to see if Firebase Storage is working
window.quickStorageTest()
```

### 2. Comprehensive Storage Test
```javascript
// Detailed test with full logging
window.testStorageConnectivity()
```

### 3. Manual Storage Retest (after Blaze activation)
```javascript
// After activating Blaze plan, retest storage
window.retestStorage()
```

## 📊 Expected Results

### ✅ With Blaze Plan (Firebase Storage Available)
```
🔥 Re-testing Firebase Storage availability...
📋 Project ID: lucky-flirt
🪣 Storage Bucket: lucky-flirt.firebasestorage.app
📦 Storage instance created
🔍 Testing root list access...
✅ Firebase Storage test successful!
📁 Found X files and Y folders
```

### ⚠️ With Spark Plan (Firebase Storage Not Available)
```
❌ Firebase Storage test failed: FirebaseError: Firebase Storage: User does not have permission to access 'list' on 'gs://lucky-flirt.firebasestorage.app/'
🔐 Storage access denied - check Firebase rules or authentication
ℹ️ FALLBACK STORAGE WORKING (Firebase not available)
```

## 🧪 Manual Testing Steps

1. **Navigate to Admin Panel** (`/admin-page`)
2. **Click "Storage Debug Panel"** button
3. **Click "Retest Storage"** button
4. **Check console** for detailed logs
5. **Upload test image** via Dealer Detail page

## 🔧 Debugging Commands

### Check Current Storage Status
```javascript
// Check if storage is currently available
console.log("Storage Available:", window.firebase?.isStorageAvailable())
```

### Test Upload Functionality
```javascript
// Test upload with actual file (via dealer edit page)
// 1. Go to /dealer-detail/frederique_001
// 2. Click "Edit Dealer"
// 3. Try uploading an image
// 4. Check console for storage method used
```

## 📝 Expected Logs During Upload

### Firebase Storage (Blaze Plan)
```
File uploaded successfully to Firebase Storage: https://firebasestorage.googleapis.com/...
Storage method: firebase
```

### Local Fallback (Spark Plan)
```
Firebase Storage is not available - using local fallback storage
This is expected for projects not on the Blaze pricing plan (since October 2024)
Using local image storage for: dealers/frederique_001/outfits/stage_0/image.jpg
Storage method: local
```

## 🎯 Status Indicators

- ✅ **Green**: Firebase Storage working
- ⚠️ **Yellow**: Using fallback storage (expected on Spark)
- ❌ **Red**: Error in both systems

## 🔄 After Blaze Plan Activation

1. Run `window.retestStorage()` in console
2. Refresh the page
3. Test upload functionality
4. Should see Firebase Storage URLs instead of base64

---

**Note**: The app works perfectly with both storage methods. Firebase Storage provides better performance and scalability, while local storage ensures the app works on all plans. 