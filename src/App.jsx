Vercelimport React, { useState, useEffect, useCallback } from 'react';
import { Search, Database, Settings, X, Loader2, AlertCircle } from 'lucide-react';

const App = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [csvUrl, setCsvUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  // Default Google Sheet CSV URL (Updated to user's provided link)
  const defaultCsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6tk1Vr9yFkh8sUOqYxAt7iazLYjSb0grXXbDiHHvRq1askrEF8ahhnixwNSku1nncbkDkMqyrZ595/pub?output=csv';

  // Load CSV URL from localStorage on component mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('csvUrl') || defaultCsvUrl;
    setCsvUrl(savedUrl);
    setCustomUrl(savedUrl);
  }, [defaultCsvUrl]); // Include defaultCsvUrl in dependencies if it could change, but here it's constant

  // Robust CSV parsing function adapted for React state
  const parseCSV = (text) => {
    const rows = [];
    let current = [];
    let inQuotes = false;
    let field = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        current.push(field.trim()); // Trim field content
        field = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        // Handle both \n and \r\n line endings
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip the next \n if present
        }
        current.push(field.trim());
        rows.push(current);
        current = [];
        field = '';
      } else {
        field += char;
      }
    }

    // Push the last field and row if anything remains
    if (field.trim() || current.length > 0) {
      current.push(field.trim());
      rows.push(current);
    }
    
    // Filter out completely empty rows that might result from trailing newlines
    return rows.filter(row => row.some(cell => cell !== ''));
  };

  // Header mapping function to standardize column names
  const mapHeaders = (headers) => {
    const headerMap = {};
    
    // Define potential column name variations
    const nameVariations = ['name', 'fullname', 'full name', 'person', 'voter'];
    const barangayVariations = ['barangay', 'brgy', 'barrio', 'location', 'area'];
    const precinctVariations = ['precinct no.', 'precinct number', 'precinct', 'precinct no', 'precinct #'];
    
    headers.forEach((header, index) => {
      const normalized = header.trim().toLowerCase();
      
      if (nameVariations.some(variation => normalized.includes(variation))) {
        // Use the first match found for each standard column
        if (headerMap.name === undefined) headerMap.name = index;
      } else if (barangayVariations.some(variation => normalized.includes(variation))) {
        if (headerMap.barangay === undefined) headerMap.barangay = index;
      } else if (precinctVariations.some(variation => normalized.includes(variation))) {
        if (headerMap.precinct === undefined) headerMap.precinct = index;
      }
    });
    
    return headerMap;
  };

  // Fetch and process CSV data using the current URL
  const fetchData = useCallback(async (url) => {
    if (!url) return;
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV. HTTP status: ${response.status}`);
      }
      
      const csvText = await response.text();
      const rows = parseCSV(csvText);
      
      if (rows.length < 2) {
        throw new Error('CSV file is empty or invalid. Check the sheet publication status.');
      }
      
      const headers = rows[0];
      const dataRows = rows.slice(1);
      const headerMap = mapHeaders(headers);
      
      // Validate required columns
      if (headerMap.name === undefined) {
        throw new Error('Required "Name" column not found. Check CSV header names.');
      }
      
      // Process data rows
      const processedData = dataRows
        .map((row, index) => {
          const name = row[headerMap.name] || '';
          const barangay = headerMap.barangay !== undefined ? row[headerMap.barangay] : '';
          const precinct = headerMap.precinct !== undefined ? row[headerMap.precinct] : '';
          
          return {
            id: index,
            name: name.trim(),
            barangay: barangay.trim(),
            precinct: precinct.trim()
          };
        })
        .filter(item => item.name); // Remove rows where the main name column is empty
      
      setData(processedData);
      setFilteredData(processedData.slice(0, 100)); // Initial view limit
      
    } catch (err) {
      setError(err.message);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data when CSV URL changes
  useEffect(() => {
    if (csvUrl) {
      fetchData(csvUrl);
    }
  }, [csvUrl, fetchData]);

  // Search handler (multi-term matching)
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // If query is empty, show the first 100 records of the full dataset
      setFilteredData(data.slice(0, 100));
      return;
    }
    
    // Normalize search terms: split by space and filter out empty strings
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term);
    
    // Filter logic: The name must contain ALL search terms
    const results = data.filter(item => {
      const itemName = item.name.toLowerCase();
      return searchTerms.every(term => itemName.includes(term));
    });
    
    // Limit displayed results to 100
    setFilteredData(results.slice(0, 100));
  };

  // Save CSV URL to localStorage and trigger reload
  const handleSaveUrl = () => {
    if (customUrl.trim()) {
      localStorage.setItem('csvUrl', customUrl.trim());
      setCsvUrl(customUrl.trim());
      setShowSettings(false);
    }
  };

  // Reset to default URL and trigger reload
  const handleResetUrl = () => {
    localStorage.setItem('csvUrl', defaultCsvUrl);
    setCsvUrl(defaultCsvUrl);
    setCustomUrl(defaultCsvUrl);
    setShowSettings(false);
  };

  // Apply a custom font for aesthetics
  const appStyle = {
    fontFamily: 'Inter, sans-serif'
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={appStyle}>
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Directory Lookup</h1>
                <p className="text-indigo-200 text-sm">Search and find records efficiently</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-400 px-4 py-2 rounded-lg transition-colors shadow-md"
            >
              <Settings className="h-5 w-5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-8 border border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name (all words must match)..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-4 focus:ring-indigo-200 focus:border-indigo-600 outline-none transition-all text-lg"
            />
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap items-center justify-between mt-4 text-sm text-slate-600">
            <div className="flex items-center space-x-4">
              <span className="font-medium">Total records: <span className="text-indigo-600 font-bold">{data.length.toLocaleString()}</span></span>
              <span>Showing: <span className="font-bold">{filteredData.length.toLocaleString()}</span></span>
            </div>
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="text-indigo-600 hover:text-indigo-500 flex items-center space-x-1 mt-2 sm:mt-0"
              >
                <X className="h-4 w-4" />
                <span>Clear search</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-lg">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            <span className="mt-4 text-xl text-slate-600">Loading data from CSV...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-100 border-l-4 border-red-500 rounded-xl p-6 mb-8 shadow-md">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 text-lg">Data Loading Failed</h3>
                <p className="text-red-600 mt-1 text-sm">{error}</p>
                <p className="text-red-600 mt-2 text-xs">Please verify the URL in Settings and ensure the sheet is published correctly.</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100">
            {filteredData.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-xl font-medium">No records found</p>
                <p className="text-sm mt-2">Try simplifying your search terms or checking the data source.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider sticky left-0 bg-slate-100">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Barangay</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Precinct No.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredData.map((item, index) => (
                      <tr key={item.id} className="hover:bg-indigo-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap sticky left-0 bg-white hover:bg-indigo-50/50">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">{item.barangay || '—'}</td>
                        <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">{item.precinct || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Result Limit Indicator */}
            {searchQuery && filteredData.length >= 100 && (
              <div className="bg-amber-50 border-t border-amber-200 px-6 py-3">
                <p className="text-amber-800 text-sm text-center font-medium">
                  Showing the first 100 matching results. Please narrow your search for more specific results.
                </p>
              </div>
            )}
            {!searchQuery && data.length > 100 && (
              <div className="bg-slate-50 border-t border-slate-200 px-6 py-3">
                <p className="text-slate-600 text-sm text-center">
                  Displaying a sample of the first 100 records (Total: {data.length.toLocaleString()}). Use the search bar to find specific entries.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-3xl max-w-lg w-full transform transition-all scale-100">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                <Settings className="h-6 w-6 text-indigo-600"/>
                <span>Data Source Settings</span>
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-indigo-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Google Sheet CSV URL
              </label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm"
              />
              
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600">
                <p className="font-medium mb-1">Current Active URL:</p>
                <p className="truncate text-xs">{csvUrl}</p>
                <p className="mt-2 text-xs text-slate-500">
                  <span className="font-semibold">Note:</span> The URL must be the public link generated by the "File &gt; Share &gt; Publish to the web" option in Google Sheets, specifically with the `output=csv` parameter.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={handleSaveUrl}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg transition-colors font-semibold shadow-md active:shadow-none"
                  disabled={customUrl.trim() === csvUrl}
                >
                  Save & Reload Data
                </button>
                <button
                  onClick={handleResetUrl}
                  className="px-4 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Reset to Default
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-3 text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center text-slate-500 text-xs">
            <p>Directory Lookup Tool • Built with React and Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;