import React, { useState } from 'react';
import { RefreshCw, Database, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { updateBarracasWithInstagram, updateBarracasWithInstagramDryRun } from '../utils/migrationUtils';

const InstagramMigration: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      let migrationResult;
      
      if (isDryRun) {
        console.log('Running dry run...');
        migrationResult = await updateBarracasWithInstagramDryRun();
      } else {
        console.log('Running actual migration...');
        migrationResult = await updateBarracasWithInstagram();
      }
      
      setResult(migrationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Instagram Migration
        </h2>
      </div>

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          This migration updates existing barracas with Instagram data from their original registrations.
          It finds barracas that were created from registrations and adds the missing Instagram information.
        </p>

        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={isDryRun}
              onChange={() => setIsDryRun(true)}
              className="text-blue-600"
            />
            <span className="text-sm font-medium">Dry Run (Preview only)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={!isDryRun}
              onChange={() => setIsDryRun(false)}
              className="text-blue-600"
            />
            <span className="text-sm font-medium">Run Migration (Make changes)</span>
          </label>
        </div>

        <button
          onClick={runMigration}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isDryRun
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRunning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          {isRunning
            ? 'Running...'
            : isDryRun
            ? 'Preview Migration'
            : 'Run Migration'
          }
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {isDryRun ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 mb-3">
                <Info className="h-5 w-5" />
                <span className="font-medium">Dry Run Results</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.barracasWithoutInstagram}
                  </div>
                  <div className="text-sm text-blue-700">Barracas without Instagram</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.registrationsWithInstagram}
                  </div>
                  <div className="text-sm text-blue-700">Registrations with Instagram</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {result.potentialMatches}
                  </div>
                  <div className="text-sm text-green-700">Potential Matches</div>
                </div>
              </div>

              {result.matches.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Matches that would be updated:</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {result.matches.map((match: any, index: number) => (
                      <div key={index} className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                        <span className="font-medium">"{match.barraca}"</span> → 
                        <span className="text-green-600"> @{match.instagram}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 mb-3">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Migration Completed</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {result.updated}
                  </div>
                  <div className="text-sm text-green-700">Barracas Updated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.totalBarracas}
                  </div>
                  <div className="text-sm text-blue-700">Total Barracas Checked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.totalRegistrations}
                  </div>
                  <div className="text-sm text-blue-700">Total Registrations Checked</div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-800 mb-2">Errors encountered:</h4>
                  <div className="space-y-1">
                    {result.errors.map((error: string, index: number) => (
                      <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstagramMigration;
