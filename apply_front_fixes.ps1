# apply_front_fixes.ps1
$ErrorActionPreference = "Stop"

function Add-Import-IfMissing($filePath, $importLine) {
  $content = Get-Content $filePath -Raw
  if ($content -notmatch [regex]::Escape($importLine)) {
    if ($content -match "^(import[^\n]*\n)+" ) {
      $imports = $Matches[0]
      $rest = $content.Substring($imports.Length)
      $newContent = $imports + $importLine + "`n" + $rest
    } else {
      $newContent = $importLine + "`n" + $content
    }
    $newContent | Set-Content -Encoding UTF8 $filePath
    Write-Host "✓ Import agregado en $filePath"
  } else {
    Write-Host "• Import ya presente en $filePath"
  }
}

function Replace-Safe($filePath, $replacements) {
  if (!(Test-Path $filePath)) {
    Write-Warning "Saltado (no existe): $filePath"
    return
  }
  $orig = Get-Content $filePath -Raw
  Copy-Item $filePath "$filePath.bak" -Force
  $new = $orig
  foreach ($rep in $replacements) {
    $pattern = $rep.pattern
    $replace = $rep.replace
    $new = [System.Text.RegularExpressions.Regex]::Replace($new, $pattern, $replace)
  }
  if ($new -ne $orig) {
    $new | Set-Content -Encoding UTF8 $filePath
    Write-Host "✓ Modificado $filePath (backup: $filePath.bak)"
  } else {
    Write-Host "• Sin cambios en $filePath (coincidencias no encontradas)"
  }
}

# Helper (por si faltó)
$helperPath = "src/utils/safe.ts"
if (!(Test-Path $helperPath)) {
  New-Item -ItemType Directory -Force -Path (Split-Path $helperPath) | Out-Null
  @"
export const safeArr = <T = any>(v: unknown): T[] =>
  Array.isArray(v) ? (v as T[]) : [];
"@ | Set-Content -Encoding UTF8 $helperPath
  Write-Host "✓ Creado $helperPath"
} else {
  Write-Host "• Ya existe $helperPath"
}

$importLine = "import { safeArr } from '../../../utils/safe';"

# 1) ComparativoPrecios.tsx
$file1 = "src/components/modules/ComparativoPrecios.tsx"
if (Test-Path $file1) {
  Add-Import-IfMissing $file1 $importLine
  $reps1 = @(
    @{ pattern = '\bdatosComparativo\.length\b'; replace = 'safeArr(datosComparativo).length' },
    @{ pattern = '\bdatosComparativo\.reduce\('; replace = 'safeArr(datosComparativo).reduce(' },
    @{ pattern = '\blistasAnteriores\.length\b'; replace = 'safeArr(listasAnteriores).length' },
    @{ pattern = '\bincrementos\.length\b'; replace = 'safeArr(incrementos).length' },
    @{ pattern = '\bdecrementos\.length\b'; replace = 'safeArr(decrementos).length' },
    @{ pattern = '\bsinCambios\.length\b'; replace = 'safeArr(sinCambios).length' },
    @{ pattern = 'listaActual\.articulos\.length'; replace = 'safeArr(listaActual?.articulos).length' }
  )
  Replace-Safe $file1 $reps1
} else { Write-Warning "No se encontró $file1" }

# 2) Inicio.tsx
$file2 = "src/components/modules/Inicio.tsx"
if (Test-Path $file2) {
  Add-Import-IfMissing $file2 $importLine
  $reps2 = @(
    @{ pattern = '\barticulos\.length\b'; replace = 'safeArr(articulos).length' },
    @{ pattern = 'listaActual\.articulos\.length'; replace = 'safeArr(listaActual?.articulos).length' }
  )
  Replace-Safe $file2 $reps2
} else { Write-Warning "No se encontró $file2" }

# 3) ListaMayoristas.tsx
$file3 = "src/components/modules/ListaMayoristas.tsx"
if (Test-Path $file3) {
  Add-Import-IfMissing $file3 $importLine
  $reps3 = @(
    @{ pattern = '\bdatosTabla\.length\b'; replace = 'safeArr(datosTabla).length' }
  )
  Replace-Safe $file3 $reps3
} else { Write-Warning "No se encontró $file3" }

Write-Host "`nListo. Subí cambios con: git add -A; git commit -m 'front: safeArr fixes'; git push"