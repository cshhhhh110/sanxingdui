param(
    [string]$BackendBase = "http://127.0.0.1:8889",
    [string]$FrontendBase = "http://127.0.0.1:8800"
)

$ErrorActionPreference = "Stop"

function ConvertFrom-Utf8Base64 {
    param([string]$Value)
    return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Value))
}

function Invoke-AgentRoute {
    param(
        [string]$Question,
        [string]$ExpectedRoute,
        [string]$ExpectedTool = ""
    )

    $body = @{
        message = $Question
        attachments = @()
        context = @{ surface = "agent-demo-regression" }
    } | ConvertTo-Json -Depth 8

    $response = Invoke-RestMethod `
        -Uri "$BackendBase/api/agent/route" `
        -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Body ([Text.Encoding]::UTF8.GetBytes($body))

    $data = $response.data
    $routeOk = $response.code -eq "200" -and $data.route -eq $ExpectedRoute
    $toolOk = [string]::IsNullOrWhiteSpace($ExpectedTool) -or $data.tool -eq $ExpectedTool

    [PSCustomObject]@{
        Case = $Question
        Pass = $routeOk -and $toolOk
        Route = $data.route
        Tool = $data.tool
        Expected = if ($ExpectedTool) { "$ExpectedRoute/$ExpectedTool" } else { $ExpectedRoute }
        Confidence = $data.confidence
    }
}

function Invoke-AttachmentRoute {
    $testFile = Join-Path $env:TEMP "agent-regression-note.txt"
    $note = "Sanxingdui bronze tree note. The document says bronze tree is related to ritual communication between heaven and earth."
    [System.IO.File]::WriteAllText($testFile, $note, [Text.Encoding]::UTF8)

    $uploadRaw = & curl.exe -s -X POST "$BackendBase/api/file/upload/temp" -F "file=@$testFile;type=text/plain"
    $upload = $uploadRaw | ConvertFrom-Json
    if ($upload.code -ne "200") {
        throw "Temp file upload failed: $uploadRaw"
    }

    $file = $upload.data
    $body = @{
        message = ConvertFrom-Utf8Base64 "6K+35oC757uT6L+Z5Liq5paH5qGj"
        attachments = @(@{
            fileId = [string]$file.id
            fileName = $file.originalName
            mediaType = "DOCUMENT"
            size = $file.fileSize
            mimeType = "text/plain"
            filePath = $file.filePath
        })
        context = @{ surface = "agent-demo-regression-attachment" }
    } | ConvertTo-Json -Depth 8

    $response = Invoke-RestMethod `
        -Uri "$BackendBase/api/agent/route" `
        -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Body ([Text.Encoding]::UTF8.GetBytes($body))

    $context = [string]$response.data.attachmentContext
    [PSCustomObject]@{
        Case = "uploaded txt summary"
        Pass = $response.code -eq "200" -and
            $response.data.route -eq "DIRECT_ANSWER" -and
            -not [string]::IsNullOrWhiteSpace($context) -and
            $context.Contains($note)
        Route = $response.data.route
        Tool = $response.data.tool
        Expected = "DIRECT_ANSWER with attachmentContext"
        Confidence = $response.data.confidence
    }
}

$routeCases = @(
    @{ Question = ConvertFrom-Utf8Base64 "5LuK5aSp5Yeg5Y+377yf"; ExpectedRoute = "DIRECT_ANSWER"; ExpectedTool = "" },
    @{ Question = ConvertFrom-Utf8Base64 "5oiQ6YO95aSp5rCU5oCO5LmI5qC377yf"; ExpectedRoute = "TOOL_CALL"; ExpectedTool = "get_weather" },
    @{ Question = ConvertFrom-Utf8Base64 "5omT5byA5ZWG5Z+O5pCc57Si6YeR6Z2i5YW35paH5Yib"; ExpectedRoute = "TOOL_CALL"; ExpectedTool = "search_product" },
    @{ Question = ConvertFrom-Utf8Base64 "5LiJ5pif5aCG56Wt56WA5Z2R5Li65LuA5LmI6YeN6KaB77yf"; ExpectedRoute = "RAG"; ExpectedTool = "" },
    @{ Question = ConvertFrom-Utf8Base64 "5omT5byA6YeR6Z2i5YW355qE5pe256m65bGV57q/"; ExpectedRoute = "TOOL_CALL"; ExpectedTool = "control_trail" }
)

$results = foreach ($case in $routeCases) {
    Invoke-AgentRoute @case
}

$attachmentResult = Invoke-AttachmentRoute

$expectedTools = @(
    "navigate_to",
    "search_product",
    "search_heritage",
    "control_trail",
    "get_weather",
    "get_current_datetime",
    "open_artifact_detail",
    "play_voice_intro"
)
$toolsResponse = Invoke-RestMethod -Uri "$BackendBase/api/agent/tools" -Method Get
$actualTools = @($toolsResponse.data | ForEach-Object { $_.name } | Sort-Object)
$expectedSortedTools = @($expectedTools | Sort-Object)
$toolDiff = @(Compare-Object -ReferenceObject $expectedSortedTools -DifferenceObject $actualTools)
$toolsPass = $toolsResponse.code -eq "200" -and $toolDiff.Count -eq 0

$knowledgeQuery = [uri]::EscapeDataString((ConvertFrom-Utf8Base64 "5LiJ5pif5aCG"))
$knowledge = Invoke-RestMethod `
    -Uri "$BackendBase/api/agent/knowledge/search?query=$knowledgeQuery&limit=1" `
    -Method Get

$aiChatPage = Invoke-WebRequest -Uri "$FrontendBase/ai-chat" -Method Get -UseBasicParsing

$results | Format-Table -AutoSize
$attachmentResult | Format-Table -AutoSize

$knowledgePass = $knowledge.code -eq "200" -and $knowledge.data.documents.Count -ge 1 -and
    -not [string]::IsNullOrWhiteSpace($knowledge.data.documents[0].obsidianUri)
$pagePass = $aiChatPage.StatusCode -eq 200 -and $aiChatPage.Content.Contains('id="app"')
$routePass = -not ($results | Where-Object { -not $_.Pass })
$attachmentPass = $attachmentResult.Pass

Write-Host ""
Write-Host "Knowledge search:" $(if ($knowledgePass) { "PASS" } else { "FAIL" })
Write-Host "AI chat page:" $(if ($pagePass) { "PASS" } else { "FAIL" })
Write-Host "Attachment route:" $(if ($attachmentPass) { "PASS" } else { "FAIL" })
Write-Host "Tool registry:" $(if ($toolsPass) { "PASS" } else { "FAIL: $($actualTools -join ', ')" })

if (-not ($routePass -and $attachmentPass -and $toolsPass -and $knowledgePass -and $pagePass)) {
    exit 1
}

Write-Host "Agent demo regression: PASS"
