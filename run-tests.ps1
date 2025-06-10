# 發音評估應用程式 - 自動化測試執行腳本
# Windows PowerShell 版本

Write-Host "🚀 發音評估應用程式 - 自動化測試" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Yellow

# 檢查Node.js是否安裝
Write-Host "🔍 檢查系統環境..." -ForegroundColor Cyan
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 已安裝: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js 未安裝，請先安裝 Node.js" -ForegroundColor Red
    exit 1
}

# 檢查Playwright是否安裝
Write-Host "🔍 檢查 Playwright..." -ForegroundColor Cyan
if (Test-Path "node_modules\playwright") {
    Write-Host "✅ Playwright 已安裝" -ForegroundColor Green
} else {
    Write-Host "📦 安裝 Playwright..." -ForegroundColor Yellow
    npm install playwright
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Playwright 安裝成功" -ForegroundColor Green
    } else {
        Write-Host "❌ Playwright 安裝失敗" -ForegroundColor Red
        exit 1
    }
}

# 檢查開發伺服器
Write-Host "🔍 檢查開發伺服器..." -ForegroundColor Cyan
$response = $null
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ 開發伺服器運行正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 開發伺服器未運行，請先啟動: npm start" -ForegroundColor Red
    Write-Host "   在另一個終端中執行: npm start" -ForegroundColor Yellow
    Read-Host "按 Enter 繼續（確保伺服器已啟動）"
}

# 執行自動化測試
Write-Host "🧪 開始執行自動化測試..." -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Yellow

try {
    node playwright-test.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 測試執行完成！" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 測試執行過程中有警告" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 測試執行失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 顯示結果文件
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "📄 測試結果文件:" -ForegroundColor Cyan

if (Test-Path "test-report.md") {
    Write-Host "✅ 測試報告: test-report.md" -ForegroundColor Green
}

if (Test-Path "test-results.png") {
    Write-Host "✅ 測試截圖: test-results.png" -ForegroundColor Green
}

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "✨ 測試完成！請查看生成的報告和截圖。" -ForegroundColor Green

# 詢問是否開啟報告
$openReport = Read-Host "是否開啟測試報告？(y/n)"
if ($openReport -eq "y" -or $openReport -eq "Y") {
    if (Test-Path "test-report.md") {
        Start-Process "test-report.md"
    }
    if (Test-Path "test-results.png") {
        Start-Process "test-results.png"
    }
} 