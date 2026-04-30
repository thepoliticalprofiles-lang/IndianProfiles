import { useState, useRef, useEffect } from "react";
import { Upload, FileSpreadsheet, Image as ImageIcon, Check, AlertCircle, ChevronRight, Loader2, Archive } from "lucide-react";
import AdminSidebar from "../../components/shared/AdminSidebar";
import { api, formatApiError } from "../../App";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const DataIngestion = () => {
  const [dataFile, setDataFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [locationId, setLocationId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [importing, setImporting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [constituencies, setConstituencies] = useState([]);
  
  const dataInputRef = useRef(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    fetchConstituencies();
  }, []);

  const fetchConstituencies = async () => {
    try {
      const response = await api.get("/constituencies");
      setConstituencies(response.data);
    } catch (err) {
      console.error("Failed to fetch constituencies:", err);
    }
  };

  const handleDataFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['.csv', '.xlsx', '.xls'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validTypes.includes(ext)) {
        setError("Please upload a CSV or Excel file");
        return;
      }
      setDataFile(file);
      setError("");
    }
  };

  const handlePhotoFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        setError("Please upload a ZIP file containing photos");
        return;
      }
      setPhotoFile(file);
      setError("");
    }
  };

  const handleImportData = async () => {
    if (!dataFile) {
      setError("Please select a data file first");
      return;
    }

    setImporting(true);
    setError("");
    setResult(null);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", dataFile);
      if (locationId) formData.append("location_id", locationId);
      if (locationName) formData.append("location_name", locationName);

      setProgress(30);
      
      const response = await api.post("/voters/bulk-import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProgress(100);
      setResult({
        type: "data",
        ...response.data
      });
      setDataFile(null);
      if (dataInputRef.current) dataInputRef.current.value = "";
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setImporting(false);
    }
  };

  const handleImportPhotos = async () => {
    if (!photoFile) {
      setError("Please select a ZIP file first");
      return;
    }

    setUploadingPhotos(true);
    setError("");
    setResult(null);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", photoFile);

      setProgress(30);
      
      const response = await api.post("/voters/bulk-photos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProgress(100);
      setResult({
        type: "photos",
        ...response.data
      });
      setPhotoFile(null);
      if (photoInputRef.current) photoInputRef.current.value = "";
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setUploadingPhotos(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <AdminSidebar />
      
      <main className="admin-content p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
            <span>Admin</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-stone-900">Voter Data Ingestion Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900">Voter Data Ingestion Engine</h1>
          <p className="text-stone-500 mt-1">Bulk import voter data and photos into the system</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-6 h-6 text-emerald-600" />
              <h3 className="font-semibold text-emerald-800">
                {result.type === "data" ? "Data Import Complete!" : "Photo Upload Complete!"}
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {result.type === "data" ? (
                <>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-emerald-600">{result.imported}</p>
                    <p className="text-sm text-stone-500">Records Imported</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-stone-600">{result.total_rows}</p>
                    <p className="text-sm text-stone-500">Total Rows</p>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg p-3">
                  <p className="text-2xl font-bold text-emerald-600">{result.updated}</p>
                  <p className="text-sm text-stone-500">Photos Updated</p>
                </div>
              )}
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-amber-700 mb-2">Warnings ({result.errors.length}):</p>
                <div className="bg-amber-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-amber-700">{err}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Upload Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Step 1: Upload Voter Data */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h2 className="text-lg font-semibold text-stone-900">Upload Voter Data File</h2>
              </div>
              
              <div
                onClick={() => dataInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dataFile 
                    ? 'border-emerald-300 bg-emerald-50' 
                    : 'border-stone-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <input
                  ref={dataInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleDataFileSelect}
                  className="hidden"
                />
                
                {dataFile ? (
                  <div className="flex flex-col items-center">
                    <Check className="w-12 h-12 text-emerald-500 mb-3" />
                    <p className="font-medium text-emerald-700">{dataFile.name}</p>
                    <p className="text-sm text-emerald-600 mt-1">
                      {(dataFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="flex gap-2 mb-3">
                      <FileSpreadsheet className="w-10 h-10 text-emerald-500" />
                      <FileSpreadsheet className="w-10 h-10 text-blue-500" />
                    </div>
                    <p className="font-medium text-stone-700">Drop CSV or Excel file here</p>
                    <p className="text-sm text-stone-500 mt-1">or click to browse</p>
                  </div>
                )}
              </div>

              {/* Location Selection */}
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Assign to Location (Optional)</label>
                  <Select value={locationId || "none"} onValueChange={(v) => setLocationId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select constituency..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {constituencies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Location Name Label</label>
                  <Input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g., Moosarambagh Division"
                  />
                </div>
              </div>

              {/* Import Button */}
              <button
                onClick={handleImportData}
                disabled={!dataFile || importing}
                className="w-full mt-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Process & Import Data
                  </>
                )}
              </button>
            </div>

            {/* Step 2: Upload Voter Photos */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h2 className="text-lg font-semibold text-stone-900">Upload Voter Photos</h2>
              </div>
              
              <div
                onClick={() => photoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  photoFile 
                    ? 'border-emerald-300 bg-emerald-50' 
                    : 'border-stone-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <input
                  ref={photoInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handlePhotoFileSelect}
                  className="hidden"
                />
                
                {photoFile ? (
                  <div className="flex flex-col items-center">
                    <Check className="w-12 h-12 text-emerald-500 mb-3" />
                    <p className="font-medium text-emerald-700">{photoFile.name}</p>
                    <p className="text-sm text-emerald-600 mt-1">
                      {(photoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Archive className="w-12 h-12 text-purple-500 mb-3" />
                    <p className="font-medium text-stone-700">Drop ZIP file here</p>
                    <p className="text-sm text-stone-500 mt-1">Photos named by EPIC Number</p>
                    <p className="text-xs text-stone-400 mt-2">(e.g., ABC1234567.jpg)</p>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Photo Naming Convention</h4>
                <p className="text-sm text-blue-700">
                  Name each photo file with the voter's EPIC number. The system will automatically match photos to voter records.
                </p>
                <div className="mt-2 bg-white rounded p-2">
                  <code className="text-xs text-blue-600">
                    ABC1234567.jpg, XYZ9876543.png, ...
                  </code>
                </div>
              </div>

              {/* Upload Photos Button */}
              <button
                onClick={handleImportPhotos}
                disabled={!photoFile || uploadingPhotos}
                className="w-full mt-4 bg-purple-700 hover:bg-purple-800 disabled:bg-stone-300 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {uploadingPhotos ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading Photos...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    Upload & Match Photos
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {(importing || uploadingPhotos) && (
            <div className="mt-6">
              <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-stone-500 mt-2 text-center">Processing... {progress}%</p>
            </div>
          )}
        </div>

        {/* Column Mapping Info */}
        <div className="mt-6 bg-white rounded-xl border border-stone-200 p-6">
          <h3 className="font-semibold text-stone-900 mb-4">Expected Data Columns</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { field: "epic_number", aliases: "EPIC, EPIC No, Voter ID" },
              { field: "full_name", aliases: "Name, Voter Name" },
              { field: "age", aliases: "Age" },
              { field: "gender", aliases: "Gender" },
              { field: "relative_name", aliases: "Father Name, Father's Name, Husband Name" },
              { field: "house_number", aliases: "House No, House Number" },
              { field: "booth_number", aliases: "Booth No, Booth Number" },
              { field: "part_number", aliases: "Part No, Part Number" },
              { field: "address", aliases: "Address" },
              { field: "mobile_number", aliases: "Mobile, Mobile Number, Phone" },
              { field: "email", aliases: "Email, Email ID" },
            ].map((col) => (
              <div key={col.field} className="bg-stone-50 rounded-lg p-3">
                <p className="font-mono text-sm text-blue-600">{col.field}</p>
                <p className="text-xs text-stone-500 mt-1">{col.aliases}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DataIngestion;
