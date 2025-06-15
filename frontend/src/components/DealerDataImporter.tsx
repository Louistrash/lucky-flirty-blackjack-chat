import React, { useState } from "react";
import { seedDummyDealers, clearAllDealers } from "../utils/adminDealerManager";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

interface ImportResult {
  added: number;
  skipped: number;
  errors: string[];
}

const DealerDataImporter: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [clearResult, setClearResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImportDummyData = async () => {
    setIsImporting(true);
    setError(null);
    setImportResult(null);
    
    try {
      const result = await seedDummyDealers();
      setImportResult(result);
      console.log("Import completed:", result);
    } catch (err) {
      console.error("Import failed:", err);
      setError(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm("Are you sure you want to delete all dealer data? This action cannot be undone!")) {
      return;
    }

    setIsClearing(true);
    setError(null);
    setClearResult(null);
    
    try {
      const deletedCount = await clearAllDealers();
      setClearResult(deletedCount);
      console.log("Clear completed:", deletedCount);
    } catch (err) {
      console.error("Clear failed:", err);
      setError(`Deletion failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-amber-400 flex items-center">
          <span className="mr-2">📦</span>
          Dealer Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Import Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Import Dummy Data</h3>
            <p className="text-slate-400 text-sm mb-4">
              Import predefined dealers to get started quickly. 
              Existing dealers will be skipped.
            </p>
            <Button
              onClick={handleImportDummyData}
              disabled={isImporting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                <>
                  <span className="mr-2">⬇️</span>
                  Import Dummy Dealers
                </>
              )}
            </Button>
          </div>

          {/* Import Results */}
          {importResult && (
            <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4">
              <h4 className="text-green-400 font-semibold mb-2">✅ Import Completed</h4>
              <div className="text-sm text-green-300 space-y-1">
                <p>• {importResult.added} dealers added</p>
                <p>• {importResult.skipped} dealers skipped (already existed)</p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-400">Errors:</p>
                    <ul className="text-red-300 text-xs ml-4">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clear Section */}
        <div className="space-y-4 border-t border-slate-700 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Clean Database</h3>
            <p className="text-slate-400 text-sm mb-4">
              ⚠️ Delete all dealer data from the database. This action cannot be undone!
            </p>
            <Button
              onClick={handleClearAllData}
              disabled={isClearing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isClearing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <span className="mr-2">🗑️</span>
                  Delete All Dealers
                </>
              )}
            </Button>
          </div>

          {/* Clear Results */}
          {clearResult !== null && (
            <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
              <h4 className="text-red-400 font-semibold mb-2">🗑️ Deletion Completed</h4>
              <p className="text-sm text-red-300">
                {clearResult} dealers deleted from the database
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
            <h4 className="text-red-400 font-semibold mb-2">❌ Error</h4>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Information */}
        <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-2">ℹ️ Information</h4>
          <div className="text-sm text-blue-300 space-y-1">
            <p>• Dummy data contains realistic casino dealers</p>
            <p>• All dealers have outfits and game statistics</p>
            <p>• After import you can edit dealers via Dealer Management</p>
            <p>• Homepage automatically shows active dealers</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DealerDataImporter; 