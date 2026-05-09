import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useImportCSV } from '../../hooks/useTransactions'
import Spinner from '../shared/Spinner'
import type { CSVImportResponse } from '../../types'

interface Props {
  budgetId?: string
  onSuccess?: (result: CSVImportResponse) => void
}

export default function CSVImport({ budgetId, onSuccess }: Props) {
  const { mutate, isPending, data, error, reset } = useImportCSV()
  const onDrop = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    mutate({ file, budgetId }, { onSuccess: (res) => onSuccess?.(res) })
  }, [budgetId, mutate, onSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    disabled: isPending,
  })

  if (data) {
    return (
      <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/25 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-bold text-green-400 mb-1">Import réussi !</p>
        <p className="text-sm text-gray-400">
          <strong>{data.imported}</strong> transactions importées
          {data.skipped > 0 && <>, {data.skipped} ignorées (revenus / format incompatible)</>}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {Object.entries(data.category_totals).slice(0, 6).map(([cat, total]) => (
            <div key={cat} className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-500 capitalize">{cat}</p>
              <p className="text-sm font-bold">{Math.round(total)} €</p>
            </div>
          ))}
        </div>
        <button onClick={reset} className="mt-4 text-xs text-gray-500 hover:text-gray-300 transition">
          Importer un autre fichier
        </button>
      </div>
    )
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-indigo-400 bg-indigo-500/10'
            : 'border-white/20 bg-white/[0.02] hover:border-indigo-500/50 hover:bg-white/[0.04]'
        } ${isPending ? 'opacity-60 cursor-wait' : ''}`}
      >
        <input {...getInputProps()} />
        {isPending ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner size={32} />
            <p className="text-sm text-gray-400">Analyse en cours...</p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-3">{isDragActive ? '📂' : '📁'}</div>
            <p className="font-semibold text-sm text-gray-300 mb-1">
              {isDragActive ? 'Dépose ton fichier ici' : 'Importer un relevé bancaire CSV'}
            </p>
            <p className="text-xs text-gray-500">Boursorama · BNP Paribas · Revolut · Format générique</p>
            <p className="text-xs text-gray-600 mt-3">Glisse-dépose ou clique pour choisir</p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400 text-center">
          ⚠️ Erreur : {(error as any)?.response?.data?.detail || 'Fichier non reconnu'}
        </p>
      )}

      <p className="text-[10px] text-gray-600 text-center mt-3">
        🔒 Tes données restent sur ton appareil. Aucun envoi à des tiers.
      </p>
    </div>
  )
}
