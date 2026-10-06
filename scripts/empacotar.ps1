$ErrorActionPreference = 'Stop'
$raizProjeto = Split-Path -Parent $PSScriptRoot
$pastaEntrega = Join-Path $raizProjeto 'entrega'
New-Item -ItemType Directory -Path $pastaEntrega -Force | Out-Null
$arquivoZip = Join-Path $pastaEntrega ('biblioteca-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.zip')
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($arquivoZip, 'Create')
try {
    # Lista explícita evita incluir credenciais, dependências e arquivos temporários.
    $arquivos = @('app.js', 'package.json', 'package-lock.json', 'README.md', '.gitignore')
    foreach ($pasta in @('config', 'models', 'routes', 'services', 'utils', 'public', 'scripts', 'tests', 'docs')) {
        foreach ($arquivo in Get-ChildItem -LiteralPath (Join-Path $raizProjeto $pasta) -File -Recurse) {
            $relativo = $arquivo.FullName.Substring($raizProjeto.Length + 1)
            if ($relativo -ne 'config\local.js') { $arquivos += $relativo }
        }
    }
    foreach ($relativo in $arquivos) {
        $origem = Join-Path $raizProjeto $relativo
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $origem, $relativo.Replace('\', '/')) | Out-Null
    }
    # O log da entrega começa vazio, sem informações da máquina de desenvolvimento.
    $zip.CreateEntry('logs/errors.log') | Out-Null
} finally {
    $zip.Dispose()
}
Write-Output "ZIP criado: $arquivoZip"
